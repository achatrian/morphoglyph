// This module does light computation on and stores the backend state

// Import sub files
import actions from './actions'
import mutations from './mutations'
import getters from './getters'

const state = {
    fileName: '',
    parsedData: [],
    dataFields: [],
    fieldTypes: [],
    normalizedData: [],
    featuresRanges: {},
    namingField: '_default',
    loadedBindingData: {date: '', fileName: '', glyphType: '', namingField: '', bindings: []},
    dataDisplayOrder: [],
    orderField: 'file entries',
    availableTemplates: [], // stores templates found in /data dir TODO integrate
    chartPointPositions: [],
    chart: null,
    shapeJSON: '',
    shapeJSONStore: new Map(),
    varShapeAssignment: []
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
