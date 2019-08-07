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

  setGlyphBinderState: ({commit, dispatch}, payload) => {
    if (payload) {
      dispatch('glyph/setGlyphVisibility', {value: false}, {root: true})
      commit('setGlyphAdderState', false) // commit and not dispatch, as some of the logic in adder's action conflicts with logic here
    } else {
      setTimeout(dispatch, 200, 'glyph/setGlyphVisibility', {value: true}, {root: true})
    }
    commit('setGlyphBinderState', payload)
  },

  setGlyphAdderState: ({commit, dispatch}, payload) => {
    if (payload) {
      dispatch('glyph/setGlyphVisibility', {value: false}, {root: true})
      commit('setGlyphBinderState', false)
      dispatch('setGlyphArrangement', 'editor') // swap to editor arrangement of glyphs
      dispatch('glyph/makeTempLayer', null, {root: true}) // create a new temporary layer for GlyphAdder
    } else {
      dispatch('setGlyphArrangement', 'grid')
      setTimeout(dispatch, 500, 'glyph/setGlyphVisibility', {value: true}, {root: true})
      dispatch('glyph/removeTempLayer', null, {root: true}) // create a new temporary layer for GlyphAdder
    }
    commit('setGlyphAdderState', payload)
  },

  setShapeCanvasState: ({commit}, payload) => commit('setShapeCanvasState', payload),

  setWelcomeCardState: ({commit}, payload) => commit('setWelcomeCardState', payload),

  dismissSnackbar: ({commit}) => commit('dismissSnackbar'),

  activateSnackbar: ({commit}, payload) => commit('activateSnackbar', payload),

  setGlyphArrangement: ({commit, dispatch}, glyphArrangement) => {
    commit('setGlyphArrangement', glyphArrangement)
    dispatch('updateGlyphArrangement') // whenever the glyph arrangement is changed, a new configuration is computed
  },

  updateGlyphArrangement: debounce(({commit}) => commit('updateGlyphArrangement'), 200),

  setEditorBox: ({commit}, editorBox) => commit('setEditorBox', editorBox),

  setBoundingRectSizeFactor: ({commit}, sizeFactor) => commit('setBoundingRectSizeFactor', sizeFactor)
}
