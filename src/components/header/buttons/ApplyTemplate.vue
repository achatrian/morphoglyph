<template>
    <v-tooltip
            id="tooltip"
            open-delay="700"
            bottom
    >
        <v-btn icon slot="activator" @click="applyTemplate" :disabled="!templateExists">
            <v-icon color="primary">replay</v-icon>
        </v-btn>
        <span>Load settings and glyphs from selected template</span>
    </v-tooltip>
</template>

<script>
    import {mapActions, mapState} from 'vuex'

    export default {
        name: "ApplyTemplate",
        props: {
            templateName: String
        },
        methods: {
            ...mapActions({
                applyTemplate: 'template/applyTemplate'
            })
        },
        computed: {
            ...mapState({
                availableTemplates: state => state.template.availableTemplates
            }),
            templateExists () {
                if (this.availableTemplates.length > 0) {
                    return Boolean(this.availableTemplates.find(templateItem => templateItem.name.slice(0, -5) === this.templateName))
                } else {
                    return false
                }
            }
        }
    }
</script>

<style scoped>

</style>