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

  deleteBinding: ({commit}, binding) => commit('deleteBinding', binding),

  updateGlyphNames: ({commit}) => commit('updateGlyphNames'),

  addDataBoundGlyphs: ({rootState, commit, dispatch}, {glyphName, glyphTypeName}) => {
    const needRedrawing = rootState.glyph.project.glyphs.length > 0
    dispatch('setGlyphType', {
      glyphTypeName: glyphTypeName,
    })
    commit('addDataBoundGlyphs', {
      glyphName: glyphName,
      parsedData: rootState.backend.parsedData,
      namingField: rootState.backend.namingField
    })
    dispatch('updateGlyphNames')
    if (needRedrawing) {
      dispatch('activateRedrawing')
    }
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
    dispatch('activateRedrawing')
  },

  shiftLayersAssignment: ({commit}, payload) => commit('shiftLayersAssignment', payload),

  reassignGlyphIds: ({rootState, commit}) => commit('reassignGlyphIds', rootState.backend.dataDisplayOrder),

  reassignGlyphLayer: ({commit}, payload) => commit('reassignGlyphLayer', payload),

  renameGlyphs: ({commit, dispatch}, payload) => {
    commit('renameGlyphs', payload)
    dispatch('updateGlyphNames')
  },

  drawGlyph: ({rootState, commit}, payload) => {
    const glyphId = rootState.backend.dataDisplayOrder[payload.glyphIndex]
    let dataPoint
    if (rootState.backend.namingField === '_default') {
      dataPoint = rootState.backend.normalizedData[glyphId] // where glyphId is a number
    } else {
      dataPoint = rootState.backend.normalizedData.find(
          dataPoint_ => dataPoint_[rootState.backend.namingField] === glyphId
      ) // data point corresponding to cluster in given dock
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

  deleteGlyph: ({commit, dispatch}, payload) => {
    commit('deleteGlyph', payload)
    dispatch('updateGlyphNames')
  },

  activateRedrawing: ({commit}) => {
    // function used to signal to canvas that glyphs need redrawing
    commit('setRedrawing', true)
    setTimeout(function () { commit('setRedrawing', false) }, 300)
  },

  deleteElement: ({state, commit, dispatch}, binding) => {
    const targetGlyph = [...state.project.glyphs[0].iter()].find(glyph => glyph.name === binding.name)
    const element = targetGlyph.constructor.elements.find(el => el.name === binding.element)
    commit('deleteElement', binding)
    if (element.type === 'color') {
      dispatch('setGlyphColor', {
        glyphName: binding.name,
        fillColor: targetGlyph.parameters.originalFillColor,
        strokeColor: targetGlyph.parameters.originalStrokeColor
      })
    }
  },

  removeElements: ({state, dispatch}) => {
    dispatch('app/setProgressCircleState', true, {root: true})
    for (const binding of state.project.bindings) {
      dispatch('deleteElement', binding)
    }
    setTimeout(dispatch, 100, 'app/setProgressCircleState', false, {root: true})
  },

  changeGlyphPosition: ({commit, dispatch, state}, payload) => {
    dispatch('app/setProgressCircleState', true, {root: true})
    const resizing = payload.steps.some(step => step.transform === 'resize')
    if (resizing) {
      dispatch('removeElements')
    }
    commit('changeGlyphPosition', payload)
    if (resizing) {
      for (const binding of state.project.bindings) {
        dispatch('redrawElement', binding)
      }
    }
    setTimeout(dispatch, 100, 'app/setProgressCircleState', false, {root: true})
  },

  redrawElement: ({rootState, state, commit, dispatch}, newBinding) => {
    dispatch('app/setProgressCircleState', true, {root: true})
    const bindings = state.project.bindings.filter(
        binding => !(binding.element === newBinding.element && binding.shape === newBinding.shape)
    )
    bindings.push(newBinding)
    commit('setBindings', bindings)
    // if newBinding is for a scale type element, features must be re-co-normalized
    const scaleBindings = state.project.bindings.filter(binding => {
      const element = state.glyphElements.find(element => element.name === binding.element)
      return element && element.type === 'scale'
    })
    if (scaleBindings.length > 1 && scaleBindings.some(binding => Object.is(binding, newBinding))) { // renormalize data so that all scales have the same unit
      dispatch('backend/normalizeFeatures', null, {root: true})
    }
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
    if (scaleBindings.length > 1 && scaleBindings.some(binding => Object.is(binding, newBinding))) {
      for (const binding of scaleBindings) {
        commit('redrawElement', {
          binding: binding,
          normalizedData: orderedData
        })
      }
    } else {
      commit('redrawElement', {
        binding: newBinding,
        normalizedData: orderedData
      })
    }
    setTimeout(dispatch, 100, 'app/setProgressCircleState', false, {root: true})
  },

  setGlyphVisibility: ({commit}, payload) => commit('setGlyphVisibility', payload),

  resetGlyph: ({commit}, payload) => commit('resetGlyph', payload),

  discardGlyphs: ({commit}) => commit('discardGlyphs'),

  addCaption: ({rootState, commit}, payload) => {
    payload.caption = rootState.backend.dataDisplayOrder[payload.glyphIndex] // set caption
    commit('addCaption', payload)
  },

  setGlyphParameters: ({commit}, payload) => {
    // payload = {parameters, glyphName}
    commit('setGlyphParameters', payload)
    // if (payload.redraw) {
    //   dispatch('activateRedrawing') // redraw glyphs after having changed the parameter value
    // }
  },

  setPathParameter: ({commit}, payload) => commit('setPathParameter', payload),

  setShapePosition: ({commit}, payload) => commit('setShapePosition', payload),

  setGlyphColor: ({commit}, payload) => commit('setGlyphColor', payload),

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
