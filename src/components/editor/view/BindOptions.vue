<template>
        <v-container fluid>
            <v-card id='bind-card' class="light elevation-5">
                <v-layout column justify-space-around>
                    <v-layout row>
                        <v-flex xs12>
                            <v-card-text class="title">
                                <span class="font-weight-bold">Bind Options: </span> Select element-feature pairs
                            </v-card-text>
                        </v-flex>
                    </v-layout>
                    <v-layout row justify-space-around wrap>
                        <v-flex xs6 sm2>
                            <v-select
                                    class="selector"
                                    outlined
                                    :items="glyphNames"
                                    label="Choose glyph type"
                                    v-model="selectedGlyphName"
                            />
                        </v-flex>
                        <v-flex xs6 sm2>
                            <v-select
                                    class="selector"
                                    outlined
                                    :items="settingOptions"
                                    :label="glyphSettings.message || 'Choose glyph-specific options'"
                                    v-model="selectedGlyphSetting"
                            />
                        </v-flex>
                        <v-flex xs6 sm2>
                            <v-select
                                    class="selector"
                                    outlined
                                    :items="stringFields"
                                    label="Choose cluster names"
                                    v-model="selectedOrderField"
                            />
                        </v-flex>
                        <v-flex xs6 sm6>
                            <v-btn round flat @click="setGlyphBinderState(false); setGlyphVisibility({value: true})"
                            style="left: 50%">
                                <v-icon color="primary">close</v-icon>
                            </v-btn>
                        </v-flex>
                    </v-layout>
                    <v-tabs v-model="selectedShapeIndex" color="secondary"
                            slider-color="primary" grow>
                        <v-tab v-for="item of shapeItems" :key="item.id" :value="item.value">
                            {{item.value}}
                        </v-tab>
                    </v-tabs>
                    <v-layout row wrap>
                        <v-flex xs12 md6 >
                            <app-scroll-options title="Element selection" :items="elementItems"
                                                :select.sync="selectedGlyphEl" @buttonClick="unbindElement"/>
                        </v-flex>
                        <v-flex xs12 md6>
                            <app-scroll-options title="Feature selection" :items="fieldItems"
                                                @change="bindFieldToElement" @buttonClick="unbindField"/>
                        </v-flex>
                    </v-layout>
                    <v-layout row wrap align-end justify-space-around>
                        <v-flex xs6 md3 d-flex>
                            <v-btn flat class="primary white--text" @click="applyBinding">Bind</v-btn>
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
                selectedShapeIndex: 0,
                selectedShape: '',
                selectedGlyphEl: '',
                fieldBindings: [],
                selectedGlyphName: '',
                selectedOrderField: '', // selected field of cluster names
                selectedGlyphSetting: '',
                lastUnboundField: '' // used to flag which field needs re-clicking to be bound again
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
                        key: shapeName,
                        value: shapeName,
                        selected: false,
                        button: false
                    })
                })
                return items
            },
            elementItems () { // items for list of elements
                let items = []
                for (let [i, element] of this.glyphElements.entries()) {
                    if (element.target === this.selectedShape) { // only push elements targeting selected shape
                        let elementBinding = this.fieldBindings.find(
                            binding => binding.element === element.name && binding.shape === element.target
                        )
                        items.push({
                            id: i,
                            key: element.name,
                            value: element.name + (elementBinding ? ' ( bound feature: ' + elementBinding.field + ' )': ''),
                            selected: this.selectedGlyphEl === element.name,
                            button: Boolean(elementBinding)
                        })
                    }
                }
                return items
            },
            fieldItems () { // item for list of features
                let items = []
                let i = 0
                const value = (field, fieldBinding) => {
                    if (fieldBinding) {
                        return field + ' ( bound to ' + fieldBinding.shape + '\'s ' + fieldBinding.element + ' )'
                    } else if (this.lastUnboundField === field) {
                        return field + ' ( unbound )' // flag that field was just unbound
                    } else {
                        return field
                    }
                }
                for (let field of this.dataFields) {
                    if (this.fieldTypes[field] === Number) { // TODO update this to work for categorical variables
                        let fieldBinding = this.fieldBindings.find(binding => binding.field === field && binding.shape)
                        items.push({
                            id: i,
                            key: field,
                            value: value(field, fieldBinding),
                            selected: Boolean(fieldBinding), // all bound features are highlighted
                            button: Boolean(fieldBinding)
                        })
                        i++
                    }
                }
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
                addDataBoundGlyphs: 'glyph/addDataBoundGlyphs',
                discardGlyphs: 'glyph/discardGlyphs',
                changeDisplayedGlyphNum: 'app/changeDisplayedGlyphNum',
                setNamingField: 'backend/setNamingField',
                normalizeFeatures: 'backend/normalizeFeatures',
                setGlyphVisibility: 'glyph/setGlyphVisibility'
            }),
            bindFieldToElement (selectedField) { // function to turn element and feature selections into a binding object
                if (this.selectedGlyphEl) {
                    let previousBinding = -1
                    this.fieldBindings.forEach((binding, i) => {
                        if (binding.shape === this.selectedShape && binding.element === this.selectedGlyphEl) {
                            previousBinding = i
                        }
                    }) // remove all previous bindings of element
                    if (previousBinding >= 0) {
                        this.fieldBindings.splice(previousBinding)
                    }
                    this.fieldBindings.push({
                        shape: this.selectedShape,
                        element: this.selectedGlyphEl,
                        field: selectedField
                    })
                    console.log(`${this.selectedGlyphEl} was bound to ${selectedField}`)
                }
            },
            unbindField (field) {
                console.log(`Unbinding ${field}`)
                this.fieldBindings = this.fieldBindings.filter(binding => binding.field !== field)
                this.lastUnboundField = field
            },
            unbindElement (element) {
                console.log(`Unbinding ${this.selectedShape}'s ${element}`)
                this.fieldBindings = this.fieldBindings.filter(
                    binding => !(binding.element === element && this.selectedShape === binding.shape)
                )
            },
            applyBinding () { // uses bindings to draw glyphs
                // FIXME default shape selection for ShapeGlyph is broken
                this.setNamingField(this.selectedOrderField)
                this.setBindings(this.fieldBindings)
                if (this.glyphs.length > 0) {
                    this.discardGlyphs()
                }
                this.addDataBoundGlyphs() // uses store.glyph.glyphTypeName
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
                this.normalizeFeatures(coNormalizeGroups) // re-normalize features to fix spatial scale
                // when first called, num displayed glyph is 0
                this.changeDisplayedGlyphNum(this.numDisplayedGlyphs || this.maxDisplayedGlyphs) // FIXME first outcome is redundant
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
            selectedShapeIndex () { // v-tabs gives scalar number, use to selected desired shape
              this.selectedShape = this.shapeItems[this.selectedShapeIndex].value
            },
            selectedGlyphName () {
                // watcher that loads the type of glyph, and makes the glyph elements available for selection
                if (this.selectedGlyphName !== 'None') {
                    for (let glyphType of this.glyphTypes) {
                        if (glyphType.type === this.selectedGlyphName) {
                            this.selectedShape = glyphType.shapes.main
                        }
                    }
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
        max-width: 90%;
        margin: auto
    }
</style>
