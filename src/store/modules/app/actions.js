import './mutations'
import {debounce} from 'debounce'

let debouncedUpdateGrid

export default {
  changeDisplayedGlyphNum: ({commit, rootState}, numDisplayedGlyphs) => commit('changeDisplayedGlyphNum',
    {numDisplayedGlyphs: numDisplayedGlyphs, glyphs: rootState.glyph.project.glyphs}),

  changeCurrentPage: ({commit}, page) => commit('changeCurrentPage', page),

  setBoundingRects: ({commit}, boundingRects) => commit('setBoundingRects', boundingRects),

  toolbarOff: ({commit}) => commit('toolbarOff'),

  toolbarOn: ({commit}) => commit('toolbarOn'),

  toggleToolsDrawer: ({commit}) => commit('toggleToolsDrawer'),

  setToolsDrawerState: ({commit}, payload) => commit('setToolsDrawerState', payload),

  toggleStudioDrawer: ({commit}) => commit('toggleStudioDrawer'),

  setStudioDrawerState: ({commit}, payload) => commit('setStudioDrawerState', payload),

  setGlyphBinderState: ({commit}, payload) => commit('setGlyphBinderState', payload),

  setWelcomeCardState: ({commit}, payload) => commit('setWelcomeCardState', payload),

  dismissSnackbar: ({commit}) => commit('dismissSnackbar'),

  activateSnackbar: ({commit}, payload) => commit('activateSnackbar', payload),

  updateGrid: ({commit}, payload) => {
    if (typeof debouncedUpdateGrid === 'undefined') {
      debouncedUpdateGrid = debounce(function () { commit('updateGrid', payload) }, 200)
    }
    debouncedUpdateGrid()
  },

  setBoundingRectSizeFactor: ({commit}, sizeFactor) => commit('setBoundingRectSizeFactor', sizeFactor)
}
