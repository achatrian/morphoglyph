export default {
  setLayersUp: ({rootState, commit}) => commit('setLayersUp', rootState.app.maxDisplayedGlyphs),

  makeTempLayer: ({commit}) => commit('makeTempLayer'),

  removeTempLayer: ({commit}) => commit('removeTempLayer'),

  resetLayers: ({rootState, commit}) => {
    commit('resetProject')
    commit('setLayersUp', rootState.app.maxDisplayedGlyphs)
  },
  setGlyphType: ({commit}, payload) => commit('setGlyphType', payload),

  setBindings: ({commit}, bindings) => commit('setBindings', bindings),

  addGlyphs: ({rootState, commit}, glyphTypeName) => {
    commit('addGlyphs', {
      glyphTypeName: glyphTypeName,
      parsedData: rootState.backend.parsedData,
      namingField: rootState.backend.namingField
    })
  },
  shiftLayersAssignment: ({commit}, payload) => commit('shiftLayersAssignment', payload),

  reassignGlyphIds: ({rootState, commit}) => commit('reassignGlyphIds', rootState.backend.dataDisplayOrder),

  reassignGlyphLayer: ({commit}, payload) => commit('reassignGlyphLayer', payload),

  drawGlyph: ({rootState, commit}, payload) => {
    // find dataPoint in backend
    payload.glyphId = rootState.backend.dataDisplayOrder[payload.glyphIndex]
    payload.dataPoint = rootState.backend.normalizedData.find(
        dataPoint => dataPoint[rootState.backend.namingField] === payload.glyphId
    ) // data point corresponding to cluster in given dock
    commit('drawGlyph', payload)
  },

  moveGlyph: ({rootState, commit}, payload) => {
    payload.glyphId = rootState.backend.dataDisplayOrder[payload.glyphIndex]
    commit('moveGlyph', payload)
  },

  activateRedrawing: ({commit}) => {
    // function used to signal to canvas that glyphs need redrawing
    commit('setRedrawing', true)
    setTimeout(function () { commit('setRedrawing', false) }, 300)
  },

  setGlyphVisibility: ({commit}, payload) => commit('setGlyphVisibility', payload),

  resetGlyph: ({commit}, glyphIndex) => commit('resetGlyph', glyphIndex),

  discardGlyphs: ({commit}) => commit('discardGlyphs'),

  addCaption: ({rootState, commit}, payload) => {
    payload.caption = rootState.backend.dataDisplayOrder[payload.glyphIndex] // set caption
    commit('addCaption', payload)
  },

  setGlyphParameters: ({commit, dispatch}, payload) => {
    commit('setGlyphParameters', payload)
    if (payload.redraw) {
      dispatch('activateRedrawing') // redraw glyphs after having changed the parameter value
    }
  },

  setPathParameter: ({commit}, payload) => commit('setPathParameter', payload),

  setShapePosition: ({commit}, payload) => commit('setShapePosition', payload),

  selectGlyphEl: ({commit}, payload) => commit('selectGlyphEl', payload),

  setBoundingRectSizeFactor: ({commit}, sizeFactor) => commit('setBoundingRectSizeFactor', sizeFactor)

}
