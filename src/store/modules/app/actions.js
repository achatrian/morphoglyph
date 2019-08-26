import './mutations'
import {debounce} from 'debounce'

export default {
  changeDisplayedGlyphNum: ({commit, rootState}, numDisplayedGlyphs) => commit(
      'changeDisplayedGlyphNum',
      {
        numDisplayedGlyphs: numDisplayedGlyphs,
        glyphs: rootState.glyph.project.glyphs
      }
    ),

  changeCurrentPage: ({commit}, page) => commit('changeCurrentPage', page),

  setBoundingRects: ({commit}, boundingRects) => commit('setBoundingRects', boundingRects),

  toolbarOff: ({commit}) => commit('toolbarOff'),

  toolbarOn: ({commit}) => commit('toolbarOn'),

  toggleToolsDrawer: ({commit}) => commit('toggleToolsDrawer'),

  setToolsDrawerState: ({commit}, payload) => commit('setToolsDrawerState', payload),

  toggleStudioDrawer: ({commit}) => commit('toggleStudioDrawer'),

  setStudioDrawerState: ({commit}, payload) => commit('setStudioDrawerState', payload),

  removeWindows: ({commit}) => { // function to kill any open window in main view
    commit('setGlyphBinderState', false)
    commit('setShapeManagerState', false)
    commit('setWelcomeCardState', false)
    commit('setLegendViewerState', false)
    // more window togglers go here
  },

  setGlyphBinderState: ({commit, dispatch}, payload) => {
    if (payload) {
      dispatch('glyph/setGlyphVisibility', {value: false}, {root: true})
      dispatch('removeWindows')
    } else {
      setTimeout(dispatch, 200, 'glyph/setGlyphVisibility', {value: true}, {root: true})
    }
    commit('setGlyphBinderState', payload)
  },

  setShapeManagerState: ({commit, dispatch}, payload) => {
    if (payload) {
      dispatch('glyph/setGlyphVisibility', {value: false}, {root: true})
      dispatch('removeWindows')
      dispatch('glyph/makeTempLayer', null, {root: true}) // create a new temporary layer for ShapeManager
    } else {
      setTimeout(dispatch, 500, 'glyph/setGlyphVisibility', {value: true}, {root: true})
      dispatch('glyph/removeTempLayer', null, {root: true}) // create a new temporary layer for ShapeManager
    }
    commit('setShapeManagerState', payload)
  },

  setLegendViewer: ({commit, dispatch}, payload) => {
    if (payload) {
      dispatch('glyph/setGlyphVisibility', {value: false}, {root: true})
      dispatch('removeWindows')
    } else {
      setTimeout(dispatch, 200, 'glyph/setGlyphVisibility', {value: true}, {root: true})
    }
    commit('setLegendViewerState', payload)
  },

  setShapeCanvasState: ({commit}, payload) => commit('setShapeCanvasState', payload),

  setWelcomeCardState: ({commit}, payload) => commit('setWelcomeCardState', payload),

  setChartControllerState: ({commit}, payload) => commit('setChartControllerState', payload),

  dismissSnackbar: ({commit}) => commit('dismissSnackbar'),

  activateSnackbar: ({commit}, payload) => commit('activateSnackbar', payload),

  setGlyphArrangement: ({commit, dispatch}, glyphArrangement) => {
    commit('setGlyphArrangement', glyphArrangement)
    dispatch('updateGlyphArrangement') // whenever the glyph arrangement is changed, a new configuration is computed
  },

  updateGlyphArrangement: debounce(({commit}) => commit('updateGlyphArrangement'), 200),

  setEditorBox: ({commit}, editorBox) => commit('setEditorBox', editorBox),

  setBoundingRectSizeFactor: ({commit}, sizeFactor) => commit('setBoundingRectSizeFactor', sizeFactor),

  // drawChart: ({rootState, state: app, dispatch, commit}, payload) => {
  //   if (window.chart) {
  //     dispatch('destroyChart')
  //   }
  //   const backend = rootState.backend
  //   // order data ...
  //   const orderedData = [...backend.normalizedData]
  //   payload.orderedData = orderedData.sort((dataPoint0, dataPoint1) =>
  //       backend.dataDisplayOrder.indexOf(dataPoint0[backend.orderField]) -
  //       backend.dataDisplayOrder.indexOf(dataPoint1[backend.orderField])
  //   )
  //   // remove undisplayed data points (this allows user to plot less points)
  //   // if no glyphs are displayed, chart is plotted without glyphs
  //   if (app.numDisplayedGlyphs !== 0) {
  //     orderedData.splice(app.numDisplayedGlyphs, orderedData.length - app.numDisplayedGlyphs)
  //   }
  //   commit('drawChart', payload)
  //   commit('setGlyphArrangement', 'chart')
  //   commit('updateGlyphArrangement')
  // },

  setChartState: ({commit}, payload) => commit('setChartState', payload),

  drawChart: ({rootState, state, dispatch, commit}, payload = { // defaults are for redrawing chart on resize of canvas component
    xField: state.chartXField,
    yField: state.chartYField
  }) => {
    dispatch('destroyChart')
    commit('setChartState', true)
    commit('drawAxes') // must happen before setChartPoints
    payload.backend = rootState.backend
    commit('setChartPoints', payload)
    commit('setGlyphArrangement', 'chart')
    commit('updateGlyphArrangement')
    // need all glyphs to be in chart position before they're downscaled
    setTimeout(() => dispatch('glyph/addShrinkRegrowAnimation', null, {root: true}), 1000)
  },

  destroyChart: ({commit}) => {
    commit('setChartState', false)
    commit('destroyAxes')
  },

  setChartPoints: ({commit}, chartMetaData) => commit('setChartPoints', chartMetaData)
}
