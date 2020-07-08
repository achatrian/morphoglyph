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
                    <v-flex xs6 sm3>
                        <!--FIXME must make this work both for creating glyph and assigning elements to glyphs-->
                        <v-text-field
                                placeholder="Choose a glyph name"
                                class="selector"
                                style="margin-top: -20px"
                                v-if="glyphs.length === 0"
                                v-model="typedGlyphName"
                                :readonly="Boolean(selectedGlyphName)"
                        >
                            <template slot="append">
                                <v-btn icon
                                       @click="selectedGlyphName = typedGlyphName"
                                       v-if="!selectedGlyphName"
                                >
                                    <v-icon>check</v-icon>
                                </v-btn>
                                <v-btn icon
                                       @click="selectedGlyphName = ''; typedGlyphName= ''; fieldBindings = [...bindings]"
                                       v-if="selectedGlyphName"
                                >
                                    <v-icon>cancel</v-icon>
                                </v-btn>
                            </template>
                        </v-text-field>
                        <v-select
                                v-else
                                class="selector"
                                :items="mainGlyphNames"
                                label="Choose glyph"
                                v-model="selectedGlyphName"
                        >
                        </v-select>

                    </v-flex>
                    <v-flex xs6 sm3>
                        <v-select
                                :disabled="glyphs.length > 0 || !selectedGlyphName"
                                class="selector"
                                outlined
                                :items="glyphTypeNames"
                                label="Choose glyph type"
                                v-model="selectedGlyphType"
                        />
                    </v-flex>
                    <v-flex xs6 sm3>
                        <v-select
                                class="selector"
                                outlined
                                :items="settingOptions"
                                :label="glyphSettings.message || 'Choose glyph-specific options'"
                                v-model="selectedGlyphSetting"
                                :disabled="!selectedGlyphName"
                        />
                    </v-flex>
                    <v-flex xs6 sm3>
                        <v-select
                                class="selector"
                                outlined
                                :items="stringFields"
                                label="Choose cluster names"
                                v-model="selectedOrderField"
                                :disabled="!selectedGlyphName || !fileName"
                        />
                    </v-flex>
                </v-layout>
                <v-tabs v-model="selectedShapeIndex" color="secondary" slider-color="primary" grow>
                    <v-tab v-for="item of shapeItems" :key="item.id" :value="item.value">
                        {{item.value}}
                    </v-tab>
                </v-tabs>
                <v-layout row wrap align-centre>
                    <v-flex xs6 md3 >
                        <app-scroll-options title="Element selection" :items="elementItems" @change="selectedField=''"
                                            :select.sync="selectedGlyphEl" @buttonClick="unbindElement" class="list"/>
                    </v-flex>
                    <v-flex xs6 md3>
                        <app-scroll-options title="Feature selection" :items="fieldItems" :select.sync="selectedField"
                                            @change="bindFieldToElement" @buttonClick="unbindField" class="list"/>
                    </v-flex>
                    <v-flex x12 md6>
                        <app-bindings-table class="bindings-table" :bindings="fieldBindings"/>
                    </v-flex>
                </v-layout>
                <v-layout row align-end justify-space-between>
                    <v-flex xs4 md4 d-flex>
                        <v-btn flat class="primary white--text button" @click="applyBinding">Bind</v-btn>
                    </v-flex>
                    <v-flex xs4 md4 d-flex>
                        <v-btn flat class="secondary primary--text button"
                               @click="fieldBindings = [...bindings]">Revert</v-btn>
                    </v-flex>
                    <v-flex xs4 md4 d-flex>
                        <v-btn flat class="dark white--text button"
                               @click="setGlyphBinderState(false); setGlyphVisibility({value: true})">Close</v-btn>
                    </v-flex>
                </v-layout>
            </v-layout>
        </v-card>
    </v-container>
</template>

<script>
    import {mapState, mapActions} from 'vuex'
    import ScrollOptions from './panels/ScrollOptions'
    import BindingsTable from './panels/BindingsTable'

    export default {
        name: 'BindOptions',
        components: {
            'app-scroll-options': ScrollOptions,
            'app-bindings-table': BindingsTable
        },
        data () {
            return {
                selectedShapeIndex: 0,
                selectedShape: '',
                selectedGlyphEl: '',
                selectedField: '',
                fieldBindings: [],
                selectedGlyphType: 'Shape',
                typedGlyphName: 'New Glyph',
                selectedGlyphName: '',
                selectedOrderField: '', // selected field of cluster names
                selectedGlyphSetting: 'ellipse',
                lastUnboundField: '', // used to flag which field needs re-clicking to be bound again,
                selectedTemplateName: '',
            }
        },
        computed: {
            ...mapState({
                glyphs: state => state.glyph.project.glyphs,
                glyphTypes: state => state.glyph.glyphTypes,
                mainGlyphNames: state => state.glyph.project.mainGlyphNames,
                glyphSettings: state => state.glyph.glyphSettings,
                glyphShapes: state => state.glyph.glyphShapes,
                glyphElements: state => state.glyph.glyphElements,
                bindings: state => state.glyph.project.bindings,
                dataFields: state => state.backend.dataFields,
                fieldTypes: state => state.backend.fieldTypes,
                fileName: state => state.backend.fileName,
                loadedBindingData: state => state.backend.loadedBindingData,
                numDisplayedGlyphs: state => state.app.numDisplayedGlyphs,
                maxDisplayedGlyphs: state => state.app.maxDisplayedGlyphs
            }),
            glyphTypeNames () { // names of glyph types for selection
                let glyphTypeNames = []
                this.glyphTypes.forEach(glyphType => glyphTypeNames.push(glyphType.type.slice(0, -5)))  // slice away 'Glyph'
                return glyphTypeNames
            },
            settingOptions () {
                return this.glyphSettings.options
            },
            shapeItems () {
                let items = []
                const allShapes = [this.glyphShapes.main, ...this.glyphShapes.children]  // default selection is main
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
                for (const [i, element] of this.glyphElements.entries()) {
                    if (element.target === this.selectedShape) { // only push elements targeting selected shape
                        const elementBinding = this.fieldBindings.find(
                            binding => binding.element === element.name && binding.shape === element.target
                        )
                        items.push({
                            id: i,
                            key: element.name,
                            value: element.name, // + (elementBinding ? ' ( bound feature: ' + elementBinding.field + ' )': ''),
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
                for (const field of this.dataFields) {
                    if (this.fieldTypes[field] === Number) { // TODO update this to work for categorical variables
                        const fieldBinding = this.fieldBindings.find(binding => binding.field === field && binding.shape)
                        items.push({
                            id: i,
                            key: field,
                            value: field,
                            selected: this.selectedField === field,
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
                for (const field of this.dataFields) {
                    if (this.fieldTypes[field] === String) {
                        fields.push(field)
                    }
                }
                if (fields.length === 0) {
                    fields = this.dataFields // if no string fields are available, let user choose any field
                }
                return fields
            },
        },
        methods: {
            ...mapActions({
                setGlyphBinderState: 'app/setGlyphBinderState',
                activateSnackbar: 'app/activateSnackbar',
                setGlyphType: 'glyph/setGlyphType',
                chooseGlyphSetting: 'glyph/chooseGlyphSetting',
                setBindings: 'glyph/setBindings',
                addDataBoundGlyphs: 'glyph/addDataBoundGlyphs',
                changeDisplayedGlyphNum: 'app/changeDisplayedGlyphNum',
                activateRedrawing: 'glyph/activateRedrawing',
                setNamingField: 'backend/setNamingField',
                normalizeFeatures: 'backend/normalizeFeatures',
                setGlyphVisibility: 'glyph/setGlyphVisibility',
            }),
            shapeCheck (binding) {
                return binding.name === this.selectedGlyphName && binding.shape === this.selectedShape
            },
            bindFieldToElement (selectedField) { // function to turn element and feature selections into a binding object
                if (!this.selectedGlyphName) {
                    this.activateSnackbar({text: "Choose glyph name before binding elements"})
                    return
                }
                if (this.selectedGlyphEl) {
                    let previousBinding = -1
                    this.fieldBindings.forEach((binding, i) => {
                        if (this.shapeCheck(binding) && binding.element === this.selectedGlyphEl) {
                            previousBinding = i
                        }
                    }) // remove all previous bindings of element
                    if (previousBinding >= 0) {
                        this.fieldBindings.splice(previousBinding)
                    }
                    this.fieldBindings.push({
                        name: this.selectedGlyphName,
                        shape: this.selectedShape,
                        element: this.selectedGlyphEl,
                        field: selectedField
                    })
                    console.log(`${this.selectedGlyphEl} was bound to ${selectedField}`)
                }
                this.selectedGlyphEl = ''
                this.selectedField = ''
            },
            unbindField (field) {
                console.log(`Unbinding ${field}`)
                this.fieldBindings = this.fieldBindings.filter(binding => binding.field !== field)
                this.lastUnboundField = field
            },
            unbindElement (element) {
                console.log(`Unbinding ${this.selectedShape}'s ${element}`)
                this.fieldBindings = this.fieldBindings.filter(
                    binding => !(binding.element === element && this.shapeCheck(binding))
                )
            },
            applyBinding () { // uses bindings to draw glyphs
                // FIXME default shape selection for ShapeGlyph is broken
                this.setNamingField(this.selectedOrderField)
                this.setBindings(this.fieldBindings)
                this.normalizeFeatures() // re-normalize features to fix spatial scale
                if (this.glyphs.length === 0) {
                    this.addDataBoundGlyphs({
                        glyphTypeName: this.selectedGlyphType,
                        glyphName: this.selectedGlyphName // TODO find good way of switching from list of existing glyphs to creation of new one
                    }) // uses store.glyph.glyphTypeName
                    this.chooseGlyphSetting(this.selectedGlyphSetting)
                    // when first called, num displayed glyph is 0
                    this.changeDisplayedGlyphNum(this.numDisplayedGlyphs || this.maxDisplayedGlyphs) // FIXME first outcome is redundant
                } else {
                    setTimeout(this.activateRedrawing, 100)
                }
                this.setGlyphBinderState(false)
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
            }
        },
        watch: {
            selectedGlyphName () {
                if (this.glyphs.length > 0) {
                    const glyph = [...this.glyphs[0].iter(true)].find(glyph => glyph.name === this.selectedGlyphName)
                    if (glyph) {
                        this.selectedGlyphType = glyph.constructor.type.slice(0, -5)
                    }
                }

            },
            selectedShapeIndex () { // v-tabs gives scalar number, use to selected desired shape
              this.selectedShape = this.shapeItems[this.selectedShapeIndex].value
            },
            selectedGlyphType: {
                immediate: true,  // fire on component mounting TODO test
                handler () {
                    // watcher that loads the type of glyph, and makes the glyph elements available for selection
                    const glyphObjectName = this.selectedGlyphType + 'Glyph'
                    for (const glyphType of this.glyphTypes) {
                        if (glyphType.type === glyphObjectName) {
                            this.selectedShape = glyphType.shapes.main
                        }
                    }
                    this.setGlyphType({glyphTypeName: this.selectedGlyphType, glyphSetting: this.selectedGlyphSetting})
                    if (this.glyphs.length === 0) { // when adding data bound glyphs through bind options, if type is changed clear all the bindings
                        this.fieldBindings = this.fieldBindings.filter(binding => this.shapeCheck(binding))
                    }
                }
            },
            selectedGlyphSetting () {
                // same as above, to update setting when needed
                if (this.selectedGlyphType !== 'None') {
                    this.setGlyphType({glyphTypeName: this.selectedGlyphType, glyphSetting: this.selectedGlyphSetting})
                }
            },
            bindings: {
                deep: true,
                handler () {
                    this.fieldBindings = [...this.bindings]
                }
            }
        },
        mounted () {
            if (!this.selectedShape) {
                this.selectedShape = this.shapeItems[this.selectedShapeIndex].value
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

    /*.list{*/
    /*    max-width: 40%;*/
    /*}*/

    .bindings-table{
        max-width: 90%;
        max-height: 20%;
        position: center;
        margin: auto
    }

    .button{
        /*max-width: 30%;*/
    }
</style>
