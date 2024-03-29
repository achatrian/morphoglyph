<template>
  <div>
    <v-card class="panel" flat>
      <v-divider/>
      <!--Replace toolbar with flexbox ? -->
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
            :disabled="Boolean(rebinding)"
            @change="$emit('update:shapeName', selectedGlyphName)"
          />
        </div>
      </v-toolbar>
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
            placeholder="Select a glyph element to bind"
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
                  :items="dataFields"
                  dense
                  label="Data Feature"
                  placeholder="Select a data feature to bind"
                  v-model="selectedFieldName"
                  @change="onSelectFieldName"
                  :disabled="rebinding === 'field' || !selectedGlyphName"
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
            <v-tooltip
                    class="tooltip"
                    open-delay="700"
                    bottom
                    :disabled="Boolean(rebinding)"
            >
              <v-btn icon
                     slot="activator"
                     v-if="!rebinding"
                     color="primary"
                     @click="rebinding = 'element'"
                     class="bind-item text--white"
                     :disabled="selectedElementName === 'unbound'"
              >
                <v-icon color="white">nature</v-icon>
              </v-btn>
              <span>Choose feature to bind to selected element</span>
            </v-tooltip>
            <v-tooltip
                    class="tooltip"
                    open-delay="700"
                    bottom
                    :disabled="Boolean(rebinding)"
            >
              <v-btn icon
                     slot="activator"
                     v-if="!rebinding"
                     color="light"
                     @click="rebinding = 'field'"
                     class="bind-item primary--text"
                     :disabled="selectedFieldName === 'unbound'"
              >
                <v-icon color="primary">texture</v-icon>
              </v-btn>
              <span>Choose element to bind to selected feature</span>
            </v-tooltip>
            <v-tooltip
                    class="tooltip"
                    open-delay="700"
                    bottom
            >
              <v-btn icon
                     slot="activator"
                     v-if="rebinding"
                     color="secondary"
                     @click="applyBindingChange"
                     class="bind-item primary--text"
              >
                <v-icon color="primary">check_circle</v-icon>
              </v-btn>
              <span>Apply selection</span>
            </v-tooltip>
            <v-tooltip
                    class="tooltip"
                    open-delay="700"
                    bottom
            >
              <v-btn icon
                     slot="activator"
                     v-show="rebinding"
                     color="primary"
                     @click="rebinding = false"
                     class="bind-item"
              >
                <v-icon color="white">cancel</v-icon>
              </v-btn>
              <span>Cancel selection</span>
            </v-tooltip>
            <v-tooltip
                    class="tooltip"
                    open-delay="700"
                    bottom
            >
              <v-btn icon
                     v-show="!rebinding"
                     slot="activator"
                     color="white"
                     @click="applyUnbinding"
                     class="bind-item"
              >
                <v-icon color="dark">remove</v-icon>
              </v-btn>
            <span>Remove selected element-feature binding</span>
            </v-tooltip>
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
                    :disabled="Boolean(rebinding) || selectedFieldName === 'unbound'"
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
            :disabled="Boolean(rebinding) || selectedFieldName === 'unbound'"
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
                :disabled="Boolean(rebinding) || selectedFieldName === 'unbound'"
              />
            </v-card>
          </v-dialog>
        </v-list-tile>
        <!--<v-divider/>-->
        <v-list-tile>
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
        </v-list-tile>
      </v-list>
      <v-divider/>
    </v-card>
  </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import { Chrome } from 'vue-color'


export default {
  name: 'VizProps',
  components: {
    'color-picker': Chrome,
    // 'app-positioner': Positioner
  },
  data () {
    return {
      rebinding: '',
      selectedGlyphName: '',
      selectedElementName: '',
      selectedElement: {
        name: '',
        properties: {}
      },
      selectedWidth: 1,
      selectedFieldName: '',
      currentGlyphId: 0,
      colorPick: {hex: ''},
      dialog: false,
      selectedMode: '',
      elementSelectColor: 'dark',
      featureSelectColor: 'dark'
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
    }
  },
  methods: {
    ...mapActions({
      selectGlyphEl: 'glyph/selectGlyphEl',
      setPathParameter: 'glyph/setPathParameter',
      redrawElement: 'glyph/redrawElement',
      deleteElement: 'glyph/deleteElement',
      setGlyphParameters: 'glyph/setGlyphParameters'
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
    onSelectFieldName () {
      if (this.selectedFieldName && this.rebinding !== 'element') {
        const fieldBinding = this.bindings.find(binding => binding.field === this.selectedFieldName)
        if (fieldBinding) {
          this.selectedElementName = fieldBinding.element
          this.selectGlyphEl({layer: this.selection.layer, path: fieldBinding.element}) // FIXME unused
          const selectedElement = this.selectedGlyphElements.find(element => element.name === fieldBinding.element)
          if (selectedElement) {
            this.selectedElement = selectedElement
          }
        } else {
          this.selectedElementName = 'unbound'
          this.selectedElement = {name: '', properties: {}}
        }
        this.elementSelectColor = 'light'
        setTimeout(function (this_) {
          this_.elementSelectColor = 'dark'
        }, 300, this)
      }
    },
    applyBindingChange () { // handle change of field associated with element
      // Apply new field selection FIXME test this
      const shape = [...this.glyphs[0].iter()].find(glyph => glyph.name === this.selectedGlyphName).shape
      let newBinding = {
        element: this.selectedElementName,
        field: this.selectedFieldName,
        name: this.selectedGlyphName,
        shape: shape
      }
      let oldBinding
      if (this.rebinding === 'element') {
        oldBinding = this.bindings.find(
                binding => binding.name === this.selectedGlyphName && binding.field === this.selectedFieldName
        )
      } else if (this.rebinding === 'field') {
        oldBinding = this.bindings.find(
                binding => binding.name === this.selectedGlyphName && binding.element === this.selectedElementName
        )
      } else {
        throw Error("Shouldn't be here")
      }
      this.redrawElement(newBinding) // FIXME this will break for protrusions
      this.reset({
        selectedElementName: newBinding.element,
        selectedField: newBinding.field
      }) // reset all except element name
      this.onSelectElementName() // find element to read properties and display controls
      if (this.rebinding === 'field') {
        console.log(`${this.selectedGlyphName}.${this.selectedElementName} was bound to ${this.selectedFieldName}`)
        if (oldBinding) {
          console.log(`(previously bound to ${oldBinding.field})`)
        }
      } else {
        console.log(`${this.selectedFieldName} was bound to ${this.selectedGlyphName}.${this.selectedElementName}`)
        if (oldBinding) {
          console.log(`(previously bound to ${oldBinding.element})`)
        }
      }
      this.rebinding = ''
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
      }
      this.reset()
    },
    onModeSelection () {
      this.setGlyphParameters({
        parameters: {
          [this.selectedElement.name.toLocaleLowerCase() + 'Mode']: this.selectedMode
        },
        shapeName: this.selectedGlyphName
      })
      const binding = this.bindings.find(
              binding_ => binding_.name === this.selectedGlyphName && binding_.field === this.selectedFieldName
      )
      this.redrawElement(binding)
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
          value: this.colorPick.hex,
          glyphName: this.selectedGlyphName,
          elementName: this.selectedElement.name
        })
        if (this.selectedElement.properties.color.fillColor) {
          this.setPathParameter({
            parameter: 'fillColor',
            value: this.colorPick.hex,
            glyphName: this.selectedGlyphName,
            elementName: this.selectedElement.name
          })
        }
      }
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
