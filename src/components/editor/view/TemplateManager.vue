<template>
    <v-card id="card">
        <v-data-table
                class="table-outer"
                :headers="headers"
                :items="entries"
                no-results-text="No saved templates"
                disable-initial-sort
        >
            <template slot="items" slot-scope="props">
                <td class="text-xs-center table-tile">
                    <v-edit-dialog
                        lazy
                        @open="oldTemplateName = props.item.name"
                        @save="renameTemplate({
                            oldName: oldTemplateName,
                            newName: newTemplateName
                        })"
                    >
                        {{ props.item.name }}
                        <template v-slot:input>
                            <v-text-field
                                    v-model="props.item.name"
                                    :rules="[max25chars]"
                                    label="Edit"
                                    single-line
                                    counter
                                    @change="newTemplateName = props.item.name"
                            ></v-text-field>
                        </template>
                    </v-edit-dialog>
                </td>
                <td class="text-xs-center table-tile">{{props.item.glyphNames}}</td>
                <td class="text-xs-center table-tile">{{props.item.timestamp}}</td>
                <td class="text-xs-center table-tile">
                    <v-btn flat icon @click="deleteTemplate(props.item.name)">
                        <v-icon>delete</v-icon>
                    </v-btn>
                </td>
            </template>
        </v-data-table>
    </v-card>
</template>

<script>
    import {mapActions, mapState} from 'vuex'

    const headers = [
        {text: 'Template Name', value: 'name'},
        {text: 'Glyphs', value: 'glyphNames'},
        {text: 'Date Created', value: 'timestamp'},
    ]

    export default {
        name: "TemplateManager",
        data () {
            return {
                headers: headers,
                templates: [],
                max25chars: v => v.length <= 25 || 'Input too long!',
                oldTemplateName: '',
                newTemplateName: ''
            }
        },
        computed: {
            ...mapState({
                'availableTemplates': state => state.template.availableTemplates
            }),
            entries () {
                const entries = []
                for (const template of this.availableTemplates) {
                    entries.push({
                        ...template,
                        glyphNames: template.glyphNames.join(', ')
                    })
                }
                return entries
            }
        },
        methods: {
            ...mapActions({
                renameTemplate: 'template/renameTemplate',
                deleteTemplate: 'template/deleteTemplate'
            })
        }
    }
</script>

<style scoped>
    #card{
        width: 70%;
        margin: auto;
        z-index: 4
    }

    .table-outer{
        height: 80%;
    }
</style>