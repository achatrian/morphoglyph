const parse = require('csv-parse/lib/sync') // synchronous version of package

export default {
  updateData: (state, data) => {
    // Read in csv file
    if (data == null || typeof data === 'undefined') {
      throw new RangeError('Unexpected file content')
    }
    // Process csv file
    let parsedData = parse(data, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    })
    if (parsedData.length === 0) {
      console.log('Parsing failed to acquire any data')
    } else {
      console.log("Data:", parsedData)
    }
    state.parsedData = parsedData
  },

  updateFileName: (state, name) => {
    state.fileName = name
  },

  normalizeFeatures: (state, coNormalizeGroups = [], normIntervalLength = 0.7) => {
    /* Compute normalized features used to plot glyphs
    First, find data fields and compute ranges of features, then normalize using field ranges.
    coNormalizeGroups: [ [ fieldName1, fieldName2 ], [ fieldName5, fieldName7 ], ... ]
    normIntervalLength: smallest spatial structure is 10*(1 - normIntervalLength) times smaller than biggest structure
    * */
    // update feature info
    if (normIntervalLength < 0.0 || normIntervalLength > 1.0) {
      throw Error(`Normalization scaling length must be within [0, 1] (value = ${normIntervalLength})`)
    }
    state.dataFields = Object.keys(state.parsedData[0]) // assuming all data points have same fields
    let fieldTypes = {}
    let numericData = []
    if (state.parsedData.length > 0) {
      for (let dataPoint of state.parsedData) {
        let numericPoint = Object.assign({}, dataPoint)
        for (let field of state.dataFields) {
          let value = dataPoint[field]
          if (typeof +value === 'number' && !isNaN(value)) {
            // numeric string test: String conversion to Number returns a NaN if string is not numeric
            numericPoint[field] = +value // if numeric string convert to number
            fieldTypes[field] = Number
          } else {
            numericPoint[field] = value // keep the cluster name in order to sort / choose points
            fieldTypes[field] = String
          }
        }
        numericData.push(numericPoint)
      }
      state.fieldTypes = fieldTypes
      let featuresRanges = {}
      state.dataFields.forEach(name => {
        featuresRanges[name] = [1.0, 0.0]
      })
      for (let i = 0; i < numericData.length; i++) {
        for (let field of state.dataFields) {
          if (numericData[i][field] < featuresRanges[field][0]) {
            featuresRanges[field][0] = numericData[i][field] // update with new minimum (for -ve numbers in range)
          }
          if (numericData[i][field] > featuresRanges[field][1]) {
            featuresRanges[field][1] = numericData[i][field] // update with new maximum
          }
        }
      }
      // if any features are to be conormalized, the union of their intervals is taken
      for (let coNormalizeGroup of coNormalizeGroups) {
        let groupMin = 1.0
        let groupMax = 0.0
        for (let field of coNormalizeGroup) {
          if (featuresRanges[field][0] < groupMin) {
            groupMin = featuresRanges[field][0]
          }
          if (featuresRanges[field][1] > groupMax) {
            groupMax = featuresRanges[field][1]
          }
        }
        for (let field of coNormalizeGroup) {
          featuresRanges[field] = [groupMin, groupMax]
        }
      }
      state.featuresRanges = featuresRanges
      // normalize
      let normalizedData = []
      for (let i = 0; i < numericData.length; i++) {
        let normalizedPoint = {}
        for (let field of state.dataFields) {
          let value = numericData[i][field]
          let rangeLength = state.featuresRanges[field][1] - state.featuresRanges[field][0]
          // numeric string test: String conversion to Number returns a NaN if string is not numeric
          if (typeof value === 'number') {
            normalizedPoint[field] = normIntervalLength*(numericData[i][field] - state.featuresRanges[field][0])/rangeLength + (1 - normIntervalLength)
          } else {
            normalizedPoint[field] = numericData[i][field]
          }
        }
        normalizedData.push(normalizedPoint)
      }
      state.normalizedData = normalizedData
    } else {
      throw new Error('Data has not been parsed yet - cannot normalize')
    }
  },

  setNamingField: (state, namingField) => {
    state.namingField = namingField // set field
    state.dataDisplayOrder = state.normalizedData.map(dataPoint => dataPoint[namingField])
  },

  orderDataByValue: (state, orderField) => {
    if (orderField === 'file entries') {
      state.dataDisplayOrder = state.normalizedData.map(dataPoint => dataPoint[state.namingField])
    } else {
      let indexedFieldValues = state.normalizedData.map((dataPoint, idx) => [dataPoint[orderField], idx])
      if (state.fieldTypes[orderField] === Number) {
        indexedFieldValues.sort((a, b) => a[0] - b[0]) // sort by numeric value
      } else {
        indexedFieldValues.sort() // sort by string order (alphabetical)
      }
      const readInOrder = state.normalizedData.map(dataPoint => dataPoint[state.namingField])
      state.dataDisplayOrder = indexedFieldValues.map(el => readInOrder[el[1]])
      state.orderField = orderField
    }
  },

  storeBindings: (state, data) => {
    const bindingData = JSON.parse(data)
    if (!(typeof bindingData.fileName === 'string') || !(Array.isArray(bindingData.bindings))) {
      console.log("Bindings file has wrong format")
    } else {
      console.log("Bindings", bindingData)
      state.loadedBindingData = bindingData
    }
  },

  setAvailableTemplates (state, availableTemplates) {
    state.availableTemplates = availableTemplates
  }
}
