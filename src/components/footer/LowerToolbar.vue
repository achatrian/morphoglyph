<template>
  <v-footer light class="deep-purple--text" app>
    <app-sheet/>
    <v-container id="pagination-container" v-show="numDisplayedGlyphs">
      <v-layout justify-center>
        <v-flex xs8 >
          <v-pagination
            id="pagination"
            v-model="page"
            :length="numPages"
            v-show="!(glyphBinder || shapeManager)"
          ></v-pagination>
        </v-flex>
      </v-layout>
    </v-container>
    <div id="order-text" v-show="numDisplayedGlyphs">Order:</div>
    <div id="order-select">
      <v-select
        v-show="numDisplayedGlyphs"
        :items="['file entries'].concat(dataFields)"
        dense
        v-model="selectedOrderField"
      />
    </div>
    <v-btn flat icon v-show="numDisplayedGlyphs" @click="reorderGlyphs">
      <v-icon color="primary">reorder</v-icon>
    </v-btn>
  </v-footer>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import Sheet from './Sheet'

export default {
  name: 'LowerToolbar',
  components: {
    'app-sheet': Sheet
  },
  data () { return { page: 1, selectedOrderField: 'file entries' } },
  computed: {...mapState({
      glyphBinder: state => state.app.glyphBinder,
      shapeManager: state => state.app.shapeManager,
      numDisplayedGlyphs: state => state.app.numDisplayedGlyphs,
      glyphs: state => state.glyph.project.glyphs,
      numPages: state => state.app.numPages,
      dataFields: state => state.backend.dataFields,
      fieldTypes: state => state.backend.fieldTypes
  })
  },
  methods: {...mapActions({
    shiftLayersAssignment: 'glyph/shiftLayersAssignment',
    changeCurrentPage: 'app/changeCurrentPage',
    orderDataByValue: 'backend/orderDataByValue'
  }),
  reorderGlyphs () {
    this.orderDataByValue(this.selectedOrderField)
  }
  },
  watch: {
    page () {
      this.shiftLayersAssignment({
        startIndex: (this.page - 1) * this.numDisplayedGlyphs, // page count starts at 1
        endIndex: this.page * this.numDisplayedGlyphs
      })
      this.changeCurrentPage(this.page) // state change triggers redrawing in canvas
    }
  }
}
</script>

<style scoped>
#pagination-container{
  position: relative;
  display: flex;
  justify-content: center;
  text-align: center;
  align-content: flex-start;
  z-index: 2;
  margin-top: -70px;
}

#order-select{
  width: 150px;
  margin-left:10px
}

#order-text{
  margin-left: -30px
}
</style>
