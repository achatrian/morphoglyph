<template>
  <div>
    <v-card class="panel" flat>
      <v-divider/>
<!--      GLYPH SELECTION AND PROPERTIES      -->
      <v-toolbar
        color="dark"
        flat
        dense>
        <div class="select-title">
          <v-select
            :items="Array.from(glyphNames)"
            dense
            label="Glyph Name"
            placeholder="Select an existing glyph"
            v-model="selectedGlyphName"
            @change="$emit('update:shapeName', selectedGlyphName)"
          />
        </div>
      </v-toolbar>
      <v-toolbar
              color="dark"
              flat
              dense
              v-if="renamingGlyph"
      >
        <v-text-field v-model="newGlyphName" label="New glyph name"></v-text-field>
      </v-toolbar>
      <v-toolbar
              color="dark"
              flat
              dense>
        <v-btn v-if="!renamingGlyph" flat class="secondary primary--text" @click="renamingGlyph = true">
          rename
        </v-btn>
        <v-btn v-else flat class="secondary primary--text" @click="renameGlyph">
          OK
        </v-btn>
        <v-btn flat class="white dark--text" @click="deleteGlyph(selectedGlyphName)" :disabled="renamingGlyph">
          delete
        </v-btn>
      </v-toolbar>
      <v-toolbar flat dense color="dark">
        <span class="text--white" style="font-size: 16px" v-show="selectedGlyphName">Glyph Color:</span>
        <!--TODO change text color when disable as for slider-->
        <v-spacer/>
        <v-dialog
                v-model="glyphColorDialog"
                width="225px"
                :disabled="!selectedGlyphName"
                v-show="selectedGlyphName"
        >
          <a slot="activator">
            <div
                    :style="{ 'background-color': glyphColor.hex8}"
                    class="color-tile"
            />
          </a>
          <v-card>
            <color-picker
                    v-model="glyphColor"
                    :disabled="!selectedGlyphName"
            />
          </v-card>
        </v-dialog>
      </v-toolbar>
      <v-divider/>


<!--      ELEMENT BINDING AND PROPERTIES      -->


      <v-toolbar
      :color="elementSelectColor"
      flat
      dense
      >
        <div class="select-title">
          <v-select
            :items="selectedGlyphElements.map(element => element.name)"
            dense
            label="Glyph Element"
            placeholder="Select a glyph element"
            v-model="selectedElementName"
            @change="onSelectElementName"
            :disabled="rebinding === 'element' || !selectedGlyphName"
          />
        </div>
      </v-toolbar>
      <v-toolbar
      :color="featureSelectColor"
      flat
      dense
      ref="featureSelect"
      >
        <div class="select-title">
          <v-select
                  :items="featuresItems"
                  dense
                  label="Data Feature"
                  placeholder="Select a data feature"
                  v-model="selectedFieldName"
                  @change="applyBindingChange"
                  :disabled="!selectedElementName || !selectedGlyphName"
          >
            <v-tooltip
                    class="tooltip"
                    open-delay="700"
                    bottom
                    slot="append"
                    v-if="bindings.some(binding => binding.name === selectedGlyphName &&
                                        binding.field === selectedFieldName)"
            >
              <v-btn
                      icon
                      small
                      slot="activator"
                      class="light bind-item"
                      color="dark"
                      flat
                      @click="applyUnbinding"
              >
                <v-icon>remove</v-icon>
              </v-btn>
              <span>Remove selected element-feature binding</span>
            </v-tooltip>
          </v-select>
        </div>
      </v-toolbar>
      <v-toolbar flat dense color="dark">
        <v-slider color="secondary"
                  class="text--white"
                  style=" margin-top: 15%"
                  v-model="selectedWidth"
                  v-show="hasProperties.size"
                  :min="(hasProperties.size) ? selectedElement.properties.size.range[0] : 0"
                  :max="(hasProperties.size) ? selectedElement.properties.size.range[1] : 100"
                  :step="(hasProperties.size) ? selectedElement.properties.size.step: 1"
                  :disabled="Boolean(rebinding) || selectedFieldName === 'unbound'"
        >
            <span class="text--white" style="display: inline-block; width: 100px" slot="prepend">
              <!--TODO in new vuetify there is a 'label' slot to change the label-->
              Stroke Size:
            </span>
        </v-slider>
      </v-toolbar>
      <v-toolbar flat dense color="dark">
        <span class="text--white" style="font-size: 16px" v-show="hasProperties.color">Element Color:</span>
        <!--TODO change text color when disable as for slider-->
        <v-spacer/>
        <v-dialog
                id="dialog1"
                v-model="dialog"
                width="225px"
                :disabled="Boolean(rebinding) || selectedFieldName === 'unbound'"
        >
          <a slot="activator" v-show="hasProperties.color">
            <div
                    :style="{ 'background-color': colorPick.hex8}"
                    class="color-tile"
            />
          </a>
          <v-card>
            <color-picker
                    id="picker"
                    v-model="colorPick"
            />
          </v-card>
        </v-dialog>
      </v-toolbar>
      <v-toolbar flat dense color="dark">
          <v-spacer/>
          <v-select v-model="selectedMode"
                    :items="hasProperties.mode ? selectedElement.properties.mode : []"
                    :disabled="Boolean(rebinding) || selectedFieldName === 'unbound'"
                    v-show="hasProperties.mode"
                    @change="onModeSelection"
          >
            <span class="text--white"
                  style="display: inline-block; width: 100px; margin-top: 4px"
                  slot="prepend"
            >
              Options:
            </span>
          </v-select>
      </v-toolbar>
    </v-card>
  </div>
</template>


<script>
import {mapState, mapActions} from 'vuex'
import { Chrome } from 'vue-color'


export default {
  name: 'VizProps',
  components: {
    'color-picker': Chrome
  },
  data () {
    return {
      rebinding: 'element',
      selectedGlyphName: '',
      selectedElementName: '',
      selectedElement: {
        name: '',
        properties: {}
      },
      selectedWidth: 1,
      selectedFieldName: '',
      currentGlyphId: 0,
      colorPick: {hex8: ''},
      dialog: false,
      selectedMode: '',
      elementSelectColor: 'dark',
      featureSelectColor: 'dark',
      renamingGlyph: false,
      newGlyphName: '',
      glyphColor: {hex8: ''},
      glyphColorDialog: false
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
      numDisplayedGlyphs: state => state.app.numDisplayedGlyphs,
      glyphNames: state => state.glyph.project.glyphNames
    }),
    selectedGlyphElements () {
      if (this.glyphs.length === 0 || !this.selectedGlyphName) {
        return []
      }
      const glyphs = [...this.glyphs[0].iter()]
      const shapeType = glyphs.find(glyph => glyph.name === this.selectedGlyphName).constructor
      return shapeType.elements
    },
    selectedShape () { // get shape of selected glyph for bindings filtering
      if (this.glyphs.length === 0 || !this.selectedGlyphName) {
        return ''
      }
      return [...this.glyphs[0].iter()].find(glyph => glyph.name === this.selectedGlyphName).shape
    },
    hasProperties () {
      return {
        size: Boolean(this.selectedElement.properties.size),
        color: Boolean(this.selectedElement.properties.color),
        mode: Boolean(this.selectedElement.properties.mode)
      }
    },
    featuresItems () {
      const maxFieldLen = 30
      const featureItems = []
      for (const field of this.dataFields) {
        let fieldIsBound = this.bindings.some(binding => binding.field === field)
        let whiteSpace = []
        for (let i = field.length; i <= maxFieldLen - 3; i++) {
          whiteSpace.push(' ')
        }
        featureItems.push({
          text: field.slice(0, maxFieldLen) + whiteSpace.join('') + (fieldIsBound ? '(O)' : ''),
          value: field,
          isBound: fieldIsBound
        })
      }
      return featureItems
    }
  },
  methods: {
    ...mapActions({
      selectGlyphEl: 'glyph/selectGlyphEl',
      setPathParameter: 'glyph/setPathParameter',
      redrawElement: 'glyph/redrawElement',
      deleteElement: 'glyph/deleteElement',
      deleteBinding: 'glyph/deleteBinding',
      setGlyphParameters: 'glyph/setGlyphParameters',
      renameGlyphs: 'glyph/renameGlyphs',
      deleteGlyph: 'glyph/deleteGlyph',
      setGlyphColor: 'glyph/setGlyphColor'
    }),
    reset (newData = {}) {
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
      const selectedElement = this.selectedGlyphElements.find(element => element.name === this.selectedElementName)
      if (selectedElement) {
        this.selectedElement = this.selectedGlyphElements.find(element => element.name === this.selectedElementName)
      } else {
        this.selectedElement = {name: '', properties: {}}
      }
      // 1: if element is bound, update the displayed field name in the field select box
      if (this.selectedElementName && this.rebinding !== 'field') {
        const elementBinding = this.bindings.find(
                binding => binding.name === this.selectedGlyphName && binding.element === this.selectedElementName
        )
        if (elementBinding) {
          this.selectedFieldName = elementBinding.field
          // change color of field select momentarily as its text changes
        } else {
          this.selectedFieldName = 'unbound'
        }
        this.featureSelectColor = 'light'
        setTimeout(function (this_) {
          this_.featureSelectColor = 'dark'
        }, 300, this)
      }
    },
    async applyBindingChange () { // handle change of field associated with element
      // Apply new field selection FIXME test this
      const shape = [...this.glyphs[0].iter()].find(glyph => glyph.name === this.selectedGlyphName).shape
      let newBinding = {
        element: this.selectedElementName,
        field: this.selectedFieldName,
        name: this.selectedGlyphName,
        shape: shape
      }
      let oldBinding
      oldBinding = this.bindings.find(
              binding => binding.name === this.selectedGlyphName && binding.field === this.selectedFieldName
      )
      setTimeout(function (this_, newBinding) {
        this_.redrawElement(newBinding)
      }, 100, this, newBinding)
      this.redrawElement(newBinding)
      this.reset({
        selectedElementName: newBinding.element,
        selectedField: newBinding.field
      }) // reset all except element name
      this.onSelectElementName() // find element to read properties and display controls
      console.log(`${this.selectedFieldName} was bound to ${this.selectedGlyphName}.${this.selectedElementName}`)
      if (oldBinding) {
        console.log(`(previously bound to ${oldBinding.element})`)
      }
    },
    applyUnbinding () { // unbinds element or feature
      let oldBinding
        oldBinding = this.bindings.find(
                binding => binding.name === this.selectedGlyphName &&
                        binding.field === this.selectedFieldName &&
                        binding.element === this.selectedElementName
        )
      if (oldBinding) {
        this.deleteElement(oldBinding)
        this.deleteBinding(oldBinding)
      }
      this.reset()
    },
    onModeSelection () {
      this.setGlyphParameters({
        parameters: {
          [this.selectedElement.name.toLocaleLowerCase() + 'Mode']: this.selectedMode
        },
        glyphName: this.selectedGlyphName
      })
      const binding = this.bindings.find(
              binding_ => binding_.name === this.selectedGlyphName && binding_.field === this.selectedFieldName
      )
      this.redrawElement(binding)
    },
    renameGlyph () {
      this.renamingGlyph = false
      const oldName = this.selectedGlyphName
      this.selectedGlyphName = this.newGlyphName
      this.renameGlyphs({
        oldName: oldName,
        newName: this.newGlyphName
      })
    }
  },
  watch: {
    selectedGlyphName () {
      this.reset()
    },
    glyphNames () {
      if (this.glyphs.length > 0) {
        this.selectedGlyphName = this.glyphs[0].name
        this.$emit('update:shapeName', this.selectedGlyphName)
      }
    },
    selectedWidth () {
      if (this.numDisplayedGlyphs && Boolean(this.selectedElementName)) {
        this.setPathParameter({
          parameter: 'strokeWidth',
          value: this.selectedWidth,
          glyphName: this.selectedGlyphName,
          elementName: this.selectedElement.name
        })
      }
    },
    colorPick () {
      if (this.numDisplayedGlyphs && Boolean(this.selectedElementName) && this.selectedElement.type === 'path') {
        this.setPathParameter({
          parameter: 'strokeColor',
          value: this.colorPick.hex8,
          glyphName: this.selectedGlyphName,
          elementName: this.selectedElement.name
        })
        if (this.selectedElement.properties.color.fillColor) {
          this.setPathParameter({
            parameter: 'fillColor',
            value: this.colorPick.hex8,
            glyphName: this.selectedGlyphName,
            elementName: this.selectedElement.name
          })
        }
      }
    },
    glyphColor: {
      handler () {
        this.setGlyphColor({
          glyphName: this.selectedGlyphName,
          fillColor: this.glyphColor.hex8,
        })
        for (const binding of this.bindings) {
          if (binding.element !== 'Shade') {
            continue
          }
          this.redrawElement(binding)
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.select-title{
  position: relative;
  margin: 5px auto auto auto;
  width: 100%;
}

.panel {
  margin-top: 20px;
}

.bind-item{
  flex: 0 1 auto
}

.color-tile {
  width: 100px;
  height: 20px;
  margin: auto;
  border: 1px solid #616161;
}
</style>
