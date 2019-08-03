<template>
        <v-container fluid>
            <v-card id='bind-card' class="light elevation-5">
                <v-layout column justify-end>
                    <v-layout row>
                        <v-flex xs12>
                            <v-card-text class="title">
                                <span class="font-weight-bold">Bind Options: </span> Select element-feature pairs
                            </v-card-text>
                        </v-flex>
                    </v-layout>
                    <v-layout row justify-space-around wrap>
                        <v-flex xs6 sm3>
                            <v-select
                                    class="selector"
                                    outlined
                                    :items="glyphNames"
                                    label="Choose glyph type"
                                    v-model="selectedGlyphName"
                            />
                        </v-flex>
                        <v-flex xs6 sm3>
                            <v-select
                                    class="selector"
                                    outlined
                                    :items="settingOptions"
                                    :label="glyphSettings.message || 'Choose glyph-specific options'"
                                    v-model="selectedGlyphSetting"
                            />
                        </v-flex>
                        <v-flex xs6 sm3>
                            <v-select
                                    class="selector"
                                    outlined
                                    :items="stringFields"
                                    label="Choose cluster names"
                                    v-model="selectedOrderField"
                            />
                        </v-flex>
                        <v-flex xs6 sm3>
                            <v-btn round flat @click="setGlyphBinderState(false)">
                                <v-icon color="primary">close</v-icon>
                            </v-btn>
                        </v-flex>
                    </v-layout>
                    <v-layout row wrap>
                        <v-flex xs6 md3>
                            <app-scroll-options title="Shape selection" v-if="glyphShapes.children.length > 0"
                                                :items="shapeItems" :select.sync="selectedShape"/>
                        </v-flex>
                        <v-flex xs6 md3>
                            <app-scroll-options title="Element selection"
                                                :items="elementItems" :select.sync="selectedGlyphEl"/>
                        </v-flex>
                        <v-flex xs6 md3>
                            <app-scroll-options title="Feature selection"
                                                    :items="fieldItems" :select.sync="selectedField"/>
                        </v-flex>

                        <v-flex xs6 md3>
                            <app-scroll-options title="Binding selection"
                                                :items="bindingItems"/>
                        </v-flex>
                    </v-layout>
                    <v-layout row wrap align-end justify-space-around>
                        <v-flex xs6 md3 d-flex>
                            <v-btn flat class="primary white--text" @click="bindFieldToElement">Bind</v-btn>
                        </v-flex>
                        <v-flex xs6 md3 d-flex>
                            <v-btn flat class="secondary black--text" @click="unbindFieldsToElements">Unbind</v-btn>
                        </v-flex>
                        <v-flex xs6 md3 d-flex>
                            <v-btn flat class="dark white--text" @click.native="applyBinding">OK</v-btn>
                        </v-flex>
                        <v-flex xs6 md3 d-flex>
                            <app-load-config @configLoaded="applyConfig"/>
                        </v-flex>
                    </v-layout>
                </v-layout>
            </v-card>
        </v-container>
</template>

<script>
    import {mapState, mapActions} from 'vuex'
    import LoadConfig from './buttons/LoadConfig'
    import ScrollOptions from './panels/ScrollOptions'

    export default {
        name: 'BindOptions',
        components: {
            'app-scroll-options': ScrollOptions,
            'app-load-config': LoadConfig
        },
        data () {
            return {
                selectedShape: '',
                selectedGlyphEl: '',
                selectedField: '',
                fieldBindings: [],
                selectedGlyphName: '',
                selectedOrderField: '', // selected field of cluster names
                selectedGlyphSetting: ''

            }
        },
        computed: {
            ...mapState({
                glyphs: state => state.glyph.project.glyphs,
                glyphTypes: state => state.glyph.glyphTypes,
                glyphSettings: state => state.glyph.glyphSettings,
                glyphShapes: state => state.glyph.glyphShapes,
                glyphElements: state => state.glyph.glyphElements,
                dataFields: state => state.backend.dataFields,
                fieldTypes: state => state.backend.fieldTypes,
                fileName: state => state.backend.fileName,
                loadedBindingData: state => state.backend.loadedBindingData,
                numDisplayedGlyphs: state => state.app.numDisplayedGlyphs,
                maxDisplayedGlyphs: state => state.app.maxDisplayedGlyphs,
            }),
            glyphNames () { // names of glyph types for selection
                let glyphNames = []
                this.glyphTypes.forEach(glyphType => glyphNames.push(glyphType.type))
                return glyphNames
            },
            settingOptions () {
                return this.glyphSettings.options
            },
            shapeItems () {
                let items = []
                const allShapes = this.glyphShapes.children.concat([this.glyphShapes.main])
                allShapes.forEach((shapeName, id) => {
                    items.push({
                        id: id,
                        value: shapeName,
                        selected: false
                    })
                })
                return items
            },
            elementItems () { // items for list of elements
                let items = []
                this.glyphElements.forEach((element, id) => {
                    if (element.target === this.selectedShape) { // only push elements targeting selected shape
                        items.push({
                            id: id,
                            value: element.name,
                            selected: false
                        })
                    }
                })
                return items
            },
            fieldItems () { // item for list of features
                let items = []
                this.dataFields.forEach((field, id) => {
                    if (this.fieldTypes[field] === Number) {
                        items.push({
                            id: id,
                            value: field,
                            selected: false
                        })
                    }
                })
                return items
            },
            bindingItems () { // items for list of bindings
                let items = []
                this.fieldBindings.forEach(({shape, element, field}, id) => {
                    items.push({
                        id: id,
                        value: (this.glyphShapes.length === 1) ? `${element} - ${field}` : `${shape}.${element} = ${field}`,
                        selected: false
                    })
                })
                return items
            },
            stringFields () { // items for cluster name selector
                // string fields for select
                let fields = []
                for (let field of this.dataFields) {
                    if (this.fieldTypes[field] === String) {
                        fields.push(field)
                    }
                }
                if (fields.length === 0) {
                    fields = this.dataFields // if no string fields are available, let user choose any field
                }
                return fields
            }
        },
        methods: {
            ...mapActions({
                setGlyphBinderState: 'app/setGlyphBinderState',
                setGlyphType: 'glyph/setGlyphType',
                setBindings: 'glyph/setBindings',
                addGlyphs: 'glyph/addGlyphs',
                discardGlyphs: 'glyph/discardGlyphs',
                changeDisplayedGlyphNum: 'app/changeDisplayedGlyphNum',
                setNamingField: 'backend/setNamingField',
                normalizeFeatures: 'backend/normalizeFeatures'
            }),
            bindFieldToElement () { // function to turn element and feature selections into a binding object
                console.log(`Binding ${this.selectedGlyphEl} to ${this.selectedField}`)
                let previousBinding = -1
                this.fieldBindings.forEach((binding, i) => {
                    if (binding.shape === this.selectedShape && binding.element === this.selectedGlyphEl) {
                        previousBinding = i
                    }
                }) // remove all previous bindings of element
                delete this.fieldBindings[previousBinding]
                this.fieldBindings.push({
                    shape: this.selectedShape,
                    element: this.selectedGlyphEl,
                    field: this.selectedField
                })
            },
            unbindFieldsToElements () {
                for (let item of this.bindingItems) {
                    for (let i = 0; i < this.fieldBindings.length; i++) {
                        let itemShape, itemElement, itemField
                        if (item.value.split('.').length === 1) { // account for different string types depending on number of shapes
                            itemShape = this.selectedShape
                            itemElement = item.value.split('=')[0].slice(0, -1) // item.value = 'element = field'
                            itemField = item.value.split('=')[1].slice(1)
                        } else {
                            itemShape = item.value.split('.')[0]
                            itemElement = item.value.split('.')[1].split('=')[0].slice(0, -1) // item.value = 'shape.element = field'
                            itemField = item.value.split('.')[1].split('=')[1].slice(1)
                        }
                        let binding = this.fieldBindings[i]
                        if (item.selected && binding.shape === itemShape &&
                            binding.element === itemElement && binding.field === itemField) {
                            this.fieldBindings.splice(i, 1)
                            console.log(`Unbinding ${binding.element} and ${binding.field}`)
                        }
                    }
                }
            },
            applyBinding () { // uses bindings to draw glyphs
                this.setNamingField(this.selectedOrderField)
                this.setBindings(this.fieldBindings)
                if (this.glyphs.length > 0) {
                    this.discardGlyphs()
                }
                this.addGlyphs() // uses store.glyph.glyphTypeName
                this.setGlyphBinderState(false)
                let coNormalizeGroups = []
                let scaleNormalizeGroup = []
                for (let binding of this.fieldBindings) {
                    let element = this.glyphElements.find(element => element.name === binding.element)
                    if (element.type === 'scale') {
                        scaleNormalizeGroup.push(binding.field) // scale together all the features corresponding to scale-type elements
                    }
                }
                if (scaleNormalizeGroup.length > 0) {
                    coNormalizeGroups.push(scaleNormalizeGroup)
                }
                this.normalizeFeatures(coNormalizeGroups) // renormalize features to fix spatial scale
                // when first called, num displayed glyph is 0
                this.changeDisplayedGlyphNum(this.numDisplayedGlyphs || this.maxDisplayedGlyphs)
            },
            selectField (item) {
                this.selectedField = item.value
                this.fieldItems.forEach(item => {
                    item.selected = false
                })
                item.selected = true
            },
            selectGlyphEl (item) {
                this.selectedGlyphEl = item.value
                this.elementItems.forEach(item => {
                    item.selected = false
                })
                item.selected = true
            },
            applyConfig () { // apply bindings loaded from file
                if (this.fileName === this.loadedBindingData.fileName && this.loadedBindingData.bindings.length > 0) {
                    this.selectedOrderField = this.loadedBindingData.displayOrderField
                    this.selectedGlyphName = this.loadedBindingData.glyphType
                    this.selectedGlyphSetting = this.loadedBindingData.glyphSetting
                    this.setGlyphType({glyphTypeName: this.selectedGlyphName, glyphSetting: this.selectedGlyphSetting})
                    this.fieldBindings = this.loadedBindingData.bindings
                    console.log("Using loaded glyph configuration")
                } else {
                    console.log("Invalid config file - cannot load")
                }
            }
        },
        watch: {
            glyphShapes () { // if shapes array contains only one element or it is empty, assign it automatically
                if (this.glyphShapes.children.length === 0 || this.selectedShape === '') {
                    this.selectedShape = this.glyphShapes.main
                } else {
                    this.selectedShape = '' // otherwise, reset
                }
            },
            selectedGlyphName () {
                // watcher that loads the type of glyph, and makes the glyph elements available for selection
                if (this.selectedGlyphName !== 'None') {
                    this.setGlyphType({glyphTypeName: this.selectedGlyphName, glyphSetting: this.selectedGlyphSetting})
                }
            },
            selectedGlyphSetting () {
                // same as above, to update setting when needed
                if (this.selectedGlyphName !== 'None') {
                    this.setGlyphType({glyphTypeName: this.selectedGlyphName, glyphSetting: this.selectedGlyphSetting})
                }
            }
        }
    }
</script>
<style scoped>
    #bind-card{
        width: 100%;
        margin: auto
    }

    .selector{
        max-width: 200px;
        margin: auto
    }
</style>
