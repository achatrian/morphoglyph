<template>
    <div>
        <v-card class="panel" flat>
            <v-divider/>
            <v-toolbar
                    color="dark"
                    flat
                    dense>
                <div class="select-title">
                    <v-text-field placeholder="New glyph name" v-model="writtenGlyphName"/>
                </div>
            </v-toolbar>
            <v-toolbar
                    color="dark"
                    flat
                    dense>
                <v-select
                        class="selector"
                        outlined
                        :items="glyphTypeItems"
                        label="Choose glyph type"
                        v-model="selectedGlyphType"
                />
            </v-toolbar>
        </v-card>
    </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'

export default {
    name: "GlyphAdder",
    data () {return{
        writtenGlyphName: '',
        selectedGlyphType: ''
    }},
    computed: {
        ...mapState({
            glyphTypes: state => state.glyph.glyphTypes
        }),
        glyphTypeItems () {
            return this.glyphTypes.map(glyphType => glyphType.name.slice(0, -5))
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