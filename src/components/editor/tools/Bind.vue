<template lang="html">
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
      @click="setGlyphBinderState(true)">
      <v-icon light :color="color">view_column</v-icon>
    </v-btn>
    <span> Open pane for feature binding</span>
  </v-tooltip>
</v-list-tile>
</template>

<script>
import {mapActions} from 'vuex'

export default {
  name: 'Bind',
  methods: {
    ...mapActions({
      setGlyphBinderState: 'app/setGlyphBinderState'
    })
  },
  props: {
    color: {type: String, default: 'white'}
  }
}
</script>

<style lang='css' scoped>
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
