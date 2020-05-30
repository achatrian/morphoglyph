import axios from 'axios'

// Wrap Promise around FileReader
const readUploadedFileAsText = (inputFile) => {
  const temporaryFileReader = new FileReader()
  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort()
      reject(new DOMException('Problem parsing input file.'))
    }
    temporaryFileReader.onload = () => {
      resolve(temporaryFileReader.result)
    }
    temporaryFileReader.readAsText(inputFile)
  })
}

export default {
  readDataFile: async ({state, dispatch, commit}, file) => {
    console.log(file)
    if (!(file instanceof File)) {
      throw new TypeError(`Input is of type ${typeof File} (expected type: File)`)
    }
    try {
      const data = await readUploadedFileAsText(file)
      commit('updateData', data)
      commit('updateFileName', file.name) // actions can commit multiple mutations
      commit('app/changeDisplayedGlyphMax', state.parsedData.length, {root: true}) // change glyph display max
      // process new data
    } catch (e) {
      dispatch('app/activateSnackbar', {
        text: 'Reading of data file failed (possible wrong format)',
        color: 'error',
        timeout: 3000
      }, {root: true})
    }
    dispatch('normalizeFeatures')
  },

  readBindingsFile: async ({dispatch, commit}, file) => {
    console.log(file)
    if (!(file instanceof File)) {
      throw new TypeError(`Input is of type ${typeof file} (expected type: File)`)
    }
    try {
      const data = await readUploadedFileAsText(file)
      commit('storeBindings', data)
    } catch (e) {
      dispatch('app/activateSnackbar', {
        text: 'Reading of bindings file failed (possible wrong format)',
        color: 'error',
        timeout: 3000
      }, {root: true})
    }
  },

  normalizeFeatures: ({commit, rootState}) => commit('normalizeFeatures', {
    bindings: rootState.glyph.project.bindings,
    glyphElements: rootState.glyph.glyphElements
  }),

  setNamingField: ({commit}, namingField) => commit('setNamingField', namingField),

  orderDataByValue: ({state, dispatch, commit}, orderField) => { // reorder, apply to glyphs, and redraw
    commit('orderDataByValue', orderField)
    dispatch('glyph/reassignGlyphIds', state.dataDisplayOrder, {root: true})
    dispatch('glyph/activateRedrawing', {}, {root: true})
  },

  // glyph shapes data
  setShapeJSON: ({commit}, shapeJSON) => commit('setShapeJSON', shapeJSON),

  storeShapeJSON: ({commit, dispatch, state}, payload) => {
    if (state.shapeJSONStore.has(payload.name)) {
      dispatch('app/activateSnackbar', {
        text: `Shape ${payload.name} already exists - please choose another name or delete existing shape`,
        color: 'error'
      }, {root: true})
    } else {
      commit('storeShapeJSON', payload)
    }
  },

  assignGlyphToShape: ({commit}, payload) => commit('assignGlyphToShape', payload),

  removeShapeJSON: ({commit}, name) => commit('removeShapeJSON', name),

  setVarShapeAssignment: ({commit}, varShapeAssignment) => commit('setVarShapeAssignment', varShapeAssignment),
}
