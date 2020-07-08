<template>
    <div>
        <v-card class="panel" flat>
            <v-divider/>
<!--            input glyph name-->
            <v-toolbar
                    color="dark"
                    flat
                    dense>
                <div class="select-title">
                    <v-text-field label="Glyph name" placeholder="Choose a glyph name" v-model="writtenGlyphName"/>
                </div>
            </v-toolbar>
<!--            select glyph type-->
            <v-toolbar
                    color="dark"
                    flat
                    dense>
                <div class="select-title">
                    <v-select
                            class="selector"
                            outlined
                            :items="typeItems"
                            label="Glyph type"
                            placeholder="Select a type for the new glyph"
                            v-model="selectedGlyphType"
                            ref="type"
                    />
                </div>
<!--                select glyph shape-->
            </v-toolbar>
            <v-toolbar
                    color="dark"
                    flat
                    dense>
                <div class="select-title">
                    <v-select
                            class="selector"
                            outlined
                            :items="shapeItems"
                            label="Glyph shape"
                            placeholder="Select a shape for the new glyph"
                            v-model="selectedGlyphShape"
                            ref="shape"
                    />
                </div>
            </v-toolbar>
            <v-toolbar
                    color="dark"
                    flat
                    dense>
                <div class="select-title">
                    <v-select
                            class="selector"
                            outlined
                            :items="stringFields"
                            label="Ordering feature"
                            placeholder="Select a feature to order glyphs"
                            v-model="selectedOrderFeature"
                            ref="feature"
                    />
                </div>
            </v-toolbar>
            <v-toolbar
                    color="dark"
                    flat
                    dense>
                <div class="buttons">
                    <v-btn flat class="primary white--text" @click="addGlyphs" :disabled="!writtenGlyphName">
                        add
                    </v-btn>
                    <v-btn v-if="globalShape" flat class="secondary primary--text" @click="redrawShape">
                        redraw
                    </v-btn>
                </div>
            </v-toolbar>
<!--            scale height of new glyph w.r.to bounding box-->
        </v-card>
    </div>
</template>


<script>
import {mapState, mapActions} from 'vuex'

export default {
    name: "GlyphAdder",
    data () {return{
        writtenGlyphName: '',
        selectedGlyphType: '',
        selectedGlyphShape: '',
        selectedOrderFeature: ''
    }},
    computed: {
        ...mapState({
            glyphs: state => state.glyph.project.glyphs,
            glyphTypes: state => state.glyph.glyphTypes,
            parsedData: state => state.backend.parsedData,
            maxDisplayedGlyphs: state => state.app.maxDisplayedGlyphs,
            fieldTypes: state => state.backend.fieldTypes,
            namingField: state => state.backend.namingField,
            dataFields: state => state.backend.dataFields,
            shapeJSONStore: state => state.backend.shapeJSONStore
        }),
        typeItems () {
            return this.glyphTypes.map(glyphType => glyphType.type.slice(0, -5))
        },
        globalShape () {
            let globalShapes = []
            for (const [name, shape] of this.shapeJSONStore.entries()) {
                if (shape.type === 'global') {
                    globalShapes.push({...shape, name: name})
                }
            }
            globalShapes = globalShapes.filter(shape => !shape.glyph) // remove all shapes that already have an assigned glyph
            return globalShapes.length ? globalShapes[0] : null
        },
        shapeItems () {
            const selectedType = this.glyphTypes.find(glyphType => glyphType.type.startsWith(this.selectedGlyphType))
            if (!selectedType) {
                console.log(`No type was found matching name ${this.selectedGlyphType}`)
                return []
            } else if (selectedType.settings.name !== 'shapeType') {
                console.warn(`Settings '${selectedType.settings.name}' don't allow shape selection for type '${selectedType.name}'`)
                return []
            } else {
                const items = []
                for (const item of selectedType.settings.options) {
                    let shapeName = (item === 'custom' && Boolean(this.globalShape)) ? (' - ' + this.globalShape.name) : ''
                    items.push({
                        text: item + shapeName,
                        value: item
                    })
                }
                return items
            }
        },
        stringFields () { // items for cluster name selector
            // string fields for select
            let fields = []
            if (this.glyphs.length > 0) {
                // if top glyphs are already created,
                // he naming field must be the same as for the top glyphs
                fields.push(this.namingField)
            } else {
                for (const field of this.dataFields) {
                    if (this.fieldTypes[field] === String) {
                        fields.push(field)
                    }
                }
                if (fields.length === 0) {
                    fields = this.dataFields // if no string fields are available, let user choose any field
                }
            }
            return fields
        },
    },
    methods: {
        ...mapActions({
            activateSnackbar: 'app/activateSnackbar',
            setGlyphType: 'glyph/setGlyphType',
            setShapeCanvasState: 'app/setShapeCanvasState',
            addDataBoundGlyphs: 'glyph/addDataBoundGlyphs',
            activateRedrawing: 'glyph/activateRedrawing',
            setNamingField: 'backend/setNamingField',
            setGlyphParameters: 'glyph/setGlyphParameters',
            changeDisplayedGlyphNum: 'app/changeDisplayedGlyphNum',
            removeShapeJSON: 'backend/removeShapeJSON',
            assignGlyphToShape: 'backend/assignGlyphToShape'
        }),
        addGlyphs () {
            // if no glyphs are present, one glyph per data-point is created.
            // Otherwise, empty glyphs are added as children
            if (this.parsedData.length === 0) {
                this.activateSnackbar({
                    text: "Load a data file before adding glyphs",
                    timeout: 3000
                })
            } else {
                setTimeout(function (this_) {
                    if (this_.glyphs.length === 0) {
                        this_.setNamingField(this_.selectedOrderFeature)
                        this_.addDataBoundGlyphs({
                            glyphName: this_.writtenGlyphName,
                            glyphTypeName: this_.selectedGlyphType
                        })
                        this_.setGlyphParameters({
                            parameters: {
                                shapeType: this_.selectedGlyphShape,
                            },
                            glyphName: this_.writtenGlyphName
                        })
                        this_.changeDisplayedGlyphNum(this_.maxDisplayedGlyphs)
                        // this_.activateRedrawing()
                    } else {
                        this_.setNamingField(this_.selectedOrderFeature)
                        this_.addDataBoundGlyphs({
                            glyphName: this_.writtenGlyphName,
                            glyphTypeName: this_.selectedGlyphType
                        })
                        this_.setGlyphParameters({
                            parameters: {
                                shapeType: this_.selectedGlyphShape,
                            },
                            glyphName: this_.writtenGlyphName
                        })
                    }
                    if (this_.selectedGlyphShape === 'custom') {
                        this_.assignGlyphToShape({shapeName: this_.globalShape.name, glyphName: this_.writtenGlyphName})
                    }
                    this_.reset()
                }, 100, this)
            }
        },
        redrawShape () {
            this.removeShapeJSON(this.globalShape.name)
            this.setShapeCanvasState(true)
        },
        reset () {
            this.writtenGlyphName = ''
            this.selectedGlyphType = ''
            this.selectedGlyphShape = ''
            this.selectedOrderFeature = ''
        }
    },
    watch: {
        selectedGlyphShape () {
            if (this.selectedGlyphShape === 'custom' && !this.globalShape) {
                this.setShapeCanvasState(true)
            } else {
                this.setShapeCanvasState(false)
            }
        }
    },
    mounted() {
        this.writtenGlyphName = 'MyGlyph'
        this.selectedGlyphType = this.glyphTypes[0].type
        this.selectedGlyphShape = this.shapeItems[0].text
        this.selectedOrderFeature = this.stringFields[0]
    }
}
</script>

<style scoped>
    .panel {
        margin-top: 2px;
    }

    .select-title{
        position: relative;
        margin-top: 20px;
        width: 100%
    }
</style>