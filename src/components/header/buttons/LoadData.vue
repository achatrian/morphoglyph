<template lang="html">
  <!--Need to give uniqueId prop to button or it cannot be reused in other components-->
<!--  <v-tooltip-->
<!--          id="tooltip"-->
<!--          open-delay="700"-->
<!--          bottom-->
<!--  >-->
<!--    <upload-btn uniqueId :title="title" slot="activator"-->
<!--                color="light" icon @file-update="readDataFile">-->
<!--      &lt;!&ndash;https://www.npmjs.com/package/vuetify-upload-button&ndash;&gt;-->
<!--      <template slot="icon">-->
<!--        <v-icon color="deep-purple">file_upload</v-icon>-->
<!--      </template>-->
<!--    </upload-btn>-->
<!--      <span>Load data file</span>-->
<!--  </v-tooltip>-->
    <file-pond
            name="input-file"
            class="pond"
            ref="pond"
            label-idle="Drop files here..."
            :allow-multiple="false"
            @addfile="readFile"
            />
</template>
<!-- should display message when hovering over, but not working -->

<script>
import { mapActions } from 'vuex'
// @click.native="readDataFile"
// import UploadButton from 'vuetify-upload-button'
import vueFilePond from 'vue-filepond'
import 'filepond/dist/filepond.min.css';

const FilePond = vueFilePond();


export default {
  name: 'LoadData',
  components: {
    // 'upload-btn': UploadButton,
    'file-pond': FilePond
  },
  methods: {
    ...mapActions({
      readDataFile: 'backend/readDataFile'
    }),
      readFile () {
        this.readDataFile(this.$refs.pond.getFile().file)
      }
  }
}
</script>

<style>
    .filepond--panel-root {
        background-color: #D1C4E9;
        border: 2px solid #673AB7;
    }
</style>
