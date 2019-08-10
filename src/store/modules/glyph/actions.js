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

  addDataBoundGlyphs: ({rootState, commit}, glyphTypeName) => {
    commit('addDataBoundGlyphs', {
      glyphTypeName: glyphTypeName,
      parsedData: rootState.backend.parsedData,
      namingField: rootState.backend.namingField
    })
  },

  makeEmptyGlyphs: ({rootState, commit, dispatch}, payload) => {
    if (rootState.app.numDisplayedGlyphs === 0) {
      dispatch('app/changeDisplayedGlyphNum', 1, {root: true})
      dispatch('app/updateGlyphArrangement', null, {root: true})
    }
    payload.boundingRects = rootState.app.boundingRects
    commit('makeEmptyGlyphs', payload)
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

  changeGlyphPosition: ({commit}, payload) => commit('changeGlyphPosition', payload),

  activateRedrawing: ({commit}) => {
    // function used to signal to canvas that glyphs need redrawing
    commit('setRedrawing', true)
    setTimeout(function () { commit('setRedrawing', false) }, 300)
  },

  redrawElement: ({rootState, commit}, newBinding) => {
    const orderedData = [...rootState.backend.normalizedData]
    orderedData.sort((dp0, dp1) => {
      if (rootState.backend.fieldTypes[rootState.backend.namingField] === Number) {
        return dp0[rootState.backend.namingField] - dp1[rootState.backend.namingField]
      } else {
        return dp0[rootState.backend.namingField].localeCompare(dp1[rootState.backend.namingField])
      }
    })
    commit('redrawElement', {
      binding: newBinding,
      normalizedData: orderedData
    })
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

  setBoundingRectSizeFactor: ({commit}, sizeFactor) => commit('setBoundingRectSizeFactor', sizeFactor),

  setShapeJSON: ({commit}, shapeJSON) => commit('setShapeJSON', shapeJSON)

}
