import actions from './actions'
import mutations from './mutations'
import getters from './getters'

const state = {
    templateName: 'test',
    currentTemplate: {}
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}