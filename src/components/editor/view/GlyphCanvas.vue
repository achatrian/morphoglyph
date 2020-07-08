<template lang="html">
  <canvas id="glyph-canvas" v-resize="resizeCanvasToView"/>
</template>

<script>
import paper from 'paper'
import {mapState, mapActions} from 'vuex'
import {debounce} from 'debounce'

export default {
  name: 'GlyphCanvas',
  data () {
    return {
      intervalRef: null
    }
  },
  computed: {
    ...mapState({
      boundingRects: state => state.app.boundingRects,
      numDisplayedGlyphs: state => state.app.numDisplayedGlyphs,
      orderedNormalizedData: state => state.backend.orderedNormalizedData,
      glyphs: state => state.glyph.project.glyphs,
      currentPage: state => state.app.currentPage,
      redrawing: state => state.glyph.redrawing,
      glyphBinder: state => state.app.glyphBinder,
      shapeManager: state => state.app.shapeManager,
      chart: state => state.app.chart
    }),
    glyphScope () {
      for (let i = 0; i < 3; i++) {
        const scope = paper.PaperScope.get(i)
        if (scope.view.element.id === 'glyph-canvas') {
          return scope
        }
      }
      throw Error("No scope bound to element 'glyph-canvas'")
    }
  },
  methods: {
    ...mapActions({
      setLayersUp: 'glyph/setLayersUp',
      updateGlyphArrangement: 'app/updateGlyphArrangement',
      drawGlyph: 'glyph/drawGlyph',
      moveGlyph: 'glyph/moveGlyph',
      resetGlyph: 'glyph/resetGlyph',
      addCaption: 'glyph/addCaption',
      drawChart: 'app/drawChart'
    }),
    resizeCanvasToView () {
      let view = document.getElementById('view')
      if (paper.view !== null) {
        paper.view.viewSize.width = view.offsetWidth // avoid using DOM API if possible
        paper.view.viewSize.height = view.offsetHeight
        console.log('Canvas resized')
      }
      // TODO fix method name to include chart functionality
      if (this.chart) {
        this.drawChart()
      }
    },
    // automatically called function that keeps the view populated with glyphs when bounding rectangles change
    placeGlyphs: debounce.call(
      this, // VueComponent context is bound to anonymous function inside debounce
      function () {
        let numDrawn = 0
        let numMoved = 0
        const numDrawnGlyphs = this.glyphs.reduce((drawing, nextGlyph) => drawing + Number(nextGlyph.drawn), 0)
        if (numDrawnGlyphs < this.numDisplayedGlyphs) {
          // it either draws glyphs out ...
          for (const [idx, boundingRect] of Object.entries(this.boundingRects)) {
            const idxNum = Number(idx)
            const glyphIndex = (this.currentPage - 1) * this.numDisplayedGlyphs + idxNum // idx is relative to glyph position in page
            if (glyphIndex < this.glyphs.length && boundingRect.width > 0 && boundingRect.height > 0 &&
                    !(this.glyphs[glyphIndex].drawn)) {
              this.drawGlyph({
                glyphIndex: glyphIndex,
                boundingRect: boundingRect
              })
              this.addCaption({
                glyphIndex: glyphIndex,
                boundingRect: boundingRect
              })
              numDrawn++
            }
          }
          if (numDrawn > 0) {
            console.log(`${numDrawn} glyphs were drawn`)
          }
          this.$emit('update:drawing', false)
        } else {
          this.$emit('update:drawing', false)
          // ... or moves them the rectangles' position has changed
          for (const [idx, boundingRect] of Object.entries(this.boundingRects)) {
            const idxNum = Number(idx)
            const glyphIndex = (this.currentPage - 1) * this.numDisplayedGlyphs + idxNum // idx is relative to glyph position in page
            if (glyphIndex < this.glyphs.length
                    && boundingRect.width > 0
                    && boundingRect.height > 0
                    && this.glyphs[glyphIndex].drawn
                    && this.glyphs[glyphIndex].mainPath.visible) {
              this.moveGlyph({
                glyphIndex: glyphIndex,
                boundingRect: boundingRect
              })
              numMoved++
            }
          }
          if (numMoved > 0) {
            console.log(`${numMoved} glyphs were moved`)
          }
        }
      },
      800
    ), // debouncing to speed up application -- don't need to move glyphs at every resize event
    // function to forcefully redraw glyphs on command
    redrawGlyphs () {
      let rectGenIds = []
      this.boundingRects.forEach(({generator}) => rectGenIds.push(generator.id))
      const allEqual = arr => arr.every(v => v === arr[0])
      if (!allEqual(rectGenIds)) { throw new Error("Glyph come from mismatching generators") }
      this.glyphs.forEach((glyph, glyphIndex) => this.resetGlyph({
        glyphIndex: glyphIndex,
        box: false // use existing box to draw glyph
      })) // reset all glyphs
      let numRedrawn = 0
      this.boundingRects.forEach((boundingRect, idx) => {
        let glyphIndex = (this.currentPage - 1) * this.numDisplayedGlyphs + idx // idx is relative to glyph position in page
        if (glyphIndex < this.glyphs.length && boundingRect.width > 0 && boundingRect.height > 0) {
          this.drawGlyph({
            glyphIndex: glyphIndex,
            boundingRect: boundingRect
          })
          this.addCaption({
            glyphIndex: glyphIndex,
            boundingRect: boundingRect
          })
          numRedrawn++
        }
      })
      if (numRedrawn > 0) { console.log(`${numRedrawn} glyphs were redrawn`) }
      this.$emit('update:drawing', false)
    },
    toggleDrawingBoxes () {
      for (const glyph of this.glyphs) {
        glyph.getItem('drawingBox').visible = true
      }
    },
    // check whether glyphs drawing rects and app bounding rects do not match
    glyphsNeedUpdate () {
      return this.glyphs.some(glyph => {
      const update = glyph.checkBoxUpdate()
      return update.box
    })
    },
    setAutomaticBoxFit (on) {
      if (on && !(this.intervalRef)) {
        console.log('Turning automatic box fit on')
        this.intervalRef = setInterval(
          function (canvasComponent) {
            if (canvasComponent.glyphsNeedUpdate()) {
              console.log('automatic box-to-glyph fit')
              canvasComponent.placeGlyphs()
            }
          },
          10000,
          this
        )
      } else {
        console.log('Turning automatic box fit off')
        clearInterval(this.intervalRef)
        this.intervalRef = null
      }
    }
  },
  watch: {
    numDisplayedGlyphs () {
      // in fluid view, each time number of glyphs changes, whole grid is redrawn
      this.updateGlyphArrangement()
      if (this.boundingRects.length > 0) {
        this.$emit('update:drawing', true)
      }
      this.redrawGlyphs()
    },
    boundingRects: {
      handler () {
        if (this.glyphs.length >= this.boundingRects.length) {
          this.$emit('update:drawing', true)
          this.placeGlyphs() // place glyphs if there are glyphs to place
        }
      },
      deep: true
    },
    currentPage () {
      this.$emit('update:drawing', true)
      this.redrawGlyphs()
    },
    redrawing () {
      if (this.redrawing) {
        this.$emit('update:drawing', true)
        this.redrawGlyphs()
      }
    },
    // turn off automatic box fitting when full screen cards are activated
    glyphBinder () {
      this.setAutomaticBoxFit(!(this.glyphBinder || this.shapeManager))
    },
    shapeManager () {
      this.setAutomaticBoxFit(!(this.glyphBinder || this.shapeManager))
    }
  },
  mounted () {
    // Setup the annotation canvas, this is a PaperJS instance targeting the
    // canvas DOM element: 'glyph-canvas'
    // NB paper.Symbol overwrites Symbol object in native code and hinders use 'for .. of', if install() is called on window
    window.paper = {} // call on custom object attribute instead
    paper.install(window.paper) // easier debugging - not used in production TODO make this an if statement?
    // NB paper object above refers always to the same scope, unlike paper object used in drawing
    paper.setup('glyph-canvas')
    paper.activate()
    this.setLayersUp() // setting up all the needed layers
    this.resizeCanvasToView() // fit canvas to dimensions
    // ensure that glyphs are fitted to boxes all the time
    // this.setAutomaticBoxFit(true)
   this.setAutomaticBoxFit(true)
  },
  // to help debugging, whenever canvas is re-rendered, redraw glyphs
  updated () {
    this.$emit('update:drawing', true)
    this.updateGlyphArrangement()
    this.redrawGlyphs()
  }
}
</script>

<style scoped>
#glyph-canvas {
  position: absolute;
  z-index: 2
}
</style>
