import actions from './actions'
import mutations from './mutations'
import getters from './getters'

const state = {
  toolbar: true,
  toolsDrawer: true,
  studioDrawer: false,
  footer: true,
  snackbar: {
    active: false,
    text: 'this is a notification',
    color: 'info',
    timeout: 4000
  },
  glyphBinder: false,
  canvas: true,
  welcomeCard: true,
  dockedView: false,
  // view props
  maxDisplayedGlyphs: 20,
  numDisplayedGlyphs: 0,
  boundingRectSizeFactor: 1.0,
  boundingRects: [],
  numPages: 0,
  currentPage: 1
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
