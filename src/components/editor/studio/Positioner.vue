<template>
  <v-card id="positioner">
    <v-divider/>
    <div class="move-resize-commands">
      <v-slider label="Horizontal" min="1" max="3" step="1" v-model="leftShiftSliderValue" class="control-item position-slider"
                @change="planLeftShift">
        <template v-slot:append>
          <v-text-field
                  v-model="leftShiftSliderValue"
                  class="mt-0 pt-0 num-field side-text"
                  height="18px"
                  hide-details
                  single-line
                  type="number"
                  :rules="[acceptedValue]"
          ></v-text-field>
        </template>
      </v-slider>
      <v-slider label="Vertical" min="1" max="3" step="1" v-model="topShiftSliderValue" class="control-item position-slider"
                @change="planTopShift">
        <template v-slot:append>
          <v-text-field
                  v-model="topShiftSliderValue"
                  class="mt-0 pt-0 num-field"
                  height="18px"
                  hide-details
                  single-line
                  type="number"
                  :rules="[acceptedValue]"
          ></v-text-field>
        </template>
      </v-slider>
      <v-slider label="Scale" min="1" max="3" step="1" v-model="scaleSliderValue" class="control-item position-slider"
                @change="planWidthResize(); planHeightResize()">
        <template v-slot:append>
          <v-text-field
                  v-model="scaleSliderValue"
                  class="mt-0 pt-0 num-field"
                  height="18px"
                  hide-details
                  single-line
                  type="number"
                  :rules="[acceptedValue]"
          ></v-text-field>
        </template>
      </v-slider>
      <div class="move-resize-commands move-options">
<!--        <v-checkbox class="control-item" label="Children" color="secondary" v-model="changeChildrenBoxValue"/>-->
        <v-btn class="control-item light primary--text" icon @click="planCentering">
          <v-icon>adjust</v-icon>
        </v-btn>
<!--        <v-btn class="control-item secondary dark&#45;&#45;text" icon @click="resetOriginalPosition">-->
<!--          <v-icon>undo</v-icon>-->
<!--        </v-btn>-->

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
    leftShift: 0,
    topShift: 0,
    widthProportion: 1,
    heightProportion: 1,
    steps: new Deque(10),
    changeChildren: false,
  }
}

export default {
  name: 'Positioner',
  props: {
    shapeName: {type: String, default: '_default'}
  },
  data () {
    return {
      acceptedValue: number => 0 < number < 4,
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
      leftShiftSliderValue: 2,
      topShiftSliderValue: 2,
      scaleSliderValue: 3,
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
    originalShapePositions () {
      if (([...this.glyphNames].some(name => !this.glyphNamesStore.has(name)) ||
              [...this.glyphNamesStore].some(name => !this.glyphNames.has(name)) ||
              this.totalGlyphNum !== this.totalGlyphNumStore) && !this.positionStored
      ) {
        let originalShapePositions = []
        for (const layerGlyph of this.glyphs) {
          let layerPositions = {}
          if (layerGlyph.drawn && Boolean(layerGlyph.box)) {
            for (const glyph of [...layerGlyph.iter()]) {
              layerPositions[glyph.name] = {...glyph.box.shapePositions}
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
      changeGlyphPosition: 'glyph/changeGlyphPosition',
      setProgressCircleState: 'app/setProgressCircleState'
    }),
    planLeftShift: debounce.call(this, function () {
      this.leftShift = this.leftShiftSliderValue
      this.steps.push({
        transform: 'relativeShift',
        parameters: [this.leftShift, null, {
          setValues: true,
          drawing: false,
          scale: false,
          children: false,
          redraw: false}]
      })
      this.applySteps()
    }, 200),
    planTopShift: debounce.call(this, function () {
      this.topShift = this.topShiftSliderValue
      this.steps.push({
        transform: 'relativeShift',
        parameters: [null, this.topShift, {
          setValues: true
        }]
      })
      this.applySteps()
    }, 200),
    planWidthResize: debounce.call(this, function () {
      this.widthProportion = this.scaleSliderValue/3
      this.steps.push({
        transform: 'resize',
        parameters: [this.widthProportion, null, {
          setValues: true,
          setScale: this.scaleSliderValue
        }]
      })
      this.applySteps()
    }, 200),
    planHeightResize: debounce.call(this, function () {
      this.heightProportion = this.scaleSliderValue/3
      this.steps.push({
        transform: 'resize',
        parameters: [null, this.heightProportion, {
          setValues: true,
          setScale: this.scaleSliderValue
        }]
      })
      this.applySteps()
    }, 200),
    planCentering () {
      this.steps.push({
        transform: 'toCenter',
        parameters: [true, true, {
          setValues: true
        }]
      })
      setTimeout(this.applySteps, 100)
      this.leftShift = 2
      this.topShift = 2
      this.leftShiftSliderValue = 2
      this.topShiftSliderValue = 2
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
      this.setProgressCircleState(true)
      setTimeout(function (this_) {
        this_.changeChildren = this_.changeChildrenBoxValue
        this_.changeGlyphPosition({
          steps: this_.steps.toArray(),
          shapeSelector: this_.shapeName,
          children: this_.changeChildren
        })
        this_.steps.clear()
      }, 20, this)
    }, 300)
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
      this.scaleSliderValue = Math.round(this.widthProportion*3.0)
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
    max-height: 30px;
  }

  .num-field{
    margin: -20px 5px 10px 5px;
    width: 40px;
    max-height: 10px ;
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
