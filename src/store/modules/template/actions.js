import axios from 'axios'
import path from 'path'


export default {
    updateTemplateName: ({commit}, templateName) => commit('updateTemplateName', templateName),

    updateOriginalFileName: ({commit}, originalFileName) => commit('updateOriginalFileName', originalFileName),

    updateCurrentTemplate: ({rootState, commit}) => {
        commit('updateOriginalFileName', rootState.backend.fileName)
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

    applyTemplate: ({dispatch, state}) => { // function that changes state according to information recorded in template
        // DEVELOPMENT HACK: if template is empty and name is that of test template, load test template
        if (Object.entries(state.currentTemplate).length === 0 // object is empty
            && state.currentTemplate.constructor === Object // object is object
            && state.templateName === 'test0'
            && Object.entries(state.testTemplate)
            && state.testTemplate.constructor === Object
        ) {
            dispatch('setCurrentTemplate', state.testTemplate)
        }
        // change app settings
        dispatch('glyph/setBindings', state.currentTemplate.elementFeatureBindings, {root: true})
        dispatch('app/changeDisplayedGlyphNum', state.currentTemplate.numDisplayedGlyphs, {root: true})
        dispatch('app/setBoundingRectSizeFactor', state.currentTemplate.boundingRectSizeFactor, {root: true})
        dispatch('app/changeCurrentPage', state.currentTemplate.currentPage, {root: true})
        dispatch('backend/setNamingField', state.currentTemplate.namingField, {root: true})
        dispatch('glyph/addDataBoundGlyphs', state.currentTemplate.topGlyph.type, {root: true})
        dispatch('backend/normalizeFeatures', null, {root: true})
        // apply glyph variables
        for (let [shapeName, parameters] of Object.entries(state.currentTemplate.glyphParameters)) {
            dispatch('glyph/setGlyphParameters', {
                shapeName: shapeName,
                parameters: parameters
            }, {root: true})
        }
        // dispatch('glyph/setGlyphBox', state.currentTemplate.glyphBoxes, {root: true})
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
    },

    setCurrentTemplate: ({commit}, newTemplate) => commit('setCurrentTemplate', newTemplate)
}