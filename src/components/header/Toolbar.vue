<template lang="html">
   <!--app property allows to keep toolbar fixed -->
  <v-toolbar
    fixed
    app
    dense
    clipped-right
    clipped-left
    class="light"
  >
    <div id="toolbar-toggle">
      <v-toolbar-side-icon left @click="onToolsClick">
        <v-icon color="deep-purple">menu</v-icon>
      </v-toolbar-side-icon>
    </div>
    <v-toolbar-title router to='/'
                     class="deep-purple--text font-weight-black"
                     id="toolbar-title">
      PheW
    </v-toolbar-title>
    <app-load-data/>
    <div id="file-name">
      <span style="">{{fileName}}</span>
    </div>
    <!--because of flex, elements must be at either end or beginning, or they will change position if something is inserted on the right (e.g. the file name)-->
    <v-spacer/>
    <div id="project-name">
      <v-combobox :placeholder="Boolean(fileName) ? 'Project Name' : 'No data'"
                  :items="templatesNames"
                  v-model="currentTemplateName"
                  @change="updateTemplateName_"
                  @keydown="updateTemplateName_"
                  @select="updateTemplateName_"
                  :disabled="!Boolean(fileName)"
      />
      <!-- TODO keydown event above not available with vuetify 1.5 -- need to update vuetify -->
    </div>
    <app-apply-template :templateName="this.currentTemplateName"/>
    <app-save-templates/>
    <app-save-as-svg/>
    <app-box-toggler/>
    <app-zoomer/>
    <!--<v-divider vertical/>-->
    <app-view-manager/>
    <v-toolbar-side-icon @click="onStudioClick">
      <v-icon color="deep-purple">menu</v-icon>
    </v-toolbar-side-icon>
  </v-toolbar>
</template>

<script>
import {mapState, mapActions} from 'vuex'

//import Settings from './settings/Settings'
import LoadData from './buttons/LoadData'
import ViewManager from './buttons/ViewManager'
import Zoomer from './buttons/Zoomer'
import BoxToggler from './buttons/BoxToggler'
import SaveTemplates from "./buttons/SaveTemplates"
import ApplyTemplate from "./buttons/ApplyTemplate"
import SaveAsSVG from "./buttons/SaveAsSVG";

export default {
  name: 'Toolbar',
  components: {
    //'app-settings': Settings,
    'app-load-data': LoadData, // TODO v-file-input not working in toolbar at time of writing? Wait until it is released in stable version?
    'app-view-manager': ViewManager,
    'app-zoomer': Zoomer,
    'app-box-toggler': BoxToggler,
    'app-save-templates': SaveTemplates,
    'app-apply-template': ApplyTemplate,
    'app-save-as-svg': SaveAsSVG
  },
  data () {
    return {currentTemplateName: ''}
  },
  computed: {
    ...mapState({
      fileName: state => state.backend.fileName,
      numDisplayedGlyphs: state => state.glyph.numDisplayedGlyphs,
      templateName: state => state.template.templateName,
      availableTemplates: state => state.template.availableTemplates
    }),
    templatesNames () {
      return this.availableTemplates.map(templateItem => templateItem.name)
    }
  },
  methods: {
    ...mapActions({
      toggleToolsDrawer: 'app/toggleToolsDrawer',
      toggleStudioDrawer: 'app/toggleStudioDrawer',
      updateTemplateName: 'template/updateTemplateName'
      //loadFeaturesFile: 'backend/loadFeaturesFile',
    }),
    onToolsClick () {
      this.toggleToolsDrawer()
    },
    onStudioClick () {
      this.toggleStudioDrawer()
    },
    updateTemplateName_ (updateEvent) {
      // handles different types of event that trigger a template name update (select, input, ...)
      let templateName
      if (updateEvent.target) {
        templateName = updateEvent.target.value
      } else if (typeof updateEvent === 'string' && updateEvent.length > 0) {
        templateName = updateEvent
      }
      console.log(`Changing template name from ${this.templateName} to ${templateName}`)
      this.updateTemplateName(templateName)
    }
    // updateTemplateName_: debounce.call(this, function (updateEvent) {
    //   if (updateEvent.target) {
    //     const templateName = updateEvent.target.value
    //     console.log(`Changing template name from ${this.templateName} to ${templateName}`)
    //     this.updateTemplateName(templateName)
    //   }
    // }, 100)
  },
  watch: {
    currentTemplateName () {
      this.updateTemplateName_(this.currentTemplateName)
    }
  }
}
</script>
<!-- TODO use deep selector to change all icons to purple -->
<style lang='css' scoped>
  #toolbar-side-icon-spacer {
    height: 36px;
    width: 36px;
  }

  #file-name {
    background-color: #FAFAFA;
    color: #673AB7;
    display: inline-block
  }

  #toolbar-title {
    margin-left: -10px
  }

  #toolbar-toggle {
    margin-left: -30px;
    margin-right: 40px;
  }

  #project-name {
    max-width: 150px
  }
</style>
