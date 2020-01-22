// Using Vuex paradigm to build a central store of application state.
import Vue from 'vue'
import Vuex from 'vuex'

// Import the Vuex logic that has been modularized and separated into different
// files.
import app from './modules/app/index'
import backend from './modules/backend'
import glyph from './modules/glyph'
import template from './modules/template'

Vue.use(Vuex)

// Must add modules below
export default new Vuex.Store({
  strict: true, // cannot change state outside mutations
  modules: {
    app,
    backend,
    glyph,
    template
  }
})
