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
      throw new TypeError(`Input is of type ${typeof File} (expected type: File)`)
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

  normalizeFeatures: ({commit}, coNormalizeGroups) => commit('normalizeFeatures', coNormalizeGroups),

  setNamingField: ({commit}, namingField) => commit('setNamingField', namingField),

  orderDataByValue: ({state, dispatch, commit}, orderField) => { // reorder, apply to glyphs, and redraw
    commit('orderDataByValue', orderField)
    dispatch('glyph/reassignGlyphIds', state.dataDisplayOrder, {root: true})
    dispatch('glyph/activateRedrawing', {}, {root: true})
  },

  async getArrayOfTemplates ({commit}) {
    try {
      await axios.post(location.origin + '/checkForTemplates')
      const pathToArrayOfTemplatesFile = location.origin + '/data/templates.json'
      const arrayOfTemplatesFile = await axios.get(pathToArrayOfTemplatesFile)
      commit('setAvailableTemplates', arrayOfTemplatesFile.data)
    } catch (err) {
      console.log(err)
    }
  },

  async saveAnnotation ({ // TODO adapt and use!
    dispatch,
    rootState
  }) {
    try {
      // Ensure all the paperJS items are included in the vuex state
      // await dispatch('annotation/refreshAnnotationState', null, { root: true })

      // Post API request.
      const postUrl = location.origin + '/save'
      await axios.post(
        postUrl,
        {
          projectImageName: rootState.image.projectImageName,
          annotationData: rootState.annotation.project
        }
      )

      // Activate notification
      // dispatch('app/activateSnackbar', {
      //   text: 'Saved annotation data',
      //   color: 'success'
      // }, { root: true })

      // Handle errors
    } catch (err) {
      console.log(err)
      dispatch('app/activateSnackbar', {
        text: 'Annotation data could not be saved',
        color: 'error'
      }, { root: true })
    }
  }
}
