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
                :color="color"
                @click="setTemplateManagerState(!templateManager)"
            >
                <v-icon light :color="color">description</v-icon>
            </v-btn>
            <span> View and edit templates </span>
        </v-tooltip>
    </v-list-tile>
</template>

<script>
    import {mapState, mapActions} from 'vuex'

    export default {
        name: 'Shape',
        props: {
            color: {type: String, default: 'white'}
        },
        computed: {
          ...mapState({
              templateManager: state => state.app.templateManager
          })
        },
        methods: {
            ...mapActions({
                setTemplateManagerState: 'app/setTemplateManagerState'
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
