<template>
    <v-list-tile id="tool-tile">
        <v-tooltip
                id="tooltip"
                right
                open-delay="700"
        >
            <v-btn
                    id="glyph"
                    slot="activator"
                    flat
                    block
                    @click="setLegendViewer(true)">
                <v-icon light :color="color">panorama</v-icon>
                <!--TODO bacteria_outline icon-->
            </v-btn>
            <span> View legend </span>
        </v-tooltip>
    </v-list-tile>
</template>

<script>
    import {mapActions} from 'vuex'

    export default {
        name: 'Legend',
        props: {
            color: {type: String, default: 'white'}
        },
        methods: {
            ...mapActions({
                setLegendViewer: 'app/setLegendViewer'
            })
        }
    }
</script>

<style scoped>
    #tooltip {
        width: 100%;
    }

    #glyph {
        min-width: 0px;
    }

    #tool-tile {
        padding: 0px;
    }
</style>
