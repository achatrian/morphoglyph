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
                        @change=setGlyphType_
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
                <v-btn flat class="primary white--text" @click="makeEmptyGlyphs_">
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
            glyphTypes: state => state.glyph.glyphTypes
        }),
        typeItems () {
            return this.glyphTypes.map(glyphType => glyphType.name.slice(0, -5))
        },
        shapeItems () {
            const selectedType = this.glyphTypes.find(glyphType => glyphType.name.startsWith(this.selectedGlyphType))
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
            setGlyphType: 'glyph/setGlyphType',
            makeEmptyGlyphs: 'glyph/makeEmptyGlyphs'
        }),
        makeEmptyGlyphs_ () {
            this.makeEmptyGlyphs({newGlyphName: this.writtenGlyphName})
        },
        setGlyphType_ (selectedGlyphType) {
            this.setGlyphType({glyphTypeName: selectedGlyphType})
            const selectedType = this.glyphTypes.find(glyphType => glyphType.name.startsWith(this.selectedGlyphType))
            if (!selectedType) {
                this.selectedGlyphShape = selectedType.settings.default
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