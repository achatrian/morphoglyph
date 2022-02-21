const parse = require('csv-parse/lib/sync') // synchronous version of package


export default {
    updateData: (state, data) => {
    // Read in csv file
        if (data == null || typeof data === 'undefined') {
            throw new RangeError('Unexpected file content')
        }
        // Process csv file
        const parsedData = parse(data, {
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

    setParsedData: (state, parsedData) => state.parsedData = parsedData,

    updateFileName: (state, name) => {
        state.fileName = name
    },

    normalizeFeatures: (state, {bindings, glyphElements, normIntervalLength = 0.8}, ) => {
    /* Compute normalized features used to plot glyphs
    First, find data fields and compute ranges of features, then normalize using field ranges.
    coNormalizeGroups: [ [ fieldName1, fieldName2 ], [ fieldName5, fieldName7 ], ... ]
    normIntervalLength: smallest spatial structure is 10*(1 - normIntervalLength) times smaller than biggest structure
    * */
        // update feature info
        if (normIntervalLength < 0.0 || normIntervalLength > 1.0) {
            throw Error(`Normalization scaling length must be within [0, 1] (value = ${normIntervalLength})`)
        }
        const coNormalizeGroups = []
        const scaleNormalizeGroup = []
        for (const binding of bindings) {
            const element = glyphElements.find((element) => element.name === binding.element)
            if (element.type === 'scale') {
                scaleNormalizeGroup.push(binding.field) // scale together all the features corresponding to scale-type elements
            }
        }
        if (scaleNormalizeGroup.length > 0) {
            coNormalizeGroups.push(scaleNormalizeGroup)
        }
        state.dataFields = Object.keys(state.parsedData[0]) // assuming all data points have same fields
        const fieldTypes = {}
        const numericData = []
        if (state.parsedData.length > 0) {
            for (const dataPoint of state.parsedData) {
                const numericPoint = {...dataPoint}
                for (const field of state.dataFields) {
                    const value = dataPoint[field]
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
            const featuresRanges = {}
            state.dataFields.forEach((name) => {
                featuresRanges[name] = [1.0, 0.0]
            })
            for (let i = 0; i < numericData.length; i++) {
                for (const field of state.dataFields) {
                    if (numericData[i][field] < featuresRanges[field][0]) {
                        featuresRanges[field][0] = numericData[i][field] // update with new minimum (for -ve numbers in range)
                    }
                    if (numericData[i][field] > featuresRanges[field][1]) {
                        featuresRanges[field][1] = numericData[i][field] // update with new maximum
                    }
                }
            }
            // if any features are to be conormalized, the union of their intervals is taken
            for (const coNormalizeGroup of coNormalizeGroups) {
                let groupMin = 1.0
                let groupMax = 0.0
                for (const field of coNormalizeGroup) {
                    if (featuresRanges[field][0] < groupMin) {
                        groupMin = featuresRanges[field][0]
                    }
                    if (featuresRanges[field][1] > groupMax) {
                        groupMax = featuresRanges[field][1]
                    }
                }
                for (const field of coNormalizeGroup) {
                    featuresRanges[field] = [groupMin, groupMax]
                }
            }
            state.featuresRanges = featuresRanges
            // normalize
            const normalizedData = []
            for (let i = 0; i < numericData.length; i++) {
                const normalizedPoint = {}
                for (const field of state.dataFields) {
                    const value = numericData[i][field]
                    const rangeLength = state.featuresRanges[field][1] - state.featuresRanges[field][0]
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

        // index categorical variables:
        for (const field in state.fieldTypes) {
            const values = new Set(state.normalizedData.map((dataPoint) => dataPoint[field]))
            state.featuresRanges[field] = Array.from(values)
        }
    },

    setNamingField: (state, namingField) => {
        if (namingField) {
            state.namingField = namingField // set field
            state.dataDisplayOrder = state.parsedData.map((dataPoint) => dataPoint[namingField])
        } else {
            state.namingField = '_default'
            state.dataDisplayOrder = state.parsedData.map((dataPoint, index) => index)
        }
    },

    orderDataByValue: (state, orderField) => {
        if (orderField === 'file entries') {
            state.dataDisplayOrder = state.parsedData.map((dataPoint) => dataPoint[state.namingField])
        } else {
            const indexedFieldValues = state.parsedData.map((dataPoint, idx) => [dataPoint[orderField], idx])
            if (state.fieldTypes[orderField] === Number) {
                indexedFieldValues.sort((a, b) => a[0] - b[0]) // sort by numeric value
            } else {
                indexedFieldValues.sort() // sort by string order (alphabetical)
            }
            const readInOrder = state.parsedData.map((dataPoint) => dataPoint[state.namingField])
            state.dataDisplayOrder = indexedFieldValues.map((el) => readInOrder[el[1]])
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
    },

    // glyph shapes data
    setShapeJSON: (state, shapeJSON) => state.shapeJSON = shapeJSON, // save path in json format to move it across canvases

    storeShapeJSON: (state, {shapeJSON, type, name='', glyph=''}) => {
        if (!name) { // if name is empty, replace with number
            let i = 0
            while (state.shapeJSONStore.has(String(i))) {
                i++
            }
            name = String(i)
        }
        // NB bracket operator is not overloadable in JS, hence non-primitives (like Map) must use other methods
        const newStore = new Map(state.shapeJSONStore)
        newStore.set(name, {type: type, json: shapeJSON, glyph: glyph})
        state.shapeJSONStore = newStore // update object to trigger computed properties
    },

    removeShapeJSON: (state, name) => {
        const newStore = new Map(state.shapeJSONStore)
        newStore.delete(name)
        state.shapeJSONStore = newStore
        // remove all shape assignments to categorical values
        state.varShapeAssignment = state.varShapeAssignment.filter((assignment) => assignment.shape !== name)
    },

    assignGlyphToShape: (state, {shapeName, glyphName}) => {
        const newStore = new Map(state.shapeJSONStore)
        const shapeJSON = newStore.get(shapeName)
        shapeJSON.glyph = glyphName
        newStore.set(shapeName, shapeJSON)
        state.shapeJSONStore = newStore
    },

    setVarShapeAssignment: (state, varShapeAssignment) => state.varShapeAssignment = varShapeAssignment
}
