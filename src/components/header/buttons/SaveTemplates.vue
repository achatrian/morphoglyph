<template>
    <v-tooltip
            id="tooltip"
            open-delay="700"
            bottom
    >
        <v-btn icon slot="activator"
               @click="saveCurrentTemplateWithNameCheck"
               :disabled="!Boolean(fileName) || !Boolean(templateName)">
            <v-icon color="primary">save</v-icon>
        </v-btn>
        <span>Save current glyphs configuration</span>
    </v-tooltip>
</template>

<script>
    import {mapActions, mapState} from 'vuex'

    export default {
        name: "SaveTemplates",
        computed: {...mapState({
                fileName: state => state.backend.fileName,
            templateName: state => state.template.templateName,
        })},
        methods: {
            ...mapActions({
                saveCurrentTemplate: 'template/saveCurrentTemplate',
                activateSnackbar: 'app/activateSnackbar'
            }),
            saveCurrentTemplateWithNameCheck () {
                if (!this.templateName) {
                    this.activateSnackbar({
                        text: 'Enter project name to save progress',
                        color: 'info',
                        timeout: 2000
                    })
                } else {
                    this.saveCurrentTemplate()
                    this.activateSnackbar({
                        text: `Saved current template '${this.templateName}'`,
                        color: 'success',
                        timeout: 2000
                    })
                }
            }
        }
    }
</script>

<style scoped>

</style>