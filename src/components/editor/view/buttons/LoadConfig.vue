<template lang="html">
<upload-btn uniqueId title="UploadConfig" large
            color="light" icon @file-update="loadConfig">
    <!--https://www.npmjs.com/package/vuetify-upload-button-->
    <template slot="icon">
      <v-icon color="deep-purple">attach_file</v-icon>
    </template>
  </upload-btn>
</template>
<!-- should display message when overing over, but not working -->

<script>
import { mapActions } from 'vuex'
// @click.native="readDataFile"
import UploadButton from 'vuetify-upload-button'

export default {
  name: 'LoadConfig',
  components: {
    'upload-btn': UploadButton
  },
  methods: {
    ...mapActions({
      readBindingsFile: 'backend/readBindingsFile'
    }),
    async loadConfig (file) {
      await this.readBindingsFile(file)
      this.$emit('configLoaded')
    }
  }
}
</script>

<style lang='css'>
</style>
