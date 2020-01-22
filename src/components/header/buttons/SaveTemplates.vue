<template>
    <v-tooltip
            id="tooltip"
            open-delay="700"
            bottom
    >
        <v-btn icon slot="activator" @click="saveCurrentTemplate">
            <v-icon color="primary">save</v-icon>
        </v-btn>
        <span>Save current glyphs configuration</span>
    </v-tooltip>
</template>

<script>
    import {mapActions} from 'vuex'

    export default {
        name: "SaveTemplates",
        methods: {
            ...mapActions({
                saveCurrentTemplate: 'template/saveCurrentTemplate'
            })
        }
    }
</script>

<style scoped>

</style>