import axios from 'axios'


export default {
    updateCurrentTemplate: ({rootState, commit}) => {
        commit('updateGlyphInformation', rootState.glyph.project.glyphs)
        commit('updateElementFeatureBindings', rootState.glyph.project.bindings)
        commit('updateShapes', rootState.backend.shapeJSONStore)
        commit('updateShapeAssignment', rootState.backend.varShapeAssignment)
    },

    saveCurrentTemplate: ({dispatch, state}) => {
        dispatch('updateCurrentTemplate')
        console.log(`Saving template ${state.templateName}`)
        const postUrl = location.origin + '/save'
        axios.post(postUrl, {
            templateName: state.templateName,
            template: state.currentTemplate
        })
    }
}