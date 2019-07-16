<template lang="html">
  <!--Need to give uniqueId prop to button or it cannot be reused in other components-->
  <upload-btn uniqueId :title="title"
              color="light" icon @file-update="readDataFile">
    <!--https://www.npmjs.com/package/vuetify-upload-button-->
    <template slot="icon">
      <v-icon color="deep-purple">file_upload</v-icon>
    </template>
  </upload-btn>
</template>
<!-- should display message when hovering over, but not working -->

<script>
import { mapActions } from 'vuex'
// @click.native="readDataFile"
import UploadButton from 'vuetify-upload-button'

export default {
  name: 'LoadData',
  components: {
    'upload-btn': UploadButton
  },
  props: {
    uniqueId: String,
    default: function () { return '' }
  },
  methods: {
    ...mapActions({
      readDataFile: 'backend/readDataFile'
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
