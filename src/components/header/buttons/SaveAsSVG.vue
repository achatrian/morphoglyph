<template>
    <v-tooltip
            id="tooltip"
            open-delay="700"
            bottom
    >
        <v-btn icon slot="activator"
               @click="saveAsSVG"
               :disabled="!drawn">
            <v-icon color="primary">image</v-icon>
        </v-btn>
        <span>Download SVG version of current glyph arrangement</span>
    </v-tooltip>
</template>

<script>
    import {mapActions, mapState} from 'vuex'

    export default {
        name: "SaveAsSVG",
        computed: {
            ...mapState({
                glyphs: state => state.glyph.project.glyphs
            }),
            drawn () {
                return this.glyphs.some(glyph => glyph.drawn)
            }
        },
        methods: {
            ...mapActions({
              saveAsSVG: 'glyph/saveAsSVG'
            })
        }
    }
</script>

<style scoped>

</style>