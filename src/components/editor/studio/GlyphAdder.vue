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
                    <v-text-field placeholder="New glyph name" v-model="writtenGlyphName"/>
                </div>
            </v-toolbar>
<!--            select glyph type-->
            <v-toolbar
                    color="dark"
                    flat
                    dense>
                <v-select
                        class="selector"
                        outlined
                        :items="typeItems"
                        label="Select glyph type"
                        v-model="selectedGlyphType"
                />
<!--                select glyph shape-->
            </v-toolbar>
            <v-toolbar
                    color="dark"
                    flat
                    dense>
                <v-select
                        class="selector"
                        outlined
                        :items="shapeItems"
                        label="Select glyph shape"
                        v-model="selectedGlyphShape"
                />
            </v-toolbar>
            <v-toolbar
                    color="dark"
                    flat
                    dense>
                <v-btn flat class="primary white--text" @click="addGlyphs">
                    add
                </v-btn>
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
        selectedGlyphShape: ''
    }},
    computed: {
        ...mapState({
            glyphs: state => state.glyph.project.glyphs,
            glyphTypes: state => state.glyph.glyphTypes,
            parsedData: state => state.backend.parsedData,
            maxDisplayedGlyphs: state => state.app.maxDisplayedGlyphs
        }),
        typeItems () {
            return this.glyphTypes.map(glyphType => glyphType.type.slice(0, -5))
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
                return selectedType.settings.options
            }
        }
    },
    methods: {
        ...mapActions({
            activateSnackbar: 'app/activateSnackbar',
            setGlyphType: 'glyph/setGlyphType',
            addDataBoundGlyphs: 'glyph/addDataBoundGlyphs',
            activateRedrawing: 'glyph/activateRedrawing',
            changeDisplayedGlyphNum: 'app/changeDisplayedGlyphNum',
            makeEmptyGlyphs: 'glyph/makeEmptyGlyphs'
        }),
        addGlyphs() {
            // if no glyphs are present, one glyph per datapoint is created.
            // Otherwise, empty glyphs are added as children
            if (this.parsedData.length === 0) {
                this.activateSnackbar({
                    text: "Load a data file before adding glyphs",
                    timeout: 3000
                })
            } else if (this.glyphs.length === 0) {
                this.addDataBoundGlyphs({
                    glyphName: this.writtenGlyphName,
                    glyphTypeName: this.selectedGlyphType
                })
                this.changeDisplayedGlyphNum(this.maxDisplayedGlyphs)
                // this.activateRedrawing()
            } else {
                this.makeEmptyGlyphs({
                    glyphName: this.writtenGlyphName,
                    glyphTypeName: this.selectedGlyphType
                })
            }
        }
    }
}
</script>

<style scoped>
.panel {
    margin-top: 0px;
}
.select-title{
    position: relative;
    margin-top: 5px
}
</style>