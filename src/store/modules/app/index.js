import actions from './actions'
import mutations from './mutations'
import getters from './getters'

const state = {
  // UI view status
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
  shapeManager: false,
  glyphAdder: false,
  canvas: true,
  shapeCanvas: false,
  welcomeCard: true,
  chartController: true,
  legendViewer: false,
  // view props
  maxDisplayedGlyphs: 20,
  numDisplayedGlyphs: 0,
  boundingRectSizeFactor: 1.0,
  boundingRects: [],
  glyphArrangement: 'grid', // determines how glyphs are arranged spatially on the canvas
  numPages: 0,
  currentPage: 1,
  editorBox: {id: '', boundingRect: {top: 0, left: 0, width: 0, height: 0}},
  // charts
  axesPoints: null,
  chart: false,
  chartXField: '',
  chartYField: '',
  chartPoints: []
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
