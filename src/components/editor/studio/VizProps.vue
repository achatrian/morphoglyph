<template>
  <div>
    <v-card class="panel" flat>
      <!--Replace toolbar with flexbox ? -->
      <v-toolbar
        color="dark"
        flat
        dense>
        <div class="select-title">
          <v-select
            :items="[glyphShapes.main].concat(glyphShapes.children)"
            dense
            label="Glyph Shape"
            v-model="selectedShapeName"
            :disabled="Boolean(rebinding)"
            @change="$emit('update:shapeName', selectedShapeName)"
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
            :items="shapeElements.map(element => element.name)"
            dense
            label="Glyph Element"
            v-model="selectedElementName"
            @change="onSelectElementName"
            :disabled="rebinding === 'field'"
          />
        </div>
        <div class="select-title">
          <v-select
            :items="dataFields"
            dense
            label="Bound Feature"
            v-model="selectedFieldName"
            @change="onSelectFieldName"
            :disabled="rebinding === 'element'"
          />
        </div>
      </v-toolbar>

      <v-list
        id="list"
      >
        <v-list-tile>
          <!--Rebinding controls-->
          <!--v-if converts to boolean-->
          <div class="re-bind" v-show="selectedElementName">
            <span class="bind-item">Bind: </span>
            <v-btn depressed small v-if="!rebinding"
                   color="primary"
                   @click="rebinding = 'element'"
                   class="bind-item text--white"
            >
              Element
            </v-btn>
            <v-btn depressed small v-if="!rebinding"
                   color="light"
                   @click="rebinding = 'field'"
                   class="bind-item primary--text"
            >
              Feature
            </v-btn>
            <v-btn v-if="rebinding" depressed small
                   color="secondary"
                   @click="applyBindingChange"
                   class="bind-item primary--text"
            >
              Apply
            </v-btn>
            <v-btn depressed small
                   v-show="rebinding"
                   color="primary"
                   @click="rebinding = false"
                   class="bind-item"
            >
              <span class="text--white">Cancel</span>
            </v-btn>
          </div>
        </v-list-tile>
        <v-list-tile>
          <v-slider color="secondary"
                    class="text--white"
                    v-model="selectedWidth"
                    v-show="hasProperties.size"
                    :min="(hasProperties.size) ? selectedElement.properties.size.range[0] : 0"
                    :max="(hasProperties.size) ? selectedElement.properties.size.range[1] : 100"
                    :step="(hasProperties.size) ? selectedElement.properties.size.step: 1"
                    :disabled="Boolean(rebinding)"
          >
            <span class="text--white" style="display: inline-block; width: 100px; margin-top: 4px" slot="prepend">
              <!--TODO in new vuetify there is a 'label' slot to change the label-->
              Stroke Size:
            </span>
          </v-slider>
        </v-list-tile>
        <v-list-tile>
          <span class="text--white" v-show="hasProperties.color">Element color:</span>
          <!--TODO change text color when disable as for slider-->
          <v-spacer/>
          <v-dialog
            v-model="dialog"
            width="225px"
            :disabled="Boolean(rebinding)"
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
                :disabled="rebinding"
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
      rebinding: '',
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
      glyphTypes: state => state.glyph.glyphTypes,
      glyphs: state => state.glyph.project.glyphs,
      glyphTypeName: state => state.glyph.glyphTypeName,
      glyphShapes: state => state.glyph.glyphShapes,
      glyphElements: state => state.glyph.glyphElements,
      dataFields: state => state.backend.dataFields,
      fieldTypes: state => state.backend.fieldTypes,
      numDisplayedGlyphs: state => state.app.numDisplayedGlyphs
    }),
    shapeElements () {
      if (this.glyphs.length === 0 || !this.selectedShapeName) {
        return []
      }
      const glyphs = [...this.glyphs[0].iter()]
      const shapeType = glyphs.find(glyph => glyph.name === this.selectedShapeName).constructor
      return shapeType.elements
    },
    hasProperties () {
      return {
        size: Boolean(this.selectedElement.properties.size),
        color: Boolean(this.selectedElement.properties.color)
      }
    }
  },
  methods: {
    ...mapActions({
      selectGlyphEl: 'glyph/selectGlyphEl',
      setPathParameter: 'glyph/setPathParameter',
      redrawElement: 'glyph/redrawElement'
    }),
    reset (newData) {
      this.rebinding = newData.rebinding || false
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
    onSelectElementName () {
      // 0: find glyph element -> needed in order to check what parameters can be modified through element.properties
      this.selectGlyphEl({layer: this.selection.layer, path: this.selectedElementName})
      const selectedElement = this.shapeElements.find(element => element.name === this.selectedElementName)
      if (selectedElement) {
        this.selectedElement = this.shapeElements.find(element => element.name === this.selectedElementName)
      } else {
        this.selectedElement = {name: '', properties: {}}
      }
      // 1: if element is bound, update the displayed field name in the field select box
      if (this.selectedElementName && this.rebinding !== 'element') {
        const elementBinding = this.bindings.find(
                binding => binding.shape === this.selectedShapeName && binding.element === this.selectedElementName
        )
        if (elementBinding) {
          this.selectedFieldName = elementBinding.field
        } else {
          this.selectedFieldName = 'unbound'
        }
      }
    },
    onSelectFieldName () {
      if (this.selectedFieldName && this.rebinding !== 'field') {
        const fieldBinding = this.bindings.find(binding => binding.field === this.selectedFieldName)
        if (fieldBinding) {
          this.selectedElementName = fieldBinding.element
          this.selectGlyphEl({layer: this.selection.layer, path: fieldBinding.element}) // FIXME unused
          const selectedElement = this.shapeElements.find(element => element.name === fieldBinding.element)
          if (selectedElement) {
            this.selectedElement = selectedElement
          }
        } else {
          this.selectedElementName = 'unbound'
          this.selectedElement = {name: '', properties: {}}
        }
      }
    },
    applyBindingChange () { // handle change of field associated with element
      // Apply new field selection FIXME test this
      let newBinding = {
        element: this.selectedElementName,
        field: this.selectedFieldName,
        shape: this.selectedShapeName
      }
      let oldField = ''
      let oldElement = ''
      // for (let binding of this.bindings) {
      //   if (this.rebinding === 'element' &&
      //           binding.shape === this.selectedShapeName &&
      //           binding.field === this.selectedFieldName) {
      //     oldElement = binding.element
      //     break
      //   } else if (this.rebinding === 'field' &&
      //           binding.shape === this.selectedShapeName &&
      //           binding.element === this.selectedElementName) {
      //     oldField = binding.field
      //     break
      //   }
      // }
      // redraw new element (bypasses glyph canvas, as there is no need for bounding rectangle information)
      this.redrawElement(newBinding) // FIXME this will break for protrusions
      this.reset({
        selectedElementName: newBinding.element,
        selectedField: newBinding.field
      }) // reset all except element name
      this.onSelectElementName() // find element to read properties and display controls
      if (this.rebinding === 'field') {
        console.log(`${this.selectedShapeName}.${this.selectedElementName} was bound to ${this.selectedFieldName} (previously bound to ${oldField})`)
      } else {
        console.log(`${this.selectedFieldName} was bound to ${this.selectedShapeName}.${this.selectedElementName} (previously bound to ${oldElement})`)
      }
      this.rebinding = ''
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

.re-bind{
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.bind-item{
  flex: 0 1 auto
}

.color-tile {
  width: 20px;
  height: 20px;
  margin: auto;
  border: 1px solid #616161;
}

</style>
