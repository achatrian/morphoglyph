<template>
  <div class="elevation-1">
    <v-card class="panel">
      <v-toolbar
        v-if="glyphShapes.children.length > 0"
        color="dark"
        flat
        dense>
        <div class="select-title">
          <v-select
            :items="[glyphShapes.main].concat(glyphShapes.children)"
            dense
            label="Glyph Shape"
            v-model="selectedShapeName"
            :disabled="changeFeatureIsPressed"
          />
        </div>
      </v-toolbar>
      <v-toolbar
      id="toolbar"
      color="dark"
      flat
      dense>
        <div class="select-title">
          <v-select
            :items="elementNames"
            dense
            label="Glyph Element"
            v-model="selectedElementName"
            :disabled="changeFeatureIsPressed"
          />
        </div>
        <div class="select-title">
          <v-select
            :items="fieldNames"
            dense
            label="Bound Feature"
            v-model="selectedFieldName"
          />
        </div>
      </v-toolbar>

      <v-list
        id="list"
      >
        <v-list-tile>
          <!--Replace 'change feature' button with 'apply' button when pressed-->
          <v-btn v-if="!changeFeatureIsPressed" depressed small
                 v-show="selectedElementName"
                 color="secondary"
                 @click="changeFeatureIsPressed = true"
          >
            <span class="text--primary" >change feature</span>
          </v-btn>
          <v-btn v-else depressed small
                 v-show="selectedElementName"
                 color="secondary"
                 @click="applyFeatureChange"
          >
            <span class="text--primary">Apply</span>
          </v-btn>
          <v-btn depressed small
                 v-show="changeFeatureIsPressed"
                 color="primary"
                 @click="cancelFieldSelection"
          >
            <span class="text--white">Cancel</span>
          </v-btn>
        </v-list-tile>
        <v-list-tile>
          <v-slider color="secondary"
                    label="Stroke Size:"
                    v-model="selectedWidth"
                    v-show="hasProperties.size"
                    :min="(hasProperties.size) ? selectedElement.properties.size.range[0] : 0"
                    :max="(hasProperties.size) ? selectedElement.properties.size.range[1] : 100"
                    :step="(hasProperties.size) ? selectedElement.properties.size.step: 1"
                    :disabled="changeFeatureIsPressed"
          />
        </v-list-tile>
        <v-list-tile>
          <span style="color:#BDBDBD" v-show="hasProperties.color">Element color:</span>
          <!--TODO change text color when disable as for slider-->
          <v-spacer/>
          <v-dialog
            v-model="dialog"
            width="225px"
            :disabled="changeFeatureIsPressed"
          >
            <a slot="activator" v-show="hasProperties.color">
              <div
                :style="{ 'background-color': colorPick.hex}"
                style="position: relative; right:135px"
                class="color-tile"
              />
            </a>
            <v-card>
              <color-picker
                id="picker"
                v-model="colorPick"
                :disabled="changeFeatureIsPressed"
              />
            </v-card>
          </v-dialog>
        </v-list-tile>
        <!--<v-divider/>-->
        <v-list-tile>
          <!--<app-positioner shape-name="selectedShapeName"/>-->
        </v-list-tile>
      </v-list>
    </v-card>
  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import { Chrome } from 'vue-color'
// import Positioner from './Positioner'
// must make this work even in the case of multiple glyphs that have elements

export default {
  name: 'VizProps',
  components: {
    'color-picker': Chrome,
    // 'app-positioner': Positioner
  },
  data () {
    return {
      changeFeatureIsPressed: false,
      selectedShapeName: '',
      selectedElementName: '',
      selectedElement: {
        name: '',
        properties: {}
      },
      selectedFieldName: '',
      currentGlyphId: 0,
      selectedWidth: 1,
      selectedRelativeX: 0.5,
      selectedRelativeY: 0.5,
      colorPick: {hex: ''},
      dialog: false
    }
  },
  computed: {
    ...mapState({
      selection: state => state.glyph.selection,
      bindings: state => state.glyph.project.bindings,
      glyphTypeName: state => state.glyph.glyphTypeName,
      glyphShapes: state => state.glyph.glyphShapes,
      glyphElements: state => state.glyph.glyphElements,
      dataFields: state => state.backend.dataFields,
      fieldTypes: state => state.backend.fieldTypes,
      numDisplayedGlyphs: state => state.app.numDisplayedGlyphs
    }),
    elementNames () {
      let elementNames = []
      this.bindings.forEach(binding => {
        if (binding.shape === this.selectedShapeName) { // only elements targeting currently selected shape
          elementNames.push(binding.element) // store element names used in glyph
        }
      })
      return elementNames
    },
    boundField () { // feature bound to selected element, for visualization
      if (this.selectedElementName) {
        for (let binding of this.bindings) {
          if (binding.shape === this.selectedShapeName && binding.element === this.selectedElementName) {
            return binding.field
          }
        }
        throw Error(`No binding named ${this.selectedElement.name}`)
      } else {
        return ""
      }
    },
    fieldNames () {
      let elementNames = []
      if (!this.changeFeatureIsPressed) {
        this.bindings.forEach(binding => { elementNames.push(binding.field) }) // store element names used in glyph
      } else {
        // if change feature button is pressed, all fields are displayed
        // as all can be assigned to element
        this.dataFields.forEach(field => {
          if (this.fieldTypes[field] === Number) { elementNames.push(field) }
        })
      }
      return elementNames
    },
    hasProperties () {
      return {
        size: !!(this.selectedElement.properties.size), // double negation is poor language ?
        color: !!(this.selectedElement.properties.color)
      }
    }
  },
  methods: {
    ...mapActions({
      selectGlyphEl: 'glyph/selectGlyphEl',
      setPathParameter: 'glyph/setPathParameter',
      setBindings: 'glyph/setBindings',
      resetLayers: 'glyph/resetLayers',
      changeDisplayedGlyphNum: 'app/changeDisplayedGlyphNum',
      addDataBoundGlyphs: 'glyph/addDataBoundGlyphs'
    }),
    applyFeatureChange () { // handle change of field associated with element
      // Apply new field selection FIXME test this
      let newBindings = []
      let oldField = ''
      this.bindings.forEach(binding => {
        if (binding.shape === this.selectedShapeName && binding.element === this.selectedElementName) {
          oldField = binding.field
          const newBinding = Object.assign({}, binding)
          newBinding.field = this.selectedFieldName // modify field to selected one
          newBindings.push(newBinding)
        } else {
          newBindings.push(binding)
        }
      })
      // this.resetLayers()
      this.reset({
        selectedElementName: this.selectedElementName,
        selectedElement: this.selectedElement,
        selectedField: this.selectedFieldName
      }) // reset all except element name
      this.setBindings(newBindings)
      this.addDataBoundGlyphs()
      const numDisplayedGlyphs = this.numDisplayedGlyphs
      this.changeDisplayedGlyphNum(0)
      setTimeout(function (numDisplayedGlyphs) {
        console.log('num' + numDisplayedGlyphs)
        this.changeDisplayedGlyphNum(numDisplayedGlyphs)
        this.changeFeatureIsPressed = false
        console.log(`${this.selectedShapeName}.${this.selectedElementName} was bound to ${this.selectedFieldName} (previously bound to ${oldField})`)
      }.bind(this),
      100, numDisplayedGlyphs) // can pass arg to callback
      // FIXME glyph replacements are huge ??
    },
    cancelFieldSelection () {
      this.changeFeatureIsPressed = false
    },
    reset (newData) {
      this.changeFeatureIsPressed = newData.changeFeatureIsPressed || false
      this.selectedElementName = newData.selectedElementName || ''
      this.selectedElement = newData.selectedElement || {
        name: '',
        properties: {}
      }
      this.selectedFieldName = newData.selectedFieldName || ''
      this.currentGlyphId = newData.currentGlyphId || 0
      this.selectedWidth = newData.selectedWidth || 1
      this.colorPick = newData.colorPick || {hex: ''}
      this.dialog = newData.dialog || false
    },
    moveShape () {
      console.log('to implement')
    }
  },
  watch: {
    glyphShapes () {
      if (this.glyphShapes.children.length === 0) {
        this.selectedShapeName = this.glyphShapes.main
      }
    },
    selectedElementName () {
      this.selectGlyphEl({layer: this.selection.layer, path: this.selectedElementName})
      let selectedElement // element object, not just name
      for (let element of this.glyphElements) {
        if (element.name === this.selectedElementName && element.target === this.selectedShapeName) {
          selectedElement = element
          break // break when element matches selected name
        }
      }
      this.selectedElement = selectedElement
    },
    selectedFieldName () {
      if (!this.changeFeatureIsPressed && this.selectedFieldName) {
        let elementName = ''
        for (let binding of this.bindings) {
          if (binding.field === this.selectedFieldName) {
            elementName = binding.element
            break // break when element matches selected name
          }
        }
        if (!elementName) { throw Error(`No element for selected field '${this.selectedFieldName}'`) }
        this.selectGlyphEl({layer: this.selection.layer, path: elementName})
        let selectedElement // element object, not just name
        for (let element of this.glyphElements) {
          if (element.name === elementName) {
            selectedElement = element
            break // break when element matches selected name
          }
        }
        this.selectedElement = selectedElement
        this.selectedElementName = elementName
      } // if not, change is due to field selection and element properties should not be changed
    },
    boundField () {
      this.selectedFieldName = this.boundField // must be independent for selection TODO check (?)
    },
    selectedWidth () {
      if (this.numDisplayedGlyphs) {
        this.setPathParameter({
          parameter: 'strokeWidth',
          value: this.selectedWidth,
          shapeName: this.selectedShapeName,
          elementName: this.selectedElement.name
        })
      }
    },
    colorPick () {
      if (this.numDisplayedGlyphs) {
        this.setPathParameter({
          parameter: 'strokeColor',
          value: this.colorPick.hex,
          shapeName: this.selectedShapeName,
          elementName: this.selectedElement.name
        })
      }
    }
  }
}
</script>

<style scoped>
.select-title{
  position: relative;
  margin-top: 5px
}

.panel {
  margin-top: 20px;
}

.color-tile {
  width: 20px;
  height: 20px;
  margin: auto;
  border: 1px solid #616161;
}

</style>
