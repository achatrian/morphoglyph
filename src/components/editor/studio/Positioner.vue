<template>
  <div class="move-resize-commands">
  <v-slider label="X" min="0" max="1" step="0.05" v-model="leftShift" class="control-item"
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
  <v-slider label="Y" min="0" max="1" step="0.05" v-model="topShift" class="control-item"
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
  <v-slider label="W" min="0" max="1" step="0.05" v-model="widthProportion" class="control-item"
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
  <v-slider label="H" min="0" max="1" step="0.05" v-model="heightProportion" class="control-item"
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
  <v-btn class="light primary--text" @click="planCentering">
    Center
  </v-btn>
</div>
</template>

<script>
import {mapActions} from 'vuex'
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
      steps: new Deque(10)
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
        parameters: [this.leftShift, null, {setValues: true, scale: false, children: false}]
      })
      this.applySteps()
    }, 400),
    planTopShift: debounce.call(this, function () {
      this.steps.push({
        transform: 'shift',
        parameters: [null, this.topShift, {setValues: true, scale: false, children: false}]
      })
      this.applySteps()
    }, 400),
    planWidthResize: debounce.call(this, function () {
      this.steps.push({
        transform: 'resize',
        parameters: [this.widthProportion, null, {setValues: true, center: false, children: false}]
      })
      this.applySteps()
    }, 400),
    planHeightResize: debounce.call(this, function () {
      this.steps.push({
        transform: 'resize',
        parameters: [null, this.heightProportion, {setValues: true, center: false, children: false}]
      })
      this.applySteps()
    }, 400),
    planCentering: debounce.call(this, function () {
      this.steps.push({
        transform: 'center',
        parameters: [true, true, {setValues: true, center: false, children: false}]
      })
      this.applySteps()
    }, 400),
    applySteps: debounce.call(this, function () { // once steps are sent to glyphs, they are cleared up
      this.changeGlyphPosition({
        steps: this.steps.toArray(),
        shapeSelector: this.shapeName,
        children: false
      })
      this.steps.clear()
    }, 600),
  }
}
</script>

<style scoped>
  .move-resize-commands{
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    flex-wrap: wrap;
    margin: auto;
  }

  .control-item{
    padding: 0 0 0 10px;
    max-width: 150px;
  }

  .num-field{
    margin: 0 5px 10px 5px;
    width: 40px;
    font-size: 12px
  }
</style>
