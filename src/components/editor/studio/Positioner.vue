<template>
  <v-card id="positioner">
    <v-divider/>
    <span class="app-title light--text subheading">Glyph position:</span>
    <div class="move-resize-commands">
      <v-slider label="X" min="0" max="1" step="0.05" v-model="leftShiftSliderValue" class="control-item position-slider"
                @change="planLeftShift">
        <template v-slot:append>
          <v-text-field
                  v-model="leftShiftSliderValue"
                  class="mt-0 pt-0 num-field"
                  hide-details
                  single-line
                  type="number"
          ></v-text-field>
        </template>
      </v-slider>
      <v-slider label="Y" min="0" max="1" step="0.05" v-model="topShiftSliderValue" class="control-item position-slider"
                @change="planTopShift">
        <template v-slot:append>
          <v-text-field
                  v-model="topShiftSliderValue"
                  class="mt-0 pt-0 num-field"
                  hide-details
                  single-line
                  type="number"
          ></v-text-field>
        </template>
      </v-slider>
      <v-slider label="W" min="0" max="1" step="0.05" v-model="widthProportionSliderValue" class="control-item position-slider"
                @change="planWidthResize">
        <template v-slot:append>
          <v-text-field
                  v-model="widthProportionSliderValue"
                  class="mt-0 pt-0 num-field"
                  hide-details
                  single-line
                  type="number"
          ></v-text-field>
        </template>
      </v-slider>
      <v-slider label="H" min="0" max="1" step="0.05" v-model="heightProportionSliderValue" class="control-item position-slider"
                @change="planHeightResize">
        <template v-slot:append>
          <v-text-field
                  v-model="heightProportionSliderValue"
                  class="mt-0 pt-0 num-field"
                  hide-details
                  single-line
                  type="number"
          ></v-text-field>
        </template>
      </v-slider>
      <div class="move-resize-commands move-options">
        <v-checkbox class="control-item" label="Children" color="secondary" v-model="changeChildrenBoxValue"/>
        <v-btn class="control-item light primary--text" icon @click="planCentering">
          <v-icon>adjust</v-icon>
        </v-btn>
        <v-btn class="control-item secondary dark--text" icon @click="resetOriginalPosition">
          <v-icon>undo</v-icon>
        </v-btn>
<!--        !!! TOOLTIPS HERE MAKE BUTTONS DISAPPEAR ???-->
<!--        <v-tooltip-->
<!--                open-delay="700"-->
<!--                bottom-->
<!--        >-->
<!--          <v-btn class="control-item light primary&#45;&#45;text" icon @click="planCentering">-->
<!--            <v-icon>adjust</v-icon>-->
<!--          </v-btn>-->
<!--          <span>Shift all glyphs back to their original drawing position</span>-->
<!--        </v-tooltip>-->
<!--        <v-tooltip-->
<!--                class="tooltip"-->
<!--                open-delay="700"-->
<!--                bottom-->
<!--        >-->
<!--              <v-btn class="control-item light primary&#45;&#45;text" icon @click="planCentering">-->
<!--                <v-icon>adjust</v-icon>-->
<!--              </v-btn>-->
<!--          <span>Undo last glyph movement</span>-->
<!--        </v-tooltip>-->
      </div>
    </div>
    <v-divider/>
  </v-card>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import debounce from 'debounce'
import Deque from 'double-ended-queue'

function initializePositionStore () {
  return {
    leftShift: 0.0,
    topShift: 0.0,
    widthProportion: 1.0,
    heightProportion: 1.0,
    steps: new Deque(10),
    changeChildren: false
  }
}

export default {
  name: 'Positioner',
  props: {
    shapeName: {type: String, default: '_default'}
  },
  data () {
    return {
      shapeName_: '_default',
      positionStore: {_default: initializePositionStore()},
      // getters and setters for position
      // getter is called on data object on initialization, which doesn't have the 'shapeName' property
      get leftShift () {return this.positionStore[this.shapeName_].leftShift},
      get topShift () {return this.positionStore[this.shapeName_].topShift},
      get widthProportion () {return this.positionStore[this.shapeName_].widthProportion},
      get heightProportion () {return this.positionStore[this.shapeName_].heightProportion},
      get steps () {return this.positionStore[this.shapeName_].steps},
      get changeChildren () {return this.positionStore[this.shapeName_].changeChildren},
      set leftShift (leftShift) {this.positionStore[this.shapeName_].leftShift = leftShift},
      set topShift (topShift) {this.positionStore[this.shapeName_].topShift = topShift},
      set widthProportion (widthProportion) {this.positionStore[this.shapeName_].widthProportion = widthProportion},
      set heightProportion (heightProportion) {this.positionStore[this.shapeName_].heightProportion = heightProportion},
      set steps (steps) {this.positionStore[this.shapeName_].steps = steps},
      set changeChildren (changeChildren) {this.positionStore[this.shapeName_].changeChildren = changeChildren},
      leftShiftSliderValue: 0.0,
      topShiftSliderValue: 0.0,
      widthProportionSliderValue: 1.0,
      heightProportionSliderValue: 1.0,
      changeChildrenBoxValue: false,
      totalGlyphNumStore: 0,
      glyphNamesStore: new Set (),
      positionStored: false
    }
  },
  computed: {
    ...mapState({
      glyphs: state => state.glyph.project.glyphs,
      totalGlyphNum: state => state.glyph.project.totalGlyphNum,
      glyphNames: state => state.glyph.project.glyphNames
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
      this.leftShift = this.leftShiftSliderValue
      this.steps.push({
        transform: 'shift',
        parameters: [this.leftShift, null, {
          setValues: true,
          drawing: false,
          scale: false,
          children: false,
          redraw: true}]
      })
      this.applySteps()
    }, 400),
    planTopShift: debounce.call(this, function () {
      this.topShift = this.topShiftSliderValue
      this.steps.push({
        transform: 'shift',
        parameters: [null, this.topShift, {
          setValues: true,
          drawing: false,
          scale: false,
          children: false,
          redraw: true}]
      })
      this.applySteps()
    }, 400),
    planWidthResize: debounce.call(this, function () {
      this.widthProportion = this.widthProportionSliderValue
      this.steps.push({
        transform: 'resize',
        parameters: [this.widthProportion, null, {
          setValues: true,
          drawing: false,
          center: false,
          children: false,
          redraw: true}]
      })
      this.applySteps()
    }, 400),
    planHeightResize: debounce.call(this, function () {
      this.heightProportion = this.heightProportionSliderValue
      this.steps.push({
        transform: 'resize',
        parameters: [null, this.heightProportion, {
          setValues: true,
          drawing: false,
          center: false,
          children: false,
          redraw: true}]
      })
      this.applySteps()
    }, 400),
    planCentering () {
      this.steps.push({
        transform: 'toCenter',
        parameters: [true, true, {
          setValues: true,
          drawing: false,
          center: false,
          children: false}]
      })
      this.applySteps()
      this.leftShift = this.meanShapeBounds.leftShift
      this.topShift = this.meanShapeBounds.topShift
    },
    resetOriginalPosition () {
      this.steps.push({
        transform: 'shift',
        parameters: [
          this.originalShapePositions[0][this.shapeName_].leftShift,
          this.originalShapePositions[0][this.shapeName_].topShift,
          {setValues: true, scale: false, children: false, redraw: false}
          ]
      })
      this.applySteps()
    },
    applySteps: debounce.call(this, function () { // once steps are sent to glyphs, they are cleared up
      this.changeChildren = this.changeChildrenBoxValue
      this.changeGlyphPosition({
        steps: this.steps.toArray(),
        shapeSelector: this.shapeName,
        children: this.changeChildren
      })
      this.steps.clear()
    }, 600)
  },
  watch: {
    shapeName () {
      this.shapeName_ = this.shapeName // shapeName is version of shapeName on data object, used by getters defined above
      if (!this.positionStore[this.shapeName_]) {
        this.positionStore[this.shapeName_] = initializePositionStore()
      }
      // reset slider values with values for current shape
      this.leftShiftSliderValue = this.leftShift
      this.topShiftSliderValue = this.topShift
      this.widthProportionSliderValue = this.widthProportion
      this.heightProportionSliderValue = this.heightProportion
    },
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
