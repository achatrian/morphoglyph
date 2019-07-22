<template>
    <v-btn @click="toggleBoxes" icon>
        <v-icon color="primary">check_box_outline_blank</v-icon>
    </v-btn>
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
