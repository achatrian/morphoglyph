<template>
    <v-list-tile id="tool-tile">
        <v-tooltip
                id="tooltip"
                right
                open-delay="700"
        >
            <v-btn
                    id="tool"
                    slot="activator"
                    flat
                    block
                    @click="setChartControllerState(true)">
                <v-icon light :color="color">insert_chart</v-icon>
            </v-btn>
            <span> Activate chart drawing controls </span>
        </v-tooltip>
    </v-list-tile>
</template>

<script>
    import {mapActions} from 'vuex'

    export default {
        name: 'Chart',
        props: {
            color: {type: String, default: 'white'}
        },
        methods: {
            ...mapActions({
                setChartControllerState: 'app/setChartControllerState'
            })
        }
    }
</script>

<style lang='css' scoped>
    #tooltip {
        width: 100%;
    }

    #tool {
        min-width: 0px;
    }

    #tool-tile {
        padding: 0px;
    }
</style>
