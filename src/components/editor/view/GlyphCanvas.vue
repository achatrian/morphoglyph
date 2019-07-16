<template lang="html">
  <canvas id="glyph-canvas" v-resize="resizeCanvasToView"/>
</template>

<script>
import paper from 'paper'
import {mapState, mapActions} from 'vuex'
import {debounce} from 'debounce'

export default {
  name: 'GlyphCanvas',
  computed: {
    ...mapState({
      boundingRects: state => state.app.boundingRects,
      numDisplayedGlyphs: state => state.app.numDisplayedGlyphs,
      normalizedData: state => state.backend.normalizedData,
      glyphs: state => state.glyph.project.glyphs,
      currentPage: state => state.app.currentPage,
      redrawing: state => state.glyph.redrawing
    })
  },
  methods: {
    ...mapActions({
      setLayersUp: 'glyph/setLayersUp',
      updateGrid: 'app/updateGrid',
      drawGlyph: 'glyph/drawGlyph',
      moveGlyph: 'glyph/moveGlyph',
      resetGlyph: 'glyph/resetGlyph',
      addCaption: 'glyph/addCaption'
    }),
    resizeCanvasToView () {
      let view = document.getElementById('view')
      if (paper.view !== null) {
        paper.view.viewSize.width = view.offsetWidth // avoid using DOM API if possible
        paper.view.viewSize.height = view.offsetHeight
        console.log('Canvas resized')
      }
    },
    placeGlyphs: debounce.call(
      this, // VueComponent context is bound to anonymous function inside debounce
      function () {
        let numDrawn = 0
        let numMoved = 0
        // either draw paths ...
        if (!(this.glyphs.slice(0, this.numDisplayedGlyphs).every(glyph => glyph.drawn))) { // all available docks have drawn glyph
          this.boundingRects.forEach((boundingRect, idx) => {
            let glyphIndex = (this.currentPage - 1) * this.numDisplayedGlyphs + idx // idx is relative to glyph position in page
            if (glyphIndex < this.glyphs.length && boundingRect.width > 0 && boundingRect.height > 0 &&
               !(this.glyphs[glyphIndex].drawn)) {
              this.drawGlyph({
                glyphIndex: glyphIndex,
                boundingRect: boundingRect
              })
              numDrawn++
            }
          })
          if (numDrawn > 0) { console.log(`${numDrawn} glyphs were drawn`) }
        } else { // ... or move them if position of rectangles has changed
          this.boundingRects.forEach((boundingRect, idx) => {
            let glyphIndex = (this.currentPage - 1) * this.numDisplayedGlyphs + idx // idx is relative to glyph position in page
            if (glyphIndex < this.glyphs.length) {
              this.moveGlyph({
                glyphIndex: glyphIndex,
                boundingRect: boundingRect
              })
              numMoved++
            }
          })
          if (numMoved > 0) { console.log(`${numMoved} glyphs were moved`) }
        }
      },
      450
    ), // debouncing to speed up application -- don't need to move glyphs at every resize event
    redrawGlyphs () { // reset and draw all glyphs
      let rectGenIds = []
      this.boundingRects.forEach(({generator}) => rectGenIds.push(generator.id))
      const allEqual = arr => arr.every(v => v === arr[0])
      if (!allEqual(rectGenIds)) { throw Error("Glyph come from mismatching generators") }
      this.glyphs.forEach((glyph, glyphIndex) => this.resetGlyph(glyphIndex)) // reset all glyphs
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
    }
  },
  watch: {
    numDisplayedGlyphs () {
      // in fluid view, each time number of glyphs changes, whole grid is redrawn
      this.updateGrid()
      this.redrawGlyphs()
    },
    boundingRects: {
      handler () {
        if (this.glyphs.length >= this.boundingRects.length) {
          this.placeGlyphs() // place glyphs if there are glyphs to place
        }
      },
      deep: true
    },
    currentPage () {
      this.redrawGlyphs()
    },
    redrawing () {
      if (this.redrawing) { this.redrawGlyphs() }
    }
  },
  mounted () {
    // Setup the annotation canvas, this is a PaperJS instance targeting the
    // canvas DOM element: 'glyph-canvas'
    //paper.install(window) // easier debugging - not actually used
    // NB paper.Symbol overwrites Symbol object in native code and hinders use 'for .. of'
    paper.setup('glyph-canvas')
    paper.activate()
    this.setLayersUp() // setting up all the needed layers
    this.resizeCanvasToView() // fit canvas to dimensions
  }
}
</script>

<style scoped>
#glyph-canvas {
  position: absolute;
  z-index: 2
}
</style>
