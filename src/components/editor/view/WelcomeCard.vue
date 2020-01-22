// INTRO CARD, temporary ?
<template>
  <v-card class="light elevation-5">
    <v-layout v-if="!(!!fileName)" id="welcome-message">
      <v-card-text class="deep-purple--text font-weight-black">
        Upload a data file</v-card-text>
      <app-load-data unique-id="welcomeUpload"/>
    </v-layout>
    <v-layout v-else>
      <v-card-text class="deep-purple--text font-weight-black">
        Now add some glyphs !
      </v-card-text>
      <app-bind color="grey"/>
    </v-layout>
    <v-layout v-if="!!fileName">
      <v-card-text class="deep-purple--text font-weight-black">
        Or load a previous configuration file
      </v-card-text>
      <app-load-config @configLoaded="notifyLoad"/>
    </v-layout>
  </v-card>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import LoadData from '../../header/buttons/LoadData'
import Bind from '../tools/Bind'
import LoadConfig from './buttons/LoadConfig'

export default {
  name: 'WelcomeCard',
  components: {
    'app-load-data': LoadData,
    'app-bind': Bind,
    'app-load-config': LoadConfig
  },
  computed: {
    ...mapState({
      welcomeCard: state => state.app.welcomeCard,
      glyphBinder: state => state.app.glyphBinder,
      shapeManager: state => state.app.shapeManager,
      numDisplayedGlyphs: state => state.app.numDisplayedGlyphs,
      fileName: state => state.backend.fileName
    })
  },
  methods: {
    ...mapActions({
      setWelcomeCardState: 'app/setWelcomeCardState'
    }),
    notifyLoad () { // send event so that glyphs can be loaded without using Bind Options
      this.$emit('configLoaded')
      this.setWelcomeCardState(false) // dismiss card after loading is complete
    }
  },
  watch: {
    numDisplayedGlyphs () {
      if (this.numDisplayedGlyphs === 0) {
        this.setWelcomeCardState(true)
      } else if (this.welcomeCard) {
        this.setWelcomeCardState(false) // don't dispatch if unneeded
      }
    },
    // this component will be removed and is shown only at beginning so toggling logic is kept here
    glyphBinder () {
      if (this.glyphBinder) {
        this.setWelcomeCardState(false)
      }
    },
    shapeManager () {
      if (this.shapeManager) {
        this.setWelcomeCardState(false)
      }
    }
  }
}
</script>

<style scoped>

</style>
