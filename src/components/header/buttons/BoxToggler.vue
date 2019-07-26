<template>
    <v-tooltip
            id="tooltip"
            open-delay="700"
            bottom
    >
        <v-btn @click="toggleBoxes" icon slot="activator">
            <v-icon color="primary">check_box_outline_blank</v-icon>
        </v-btn>
        <span>Toggle drawing boxes</span>
    </v-tooltip>
</template>

<script>
import {mapActions} from 'vuex'

export default {
    name: "BoxToggler",
    data () {
        return {drawingBoxVisibility: false}
    },
    methods: {
        ...mapActions({setGlyphVisibility: 'glyph/setGlyphVisibility'}),
        toggleBoxes () {
            this.setGlyphVisibility({
                value: !this.drawingBoxVisibility,
                glyphSelector: 'all',
                shapeSelector: 'main',
                itemSelector: 'drawingBox'
            })
            this.drawingBoxVisibility = !this.drawingBoxVisibility
        }
    }
}
</script>

<style scoped>

</style>
