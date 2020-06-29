import axios from 'axios'
import path from 'path'
import db from './firebaseInit'


export default {
    updateTemplateName: ({commit}, templateName) => commit('updateTemplateName', templateName),

    setCurrentTemplate: ({commit}, newTemplate) => commit('setCurrentTemplate', newTemplate),

    updateOriginalFileName: ({commit}, originalFileName) => commit('updateOriginalFileName', originalFileName),

    updateNamingField: ({commit}, namingField) => commit('updateNamingField', namingField),

    updateCurrentTemplate: ({rootState, commit}) => {
        commit('updateOriginalFileName', rootState.backend.fileName)
        commit('updateNamingField', rootState.backend.namingField)
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
        try {
            db.collection('templates').doc(state.templateName).set({
                ...state.currentTemplate,
                timestamp: new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                })
            }).then(
                function () {console.log(`Saved template ${state.templateName}`)}
            )
        } catch (err) {
            try {
                const postUrl = location.origin + '/save'
                axios.post(postUrl, {
                    templateName: state.templateName,
                    template: state.currentTemplate
                })
            } catch (err1) {
                console.log(err)
                console.log(err1)
                console.log("Could not save template to firebase")
            }
        }
        dispatch('getArrayOfTemplates') // repopulate list of available templates with new entry
    },

    async applyTemplate({dispatch, state}) { // function that changes state according to information recorded in template
        // DEVELOPMENT HACK: if template is empty and name is that of test template, load test template
        if (Object.entries(state.currentTemplate).length === 0 // object is empty
            && state.currentTemplate.constructor === Object // object is object
            && state.templateName === '_test0'
            && Object.entries(state.testTemplate)
            && state.testTemplate.constructor === Object
        ) {
            dispatch('setCurrentTemplate', state.testTemplate)
        }
        dispatch('getTemplate', state.templateName).then(() => {
            // get template from database into state
            // change app settings
            dispatch('app/changeDisplayedGlyphNum', state.currentTemplate.numDisplayedGlyphs, {root: true})
            dispatch('app/setBoundingRectSizeFactor', state.currentTemplate.boundingRectSizeFactor, {root: true})
            dispatch('app/changeCurrentPage', state.currentTemplate.currentPage, {root: true})
            dispatch('backend/setNamingField', state.currentTemplate.namingField, {root: true})
            dispatch('glyph/setBindings', state.currentTemplate.elementFeatureBindings, {root: true})
            for (let [name, shape] of Object.entries(state.currentTemplate.shapes)) {
                dispatch('backend/storeShapeJSON', {
                    name: name,
                    shapeJSON: shape.json,
                    type: shape.type,
                    glyph: shape.glyph,
                }, {root: true})
            }
            dispatch('glyph/addDataBoundGlyphs', {
                    glyphTypeName: state.currentTemplate.topGlyph.type,
                    glyphName: state.currentTemplate.topGlyph.name
            }, {root: true})
            for (const childGlyph of state.currentTemplate.topGlyph.children) {
                dispatch('glyph/makeEmptyGlyphs', {
                    glyphName: childGlyph.name,
                    glyphTypeName: childGlyph.type
                }, {root: true})
            }
            dispatch('backend/normalizeFeatures', null, {root: true})
            // apply glyph variables
            for (let [glyphName, parameters] of Object.entries(state.currentTemplate.glyphParameters)) {
                dispatch('glyph/setGlyphParameters', {
                    glyphName: glyphName,
                    parameters: parameters
                }, {root: true})
            }
        })
    },

    async getArrayOfTemplates({commit}) {
        try {
            db.collection('templates').get().then(
                snapShot => {
                    console.log(snapShot)
                    const availableTemplates = snapShot.docs.map(doc => {
                        const data = doc.data()
                        return {
                           name: data.name,
                           id: doc.id,
                           timestamp: data.timestamp || '00/00/00 00:00:00',
                           glyphNames:  [data.topGlyph.name, ...data.topGlyph.children.map(child => child.name)]
                        }
                    })
                    console.log(`Available templates: ${availableTemplates.map(templateItem => templateItem.name)}`)
                    commit('setAvailableTemplates', availableTemplates)
                }
            )
        } catch (err) {
            try {
                await axios.post(location.origin + '/checkForTemplates')
                const pathToTemplatesFile = location.origin + '/templates.json'
                const templatesFile = await axios.get(pathToTemplatesFile)
                commit('setAvailableTemplates', templatesFile.data)  // TODO check if request.data is what's expected
                console.log(templatesFile.data)
            } catch (err1) {
                console.log(err)
                console.log(err1)
            }
        }
    },

    async getTemplate ({commit}, templateName) { // whenever a template is required, the latest version is always downloaded from the server
        if (!templateName) {
            throw Error("Empty template name was given")
        }
        try { // use firebase
            const querySnapshot = await db.collection('templates').where('name', '==', templateName).get()
            console.log(querySnapshot.docs)
            console.log(querySnapshot.docs[0].data())
            commit('setCurrentTemplate', querySnapshot.docs[0].data())
        } catch (err) {
            const dataLocation = path.join('/templates', templateName + '.json')
            console.log(dataLocation)
            try {
                const response = await axios.get(dataLocation)
                console.log(response.data)
                commit('setCurrentTemplate', response.data)
            } catch (err1) {
                console.log(err)
                console.log(err1)
                console.log('Template data either could not be found or could not be loaded')
            }
        }
    },

    async deleteTemplate ({dispatch}, templateName) {
        await db.collection('templates').doc(templateName).delete()
        console.log(`Deleted template '${templateName}'`)
        dispatch('getArrayOfTemplates')
    },

    async renameTemplate ({dispatch, state}, {oldName, newName}) {
        await dispatch('getTemplate', oldName)
        await dispatch('updateTemplateName', newName)
        db.collection('templates').doc(state.templateName).set({
            ...state.currentTemplate,
            timestamp: new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
            }),
            name: state.templateName
        }).then(
            function () { console.log(`Renamed template '${oldName}' to '${newName}'`)}
        )
        await dispatch('deleteTemplate', oldName)
    }
}