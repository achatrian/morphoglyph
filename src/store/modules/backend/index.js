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
  namingField: '',
  loadedBindingData: {date: '', fileName: '', glyphType: '', namingField: '', bindings: []},
  dataDisplayOrder: [],
  orderField: 'file entry order',
  availableTemplates: [] // stores templates found in /data dir TODO integrate
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
