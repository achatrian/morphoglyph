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
            label="Data Feature"
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
      selectedShapeName: '',
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
      selectedMode: ''
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
      let oldBinding
      if (this.rebinding === 'element') {
        oldBinding = this.bindings.find(
                binding => binding.shape === this.selectedShapeName && binding.field === this.selectedFieldName
        )
      } else if (this.rebinding === 'field') {
        oldBinding = this.bindings.find(
                binding => binding.shape === this.selectedShapeName && binding.element === this.selectedElementName
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
        console.log(`${this.selectedShapeName}.${this.selectedElementName} was bound to ${this.selectedFieldName}`)
        if (oldBinding) {
          console.log(`(previously bound to ${oldBinding.field})`)
        }
      } else {
        console.log(`${this.selectedFieldName} was bound to ${this.selectedShapeName}.${this.selectedElementName}`)
        if (oldBinding) {
          console.log(`(previously bound to ${oldBinding.element})`)
        }
      }
      this.rebinding = ''
    },
    applyUnbinding () { // unbinds element or feature
      let oldBinding
        oldBinding = this.bindings.find(
                binding => binding.shape === this.selectedShapeName &&
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
        shapeName: this.selectedShapeName
      })
      const binding = this.bindings.find(
              binding_ => binding_.shape === this.selectedShapeName && binding_.field === this.selectedFieldName
      )
      this.redrawElement(binding)
    }
  },
  watch: {
    selectedShapeName () {
      this.reset()
    },
    glyphNames () {
      if (this.glyphs.length > 0) {
        this.selectedShapeName = this.glyphs[0].name
        this.$emit('update:shapeName', this.selectedShapeName)
      }
    },
    selectedWidth () {
      if (this.numDisplayedGlyphs && Boolean(this.selectedElementName)) {
        this.setPathParameter({
          parameter: 'strokeWidth',
          value: this.selectedWidth,
          shapeName: this.selectedShapeName,
          elementName: this.selectedElement.name
        })
      }
    },
    colorPick () {
      if (this.numDisplayedGlyphs && Boolean(this.selectedElementName) && this.selectedElement.type === 'path') {
        this.setPathParameter({
          parameter: 'strokeColor',
          value: this.colorPick.hex,
          shapeName: this.selectedShapeName,
          elementName: this.selectedElement.name
        })
        if (this.selectedElement.fillColor) {
          this.setPathParameter({
            parameter: 'fillColor',
            value: this.colorPick.hex,
            shapeName: this.selectedShapeName,
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
