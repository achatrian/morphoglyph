export default {
  setLayersUp: ({rootState, commit}) => commit('setLayersUp', rootState.app.maxDisplayedGlyphs),

  makeTempLayer: ({commit}) => commit('makeTempLayer'),

  removeTempLayer: ({commit}) => commit('removeTempLayer'),

  resetLayers: ({rootState, commit}) => {
    commit('resetProject')
    commit('setLayersUp', rootState.app.maxDisplayedGlyphs)
  },
  setGlyphType: ({commit}, payload) => commit('setGlyphType', payload),

  chooseGlyphSetting: ({commit}, glyphSetting) => commit('chooseGlyphSetting', glyphSetting),

  setBindings: ({commit}, bindings) => commit('setBindings', bindings),

  updateGlyphNames: ({commit}) => commit('updateGlyphNames'),

  addDataBoundGlyphs: ({rootState, commit, dispatch}, {glyphName, glyphTypeName}) => {
    dispatch('setGlyphType', {
      glyphTypeName: glyphTypeName,
    })
    commit('addDataBoundGlyphs', {
      glyphName: glyphName,
      parsedData: rootState.backend.parsedData,
      namingField: rootState.backend.namingField
    })
    dispatch('updateGlyphNames')
  },

  makeEmptyGlyphs: ({rootState, commit, dispatch}, payload) => {
    // {glyphName, glyphTypeName, createOptions}
    if (rootState.app.numDisplayedGlyphs === 0) {
      dispatch('app/changeDisplayedGlyphNum', 1, {root: true})
      dispatch('app/updateGlyphArrangement', null, {root: true})
    }
    const {glyphTypeName} = payload
    dispatch('setGlyphType', {
      glyphTypeName: glyphTypeName,
    })
    payload.boundingRects = rootState.app.boundingRects
    commit('makeEmptyGlyphs', payload)
    dispatch('updateGlyphNames')
  },

  shiftLayersAssignment: ({commit}, payload) => commit('shiftLayersAssignment', payload),

  reassignGlyphIds: ({rootState, commit}) => commit('reassignGlyphIds', rootState.backend.dataDisplayOrder),

  reassignGlyphLayer: ({commit}, payload) => commit('reassignGlyphLayer', payload),

  drawGlyph: ({rootState, commit}, payload) => {
    const glyphId = rootState.backend.dataDisplayOrder[payload.glyphIndex]
    let dataPoint
    if (rootState.backend.namingField === '_default') {
      dataPoint = rootState.backend.normalizedData[glyphId] // where glyphId is a number
    } else {
      dataPoint = rootState.backend.normalizedData.find(
          dataPoint_ => dataPoint_[rootState.backend.namingField] === glyphId
      ) // data point corresponding to cluster in given dock,
    }
    Object.assign(payload, {
      glyphId: glyphId,
      // find dataPoint in backend
      dataPoint: dataPoint,
      varShapeAssignment: rootState.backend.varShapeAssignment,
      shapeJSONStore: rootState.backend.shapeJSONStore,
      glyphBoxes: rootState.template.currentTemplate.glyphBoxes ?
          rootState.template.currentTemplate.glyphBoxes : []
    })
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

  deleteElement: ({commit}, binding) => commit('deleteElement', binding),

  redrawElement: ({rootState, commit}, newBinding) => {
    const orderedData = [...rootState.backend.normalizedData]
    if (rootState.backend.namingField !== '_default') {
      orderedData.sort((dp0, dp1) => {
        if (rootState.backend.fieldTypes[rootState.backend.namingField] === Number) {
          return dp0[rootState.backend.namingField] - dp1[rootState.backend.namingField]
        } else {
          return dp0[rootState.backend.namingField].localeCompare(dp1[rootState.backend.namingField])
        }
      })
    }
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
    // payload = {parameters, shapeName}
    commit('setGlyphParameters', payload)
    if (payload.redraw) {
      dispatch('activateRedrawing') // redraw glyphs after having changed the parameter value
    }
  },

  setPathParameter: ({commit}, payload) => commit('setPathParameter', payload),

  setShapePosition: ({commit}, payload) => commit('setShapePosition', payload),

  setGlyphBox: ({commit, dispatch}, glyphBoxes) => {
    commit('setGlyphBox', glyphBoxes)
    dispatch('activateRedrawing')
  },

  selectGlyphEl: ({commit}, payload) => commit('selectGlyphEl', payload),

  setBoundingRectSizeFactor: ({commit}, sizeFactor) => commit('setBoundingRectSizeFactor', sizeFactor),

  addShrinkRegrowAnimation: ({commit}) => commit('addShrinkRegrowAnimation'),

  removeShrinkRegrowAnimation: ({commit}) => commit('removeShrinkRegrowAnimation'),

  // exporting glyphs as an image
  saveAsSVG: ({commit, rootState}) => commit('saveAsSVG', rootState.template.templateName)
}
