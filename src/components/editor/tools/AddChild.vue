<template>
  <v-list-tile id="tool-tile">
    <v-tooltip
      id="tooltip"
      right
      open-delay="700"
    >
      <v-btn
        id="glyph"
        slot="activator"
        flat
        block
        @click="setGlyphAdderState(true)">
        <v-icon light :color="color">add</v-icon>
      </v-btn>
      <span> Add glyph to existing drawing </span>
    </v-tooltip>
  </v-list-tile>
</template>

<script>
import {mapState, mapActions} from 'vuex'

export default {
  name: 'addChild',
  props: {
    color: {type: String, default: 'white'}
  },
  computed: {
    ...mapState({
      glyphBinder: state => state.app.glyphBinder,
      welcomeCard: state => state.app.welcomeCard
    })
  },
  methods: {
    ...mapActions({
      setGlyphAdderState: 'app/setGlyphAdderState'
    })
  }
}
</script>

<style scoped>
  #tooltip {
    width: 100%;
  }

  #glyph {
    min-width: 0px;
  }

  #tool-tile {
    padding: 0px;
  }
</style>
