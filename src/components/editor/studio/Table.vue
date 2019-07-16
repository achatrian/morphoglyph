<template>
  <v-data-table
    id="table"
    :headers="headers"
    :items="parsedData"
    class="elevation-1"
    no-results-text="Load a feature file to display features">
    <template slot="items" slot-scope="props">
      <td class="text-xs-right"
          v-for="feature in features"
          :key="feature">
        {{ props.item[feature].slice(0, Math.min(5, props.item[feature].length)) }}
      </td>
      <!--column def: assuming first data-point has the same features as all the rest-->
    </template>
  </v-data-table>
</template>

<script>
import {mapState} from 'vuex'

export default {
  name: 'Table',
  data () {
    return {
      maxColumns: 4
    }
  },
  computed: {
    ...mapState({
      parsedData: state => state.backend.parsedData,
      glyphs: state => state.glyph.project.glyphs,
      numDisplayedGlyphs: state => state.glyph.numDisplayedGlyphs
    }),
    features () {
      if (this.parsedData.length > 0) {
        return Object.keys(this.parsedData[0])
      } else {
        return []
      }
    },
    headers () {
      let headers = []
      this.features.forEach(key => {
        headers.push({
          text: key, value: key
        })
      })
      return headers
    }
  }
}
</script>

<style scoped>
  #table{

  }
</style>
