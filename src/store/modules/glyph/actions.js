function findInArrayOfObjects (key, array, keyName = 'id') {
  let i = 0
  for (let element of array) {
    if (typeof element[keyName] === 'undefined') {
      throw Error(`Element #${i}'s ${keyName} attribute is undefined`)
    } else if (element[keyName] === key) {
      return element
    }
    i++
  }
  throw Error(`Could not find element with ${keyName} '${key}'`)
}

export default {
  setLayersUp: ({rootState, commit}) => commit('setLayersUp', rootState.app.maxDisplayedGlyphs),

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
  reassignLayers: ({commit}, payload) => commit('reassignLayers', payload),

  removeGlyphs: ({commit}) => commit('removeGlyphs'),

  reassignGlyphIds: ({rootState, commit}) => commit('reassignGlyphIds', rootState.backend.dataDisplayOrder),

  drawGlyph: ({rootState, commit}, payload) => {
    // find dataPoint in backend
    payload.glyphId = rootState.backend.dataDisplayOrder[payload.glyphIndex]
    payload.dataPoint = findInArrayOfObjects(
      payload.glyphId,
      rootState.backend.normalizedData,
      rootState.backend.namingField
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

  toggleGlyph: ({commit}, payload) => commit('toggleGlyph', payload),

  hideGlyphs: ({commit}) => commit('hideGlyphs'),

  resetGlyph: ({commit}, glyphIndex) => commit('resetGlyph', glyphIndex),

  addCaption: ({rootState, commit}, payload) => {
    payload.caption = rootState.backend.dataDisplayOrder[payload.glyphIndex] // set caption
    commit('addCaption', payload)
  },

  setPathParameter: ({commit}, payload) => commit('setPathParameter', payload),

  setShapePosition: ({commit}, payload) => commit('setShapePosition', payload),

  selectGlyphEl: ({commit}, payload) => commit('selectGlyphEl', payload),

  setBoundingRectSizeFactor: ({commit}, sizeFactor) => commit('setBoundingRectSizeFactor', sizeFactor)

}
