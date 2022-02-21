<template>
  <number-input-spinner
    :min="0"
    :max="maxDisplayedGlyphs"
    :value="selectedNumGlyphs"
    v-model="selectedNumGlyphs"
    :inputClass="'mine__input'"
    :buttonClass="'mine__button'"
    ref="spinner"
  />
</template>

<script>
import {mapState, mapActions} from 'vuex'
import {debounce} from 'debounce'
import NumberInputSpinner from 'vue-number-input-spinner'

export default {
  name: 'ViewManager',
  components: {
    'number-input-spinner': NumberInputSpinner
  },
  data: () => ({
    selectedNumGlyphs: 0 // variable bound to spinner value
  }),
  computed: {
    ...mapState({
      maxDisplayedGlyphs: state => state.app.maxDisplayedGlyphs,
      numDisplayedGlyphs: state => state.app.numDisplayedGlyphs
    })
  },
  methods: {
    ...mapActions({
      changeDisplayedGlyphNum: 'app/changeDisplayedGlyphNum'
    })
  },
  watch: {
    selectedNumGlyphs: debounce.call(
      this,
      function () {
        if (this.selectedNumGlyphs !== this.numDisplayedGlyphs) {
          this.changeDisplayedGlyphNum(this.selectedNumGlyphs) // if loop breaks cyclical reaction with numDisplayedGlyphs
        }
      },
      1000
    ),
    numDisplayedGlyphs () {
      if (this.numDisplayedGlyphs > this.selectedNumGlyphs) {
        for (let i = 0; i < this.numDisplayedGlyphs - this.selectedNumGlyphs; i++) {
          this.$refs.spinner.increaseNumber() // need to call this method to change internal variable
        }
      } else {
        for (let i = 0; i < this.selectedNumGlyphs - this.numDisplayedGlyphs; i++) {
          this.$refs.spinner.decreaseNumber()
        }
      }
    }
  }
}
</script>

<style lang='scss'>
  .mine {
    *,
    *::after,
    *::before {
      box-sizing: border-box;
    }
    &__input {
      -webkit-appearance: none;
      background: #EEEEEE;
      border: 1px solid #EEEEEE;
      color: #424242;
      float: left;
      font-size: 18px;
      height: 36px;
      margin: 0;
      outline: none;
      text-align: center;
      width: calc(100% - 73px);
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
      }
    }
    &__button {
      -webkit-appearance: none;
      transition: background 0.5s ease;
      background: #673AB7;
      border: 0;
      color: #fff;
      cursor: pointer;
      float: left;
      font-size: 20px;
      height: 36px;
      margin: 0;
      width: 36px;
      &:hover {
        background: lighten(#673AB7, 10%);
      }
      &:focus {
        outline: 1px dashed lighten(#673AB7, 20%);
        outline-offset: -5px;
      }
    }
  }
</style>
