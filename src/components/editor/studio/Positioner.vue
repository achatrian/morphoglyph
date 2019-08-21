<template>
  <v-card id="positioner">
    <v-divider/>
    <span class="app-title light--text subheading">Glyph position:</span>
    <div class="move-resize-commands">
      <v-slider label="X" min="0" max="1" step="0.05" v-model="leftShift" class="control-item position-slider"
                @change="planLeftShift">
        <template v-slot:append>
          <v-text-field
                  v-model="leftShift"
                  class="mt-0 pt-0 num-field"
                  hide-details
                  single-line
                  type="number"
          ></v-text-field>
        </template>
      </v-slider>
      <v-slider label="Y" min="0" max="1" step="0.05" v-model="topShift" class="control-item position-slider"
                @change="planTopShift">
        <template v-slot:append>
          <v-text-field
                  v-model="topShift"
                  class="mt-0 pt-0 num-field"
                  hide-details
                  single-line
                  type="number"
          ></v-text-field>
        </template>
      </v-slider>
      <v-slider label="W" min="0" max="1" step="0.05" v-model="widthProportion" class="control-item position-slider"
                @change="planWidthResize">
        <template v-slot:append>
          <v-text-field
                  v-model="widthProportion"
                  class="mt-0 pt-0 num-field"
                  hide-details
                  single-line
                  type="number"
          ></v-text-field>
        </template>
      </v-slider>
      <v-slider label="H" min="0" max="1" step="0.05" v-model="heightProportion" class="control-item position-slider"
                @change="planHeightResize">
        <template v-slot:append>
          <v-text-field
                  v-model="heightProportion"
                  class="mt-0 pt-0 num-field"
                  hide-details
                  single-line
                  type="number"
          ></v-text-field>
        </template>
      </v-slider>
      <div class="move-resize-commands move-options">
        <v-checkbox class="control-item" label="Children" color="secondary" v-model="changeChildren"/>
        <v-btn class="control-item light primary--text" icon @click="planCentering">
          <v-icon>adjust</v-icon>
        </v-btn>
        <v-btn class="control-item secondary dark--text" icon @click="resetOriginalPosition">
          <v-icon>undo</v-icon>
        </v-btn>
      </div>
    </div>
    <v-divider/>
  </v-card>
</template>

<script>
import {mapState, mapActions, mapGetters} from 'vuex'
import debounce from 'debounce'
import Deque from 'double-ended-queue'

export default {
  name: 'Positioner',
  props: {
    shapeName: String
  },
  data () {
    return {
      leftShift: 0.0,
      topShift: 0.0,
      widthProportion: 1.0,
      heightProportion: 1.0,
      steps: new Deque(10),
      changeChildren: false,
      totalGlyphNumStore: 0,
      glyphNamesStore: new Set (),
      positionStored: false
    }
  },
  computed: {
    ...mapState({
      glyphs: state => state.glyph.project.glyphs
    }),
    ...mapGetters({
      totalGlyphNum: 'glyph/totalGlyphNum',
      glyphNames: 'glyph/glyphNames'
    }),
    meanShapeBounds () {
      const leftShiftSum = this.glyphs.reduce((total, nextGlyph) => {
        if (nextGlyph.drawn && nextGlyph.box) {
          const shift = (nextGlyph.box.bounds.x - nextGlyph.box.drawingBounds.x) / nextGlyph.box.drawingBounds.width
          return total + shift
        } else {
          return total
        }
      }, 0.0)
      const topShiftSum = this.glyphs.reduce((total, nextGlyph) => {
        if (nextGlyph.drawn && nextGlyph.box) {
          const shift = (nextGlyph.box.bounds.y - nextGlyph.box.drawingBounds.y) / nextGlyph.box.drawingBounds.height
          return total + shift
        } else {
          return total
        }
      }, 0.0)
      const widthProportionSum = this.glyphs.reduce((total, nextGlyph) => {
        if (nextGlyph.drawn && nextGlyph.box) {
          const proportion = nextGlyph.box.bounds.width / nextGlyph.box.drawingBounds.width
          return total + proportion
        } else {
          return total
        }
      }, 1.0)
      const heightProportionSum = this.glyphs.reduce((total, nextGlyph) => {
        if (nextGlyph.drawn && nextGlyph.box) {
          const proportion = nextGlyph.box.bounds.height / nextGlyph.box.drawingBounds.height
          return total + proportion
        } else {
          return total
        }
      }, 1.0)
      const numDrawn = this.glyphs.reduce(
              (total, nextGlyph) => total + Number(nextGlyph.drawn && Boolean(nextGlyph.box)), 1)
      return {
        leftShift: leftShiftSum / numDrawn,
        topShift : topShiftSum / numDrawn,
        widthProportion: widthProportionSum / numDrawn,
        heightProportion: heightProportionSum / numDrawn
      }
    },
    originalShapePositions () {
      if (([...this.glyphNames].some(name => !this.glyphNamesStore.has(name)) ||
              [...this.glyphNamesStore].some(name => !this.glyphNames.has(name)) ||
              this.totalGlyphNum !== this.totalGlyphNumStore) && !this.positionStored
      ) {
        let originalShapePositions = []
        for (let layerGlyph of this.glyphs) {
          let layerPositions = {}
          if (layerGlyph.drawn && Boolean(layerGlyph.box)) {
            for (let glyph of [...layerGlyph.iter()]) {
              layerPositions[glyph.name] = Object.assign({}, glyph.box.shapePositions)
            }
          }
          originalShapePositions.push(layerPositions)
        }
        return originalShapePositions
      } else {
        return [] // FIXME returning the same value leads to error
      }
    }
  },
  methods: {
    ...mapActions({
      setShapePosition: 'glyph/setShapePosition',
      changeGlyphPosition: 'glyph/changeGlyphPosition'
    }),
    planLeftShift: debounce.call(this, function () {
      this.steps.push({
        transform: 'shift',
        parameters: [this.leftShift, null, {setValues: true, scale: false, children: false, redraw: true}]
      })
      this.applySteps()
    }, 400),
    planTopShift: debounce.call(this, function () {
      this.steps.push({
        transform: 'shift',
        parameters: [null, this.topShift, {setValues: true, scale: false, children: false, redraw: true}]
      })
      this.applySteps()
    }, 400),
    planWidthResize: debounce.call(this, function () {
      this.steps.push({
        transform: 'resize',
        parameters: [this.widthProportion, null, {setValues: true, center: false, children: false, redraw: true}]
      })
      this.applySteps()
    }, 400),
    planHeightResize: debounce.call(this, function () {
      this.steps.push({
        transform: 'resize',
        parameters: [null, this.heightProportion, {setValues: true, center: false, children: false, redraw: true}]
      })
      this.applySteps()
    }, 400),
    planCentering () {
      this.steps.push({
        transform: 'toCenter',
        parameters: [true, true, {setValues: true, center: false, children: false}]
      })
      this.applySteps()
      this.leftShift = this.meanShapeBounds.leftShift
      this.topShift = this.meanShapeBounds.topShift
    },
    resetOriginalPosition () {
      this.steps.push({
        transform: 'shift',
        parameters: [
          this.originalShapePositions[0][this.shapeName].leftShift,
          this.originalShapePositions[0][this.shapeName].topShift,
          {setValues: true, scale: false, children: false, redraw: false}
          ]
      })
      this.applySteps()
    },
    applySteps: debounce.call(this, function () { // once steps are sent to glyphs, they are cleared up
      this.changeGlyphPosition({
        steps: this.steps.toArray(),
        shapeSelector: this.shapeName,
        children: this.changeChildren
      })
      this.steps.clear()
    }, 600)
  },
  watch: {
    meanShapeBounds: debounce.call(this, function () {
      this.leftShift = this.meanShapeBounds.leftShift
      this.topShift = this.meanShapeBounds.topShift
      this.widthProportion = this.meanShapeBounds.widthProportion
      this.heightProportion = this.meanShapeBounds.heightProportion
    }, 1000),
    glyph () {
      this.glyphNamesStore = this.glyphNames
      this.totalGlyphNumStore = this.totalGlyphNum
    },
    originalShapePositions () {
      if (this.originalShapePositions.length > 0 && !this.positionStored) {
        this.positionStored = true
      }
    }
  }
}
</script>

<style scoped>
  .move-resize-commands{
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    margin: auto;
  }

  .position-slider{
    padding: 0 0 0 10px;
  }

  .control-item{
    max-width: 150px;
  }

  .num-field{
    margin: 0 5px 10px 5px;
    width: 40px;
    font-size: 12px
  }

  .move-options{
    justify-content: space-around;
    flex-wrap: nowrap;
  }

  .app-title{
    display: block;
    margin-left: 5%;
  }
</style>
