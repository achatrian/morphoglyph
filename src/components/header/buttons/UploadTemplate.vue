<template lang="html">
    <!--Need to give uniqueId prop to button or it cannot be reused in other components-->
    <v-tooltip
            id="tooltip"
            open-delay="700"
            bottom
    >
        <upload-btn uniqueId :title="title" slot="activator"
                    color="light" icon @file-update="readDataFile">
            <!--https://www.npmjs.com/package/vuetify-upload-button-->
            <template slot="icon">
                <v-icon color="deep-purple">file_upload</v-icon>
            </template>
        </upload-btn>
        <span>Load data file</span>
    </v-tooltip>
</template>
<!-- should display message when hovering over, but not working -->

<script>
    import { mapActions } from 'vuex'
    import UploadButton from 'vuetify-upload-button'

    export default {
        name: 'UploadTemplate',
        components: {
            'upload-btn': UploadButton
        },
        props: {
            uniqueId: String,
            default: function () { return '' }
        },
        methods: {
            ...mapActions({
                readDataFile: 'template/uploadTemplate'
            })
        },
        computed: {
            title () {
                return this.uniqueId || 'UploadData'
            }
        }
    }
</script>

<style lang='css'>
</style>