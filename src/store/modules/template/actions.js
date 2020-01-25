import axios from 'axios'
import path from 'path'


export default {
    updateTemplateName: ({commit}, templateName) => commit('updateTemplateName', templateName),

    updateCurrentTemplate: ({rootState, commit}) => {
        commit('updateGlyphInformation', rootState.glyph.project.glyphs)
        commit('updateElementFeatureBindings', rootState.glyph.project.bindings)
        commit('updateShapes', rootState.backend.shapeJSONStore)
        commit('updateShapeAssignment', rootState.backend.varShapeAssignment)
        commit('updateDisplayOptions', {
            displayOrderField: rootState.backend.orderField,
            numDisplayedGlyphs: rootState.app.numDisplayedGlyphs,
            boundingRectSizeFactor: rootState.app.boundingRectSizeFactor,
            currentPage: rootState.app.currentPage
        })
    },

    saveCurrentTemplate: ({dispatch, state}) => {
        dispatch('updateCurrentTemplate')
        console.log(`Saving template ${state.templateName}`)
        const postUrl = location.origin + '/save'
        axios.post(postUrl, {
            templateName: state.templateName,
            template: state.currentTemplate
        })
    },

    async getArrayOfTemplates({commit}) {
        try {
            await axios.post(location.origin + '/checkForTemplates')
            const pathToTemplatesFile = location.origin + '/templates.json'
            const templatesFile = await axios.get(pathToTemplatesFile)
            commit('setAvailableTemplates', templatesFile.data)  // TODO check if request.data is what's expected
            console.log(templatesFile.data)
        } catch (err) {
            console.log(err)
        }
    },

    async getTemplate ({state}, templateName) {
        const dataLocation = path.join('/templates', templateName + '.json')
        console.log(dataLocation)
        try {
            const response = await axios.get(dataLocation)
            console.log(response.data)
            state.currentTemplate = response.data
        } catch (err) {
            console.log(err)
            console.log('Template data either could not be found or could not be loaded')
        }
    }
}