<template>
  <v-flex v-resize="emitDockRect"
          v-show="renderCard"
          xs6 sm4 md3
          grow
  >
    <v-card :id="'card-' + glyphIndex.toString()"
            contain
            class="dock light elevation-3"
            style="position:relative; top:40px"
            height="96%">
      <v-card-text class="cluster-name px-3">
        {{glyphId}}
        <!--<v-select-->
          <!--:items="clusterNames"-->
          <!--v-model="currentClusterName"-->
          <!--@change="swapGlyph"-->
        <!--/>-->
      </v-card-text>
    </v-card>
  </v-flex>
</template>

<script>
import {mapState} from 'vuex'

export default {
  name: 'Dock',
  data () {
    return {
      cardEl: null,
      boundingRect: {width: 0, height: 0, left: 0, top: 0},
      renderCard: true,
      currentClusterName: '' // assigned after initialization
    }
  },
  props: {
    glyphIndex: Number,
    dockCluster: String // TODO get rid of this and use rootState.backend.dataDisplayOrder
  },
  methods: {
    emitDockRect () {
      // cannot debounce this function, as it needs to be called multiple times by different dock instances
      // (apparently it is the same function that is called, as only last glyph is drawn)
      let rect
      if (typeof cardEl !== 'undefined') {
        rect = this.cardEL.getBoundingClientRect()
      } else {
        rect = this.$el.firstChild.getBoundingClientRect() // for mounting time
      }
      this.boundingRect = {
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
        left: rect.left,
        top: rect.top
      } // http://javascript.info/coordinates
      this.$emit('resized', {
        boundingRect: this.boundingRect,
        glyphIndex: this.glyphIndex
      })
    },
    swapGlyph () {
      return 0 // TODO find datapoint with selected cluster names and assign to this dock.
    }
  },
  computed: {
    ...mapState({
      displayOrderField: state => state.backend.displayOrderField,
      parsedData: state => state.backend.parsedData,
      glyphs: state => state.glyph.project.glyphs
    }),
    clusterNames () {
      let clusterNames = []
      this.parsedData.forEach(dataPoint => clusterNames.push(dataPoint[this.displayOrderField]))
      return clusterNames
    },
    glyphId () {
      let id = String(this.dockCluster)
      if (id.length > 0) {
        return id
      } else {
        return this.glyphIndex
      }
    }
  },
  mounted () {
    // get reference card after it's loaded
    this.cardEl = document.getElementById(`card-${this.glyphIndex}`) // store card el to follow dimensions
    this.emitDockRect() // mounting is first resize from 0 dimensions
  }
}
</script>

<style scoped>
  .dock{
    flex: 1 1 auto;
    position: relative;
    z-index: inherit
  }
</style>
