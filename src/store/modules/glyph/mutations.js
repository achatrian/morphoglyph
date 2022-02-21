// import Vue from 'vue'
import paper from 'paper'
import Vue from 'vue'
import DrawingBox from '../../../glyphs/DrawingBox'

function glyphScope() {
    for (let i = 0; i < 3; i++) {
        const scope = paper.PaperScope.get(i)
        if (scope.view.element.id === 'glyph-canvas') {
            return scope
        }
    }
    throw Error("No scope bound to element 'glyph-canvas'")
}

const checkRect = (boundingRect) => {
    if (
        typeof boundingRect.width === 'undefined' || typeof boundingRect.height === 'undefined' ||
      typeof boundingRect.left === 'undefined' || typeof boundingRect.top === 'undefined' ||
      typeof boundingRect.x === 'undefined' || typeof boundingRect.y === 'undefined'
    ) {
        throw Error("Drawing rectangle is missing one or more properties")
    }
    if (boundingRect.width !== boundingRect.height) {
        console.warn("Drawing rectangle has unequal dimensions")
    }
}

export default {
    setLayersUp: (state, maxDisplayedGlyphs) => {
        for (let i = 0; i < maxDisplayedGlyphs; i++) {
            const newPaperLayer = new paper.Layer({name: `glyph${i}`}) // automatically attached to project
            newPaperLayer.opacity = 1
        }
        state.activeLayer = 0
        paper.project.layers[state.activeLayer].activate()
    },

    makeTempLayer: (state) => {
        const scope = glyphScope()
        scope.activate()
        const tempLayer = new scope.Layer({name: 'temp'}) // using glyphScope().Layer breaks initialization
        state.activeLayer = 'temp'
        tempLayer.activate()
    },

    removeTempLayer: () => {
        const scope = glyphScope()
        scope.activate()
        const tempLayer = scope.project.layers.find((layer) => layer.name === 'temp')
        if (typeof tempLayer !== 'undefined') {
            tempLayer.remove()
        } else {
            console.warn('Attempted to remove non-existent temporary layer')
        }
    },

    setGlyphType: (state, {glyphTypeName, glyphSetting}) => {
        state.glyphTypeName = glyphTypeName
        const glyphClass = state.glyphTypes.find((glyphType) => glyphType.type.startsWith(state.glyphTypeName))
        if (typeof glyphClass === 'undefined') {
            throw Error(`Unknown glyph type: ${glyphTypeName}`)
        }
        // update settings with those of currently selected class
        state.glyphSettings = glyphClass.settings
        // update shapes names those of currently selected class
        state.glyphShapes = glyphClass.shapes
        state.glyphShapes.all = [state.glyphShapes.main, ...state.glyphShapes.children]
        // update elements names with those from currently selected class
        state.glyphElements = [...glyphClass.elements]
        console.log(`Loaded settings and elements for glyph type: ${glyphClass.type}`)
        if (glyphSetting) {
            state.selectedGlyphSetting = glyphSetting
        } else if (!state.selectedGlyphSetting) {
            state.selectedGlyphSetting = state.glyphSettings.default
        }
    },

    chooseGlyphSetting: (state, glyphSetting) => {
        console.log(`Glyph shape is ${glyphSetting}`)
        const glyphClass = state.glyphTypes.find((glyphType) => glyphType.type.startsWith(state.glyphTypeName))
        if (typeof glyphClass === 'undefined') {
            throw Error(`Unknown glyph type: ${state.glyphTypeName}`)
        }
        // update settings with those of currently selected class
        state.glyphSettings = glyphClass.settings
        state.selectedGlyphSetting = glyphSetting
    },

    resetProject: (state) => {
        glyphScope().project.clear()
        Vue.set(state, 'project', {
            name: 'A MorphoGlyph project',
            glyphs: [],
            bindings: [],
            glyphNames: [],
            template: {}
        })
    },

    setBindings: (state, bindings) => {
        state.project.bindings = bindings
    },

    deleteBinding: (state, binding) => {
        state.project.bindings = state.project.bindings.filter(
            (binding_) => !(binding_.element === binding.element && binding_.name === binding.name)
        )
    },

    updateGlyphNames: (state) => {
        state.totalGlyphNum = state.project.glyphs.reduce((total, newGlyph) => total + [...newGlyph.iter()].length, 0)
        state.project.glyphNames = [...state.project.glyphs.reduce((names, newGlyph) => {
            for (const glyph of [...newGlyph.iter(true)]) {
                names.add(glyph.name)
            }
            return names
        }, new Set())]
        state.project.mainGlyphNames = [...state.project.glyphs.reduce((names, newGlyph) => {
            for (const glyph of [...newGlyph.iter(true)]) {
                if (glyph.shape === glyph.constructor.shapes.main) {
                    names.add(glyph.name)
                }
            }
            return names
        }, new Set())]
    },

    addDataBoundGlyphs: (state, {glyphName, parsedData, namingField}) => { // payload is added in action
        const glyphClass = state.glyphTypes.find((glyphType) => glyphType.type.startsWith(state.glyphTypeName))
        if (typeof glyphClass === 'undefined') {
            throw Error(`Unknown glyph type: ${state.glyphTypeName}`)
        }
        // eslint-disable-next-line new-cap
        state.glyphElements = glyphClass.elements // update glyph elements for feature binding
        // extract naming field from data-points and initialise glyphs in order of appearance in file
        // eslint-disable-next-line new-cap
        for (const [layerIndex, dataPoint] of parsedData.entries()) {
            const newGlyph = new glyphClass(
                layerIndex,
                namingField === '_default' ? layerIndex : dataPoint[namingField], // use layer number as id if no naming field was specified
                glyphName
            )
            if (state.project.glyphs.length === layerIndex) {
                state.project.glyphs.push(newGlyph)
            } else {
                state.project.glyphs[layerIndex].registerChild(newGlyph)
            }
        }
    },

    shiftLayersAssignment: (state, {startIndex, endIndex}) => { // used to change page
    // assume that glyphs have been reset
        let layerToAssign = 0
        state.project.glyphs = state.project.glyphs.map((glyph, idx) => {
            glyph.reset() // TODO should do this before calling function?
            if (idx >= startIndex && idx < endIndex) {
                glyph.layer = layerToAssign
                layerToAssign++
            } else {
                glyph.layer = null // no layer is assigned
            }
            return glyph
        })
    },

    // Whenever the data is shuffled, e.g. for re-ordeing by a numerical value, the glyph objects are not swapped.
    // Instead, each glyph is renamed with a different ID, corresponding to the matching id in the display order index
    reassignGlyphIds: (state, glyphIds) => state.project.glyphs.forEach((glyph, i) => {
        glyph.id = glyphIds[i]
    }),

    reassignGlyphLayer: (state, {glyphId, layerId}) => {
        const glyph = state.project.glyphs.find((glyph) => glyph.id === glyphId)
        glyph.changeLayer(layerId)
    },

    renameGlyphs: (state, {oldName, newName}) => {
        for (const glyph of state.project.glyphs) {
            for (const childGlyph of glyph.iter()) {
                if (childGlyph.name === oldName) {
                    childGlyph.name = newName
                }
            }
        }
    },

    drawGlyph: (state, {boundingRect, glyphId, dataPoint, varShapeAssignment, shapeJSONStore}) => {
    /* params {
          glyphIndex: Number
          boundingRect: {left: Number, top: Number, width: Number, height: Number}
    } */
        checkRect(boundingRect) // ensures correct rect format
        const topGlyph = state.project.glyphs.find((glyph) => glyph.id === glyphId)
        for (const glyph of topGlyph.iter()) { // draw all undrawn glyphs for the given glyphId
            if (glyph.drawn) {
                continue
            }
            console.log(`Drawing ${glyph.name} with id ${glyphId} (layer ${glyph.layer})`)
            state.activeLayer = glyph.layer // activate layer corresponding to glyph
            glyph.activateLayer()
            // Handle scaling of glyph
            const scaleOrders = []
            for (const binding of state.project.bindings) {
                if (binding.name === glyph.name) {
                    const glyphElement = state.glyphElements.find((element) => element.name === binding.element)
                    if (glyphElement.type !== 'scale' && !glyphElement.properties.requiresTransform) {
                        continue // skipping bindings that are not scales and do not require a transform
                    }
                    const scaleOrder = {
                        ...binding,
                        value: dataPoint[binding.field]
                    }
                    scaleOrders.push(scaleOrder)
                }
            }
            // pass custom shape according to categorical features
            const shapeJSONs = []
            for (const assignment of varShapeAssignment) {
                if (dataPoint[assignment.field] === assignment.categoricalValue) {
                    shapeJSONs.push(shapeJSONStore.get(assignment.shape).json)
                    // for glyphs that require named shapes (N.B not used yet)
                    shapeJSONs[assignment.shape] = shapeJSONStore.get(assignment.shape).json
                }
            }
            // otherwise pass global shape
            if (shapeJSONs.length === 0) {
                for (const {json, type, glyph: glyphName} of shapeJSONStore.values()) {
                    if (type === 'global' && glyphName === glyph.name) {
                        shapeJSONs.push(json)
                    }
                }
            }
            const drawOptions = {
                boundingRect: {...boundingRect},
                scaleOrders: scaleOrders,
                [state.glyphSettings.name]: state.selectedGlyphSetting,
                shapeJSONs: shapeJSONs, // used by glyphs to draw custom main paths
            }
            // Draw all glyph paths
            glyph.draw(drawOptions)
            // elements are drawn according to their priority value in decreasing order (the default is 0)
            // need to clone the binding array first as .sort() mutates its parent
            const orderedBindings = [...state.project.bindings].sort((binding) => {
                const element = state.glyphElements.find((element) => element.name === binding.element)
                if (element.properties.priority) {
                    return - element.properties.priority // negative sign needed as sorting order will be ascending
                } else {
                    return 0
                }
            })
            for (const binding of orderedBindings) {
                const targetGlyph = glyph.getChild(binding.shape, 'shape')
                const glyphElement = state.glyphElements.find((element) => element.name === binding.element)
                if (!(targetGlyph.name === binding.name && targetGlyph.shape === binding.shape)) {
                    continue // if binding is for other glyph
                }
                if (glyphElement.type === 'scale') {
                    // TODO remove scale orders and let scalings be drawn here?
                    // can do, but scalings would then need to be the first bindings (can use priority element property)
                    continue // skipping bindings to scale-type elements
                }
                try {
                    targetGlyph['draw' + binding.element](dataPoint[binding.field]) // get draw method for element and call it
                } catch (e) {
                    if (typeof targetGlyph['draw' + binding.element] === 'undefined') {
                        throw new Error(`Handler for element ${binding.element} not defined on glyph type ${targetGlyph.name}`)
                    } else {
                        throw e
                    }
                }
            }
            // Group all drawn paths to enable movements of individual shapes
            glyph.buildGroups()
        }
    },

    moveGlyph: (state, {boundingRect, glyphId}) => {
    // function to change drawing bounds of a glyph
    // Warning: this function's purpose isn't to change relative position of glyphs in the drawing box
        checkRect(boundingRect) // ensures correct rect format TODO disable if in production mode ?
        const glyph = state.project.glyphs.find((glyph) => glyph.id === glyphId)
        state.activeLayer = glyph.layer // activate layer corresponding to glyph
        glyph.activateLayer()
        glyph.updateDrawingBounds(boundingRect, true)
        setTimeout(glyph.fitToBox('layer'))
    },

    deleteGlyph: (state, glyphName) => { // TODO test
        if (state.project.glyphs[0].name === glyphName) {
            let newTopGlyph
            for (const [idx, topGlyph] of state.project.glyphs.entries()) {
                for (const [childIdx, childGlyph] of topGlyph.children.entries()) {
                    // find topGlyph substitute (i.e. child that is not a shape of topGlyph)
                    if (!topGlyph.constructor.shapes.children.includes(childGlyph.shape)) {
                        newTopGlyph = childGlyph
                        newTopGlyph.parent = null
                        newTopGlyph.registerItem(topGlyph.getItem('drawingBox'), 'drawingBox')
                        state.project.glyphs.splice(idx, 1, newTopGlyph)
                        topGlyph.children.splice(childIdx, 1)
                        break
                    }
                }
                if (newTopGlyph) {
                    topGlyph.reset({layer: false})
                    for (const childGlyph of topGlyph.children) {
                        newTopGlyph.registerChild(childGlyph)
                    }
                } else {
                    topGlyph.reset({layer: true}) // deletes captions as well
                }
            }
            state.project.glyphs = state.project.glyphs.filter((glyph) => glyph.drawn)
        } else {
            for (const topGlyph of state.project.glyphs) {
                topGlyph.deleteChild(glyphName)
            }
        }
    },

    changeGlyphPosition: (state, {steps, shapeSelector = '', children = false}) => {
        for (const glyph of state.project.glyphs) {
            let targetGlyph = glyph
            if (shapeSelector) {
                targetGlyph = [...glyph.iter()].find((glyph) => glyph.name === shapeSelector)
            }
            if (children) { // must use initial glyph position
                for (const childGlyph of targetGlyph.children) {
                    // make child steps relative to parent glyph
                    const childSteps = steps.map((step) => {
                        const childStep = JSON.parse(JSON.stringify(step)) // deep copy
                        if (childStep.transform === 'shift' && childStep.parameters[2].setValues) {
                            if (childStep.parameters[0] !== null) {
                                childStep.parameters[0] += childGlyph.box.shapePositions.leftShift -
                    targetGlyph.box.shapePositions.leftShift
                            }
                            if (childStep.parameters[1] !== null) {
                                childStep.parameters[1] += childGlyph.box.shapePositions.topShift -
                    targetGlyph.box.shapePositions.topShift
                            }
                        }
                        return childStep
                    })
                    childGlyph.box.applyTransforms(childSteps)
                }
            }
            targetGlyph.box.applyTransforms(steps)
            targetGlyph.fitToBox(children ? 'all' : 'glyph')
            // else: instead of fitting to box, redrawing is trigger in the action
        }
    },

    setRedrawing: (state, redrawing) => {
        state.redrawing = redrawing
    }, // used in activateRedrawing action

    deleteElement: (state, binding) => {
        for (const glyph of state.project.glyphs) {
            const targetGlyph = [...glyph.iter()].find((glyph) => glyph.name === binding.name)
            if (targetGlyph.drawn) {
                const element = targetGlyph.constructor.elements.find((el) => el.name === binding.element)
                targetGlyph.activateLayer()
                if (element.type === 'path' && targetGlyph.itemIds[binding.element.toLowerCase()]) {
                    targetGlyph.deleteItem(binding.element.toLowerCase()) // paths have same name of elements in lower-case
                } else if (element.type === 'scale') {
                    if (element.properties.direction === 'vertical') {
                        targetGlyph.box.resize(null, 1.0, {setValues: true})
                        targetGlyph.box.toCenter()
                        targetGlyph.fitToBox()
                    } else if (element.properties.direction === 'horizontal') {
                        targetGlyph.box.resize(1.0, null, {setValues: true})
                        targetGlyph.box.toCenter()
                        targetGlyph.fitToBox()
                    }
                }
            }
        }
    },

    redrawElement: (state, {binding, normalizedData}) => {
        for (const [i, glyph] of state.project.glyphs.entries()) {
            const targetGlyph = [...glyph.iter()].find((glyph) => glyph.name === binding.name)
            if (targetGlyph.drawn) {
                targetGlyph.activateLayer()
                if (targetGlyph.itemIds[binding.element.toLowerCase()]) {
                    targetGlyph.deleteItem(binding.element.toLowerCase()) // paths have same name of elements in lower-case
                }
                targetGlyph['draw' + binding.element](normalizedData[i][binding.field]) // FIXME must look for datapoint with correct id
                targetGlyph.buildGroups()
            }
        }
    },

    setGlyphVisibility: (state, {value, glyphSelector = 'all', shapeSelector = 'layer', itemSelector = 'group'}) => {
        let glyphsToChange = []
        if (glyphSelector === 'all') {
            glyphsToChange = state.project.glyphs
        } else {
            const selectedGlyph = state.project.glyphs.find((glyph) => glyph.id === glyphSelector)
            if (typeof selectedGlyph === 'undefined') {
                throw Error(`No glyphs were found to match selector '${glyphSelector}'`)
            }
            glyphsToChange.push(state.project.glyphs.find((glyph) => glyph.id === glyphSelector))
        }
        for (const glyph of glyphsToChange) {
            state.activeLayer = glyph.layer
            const layer = glyphScope().project.layers[state.activeLayer]
            layer.activate()
            if (shapeSelector === 'layer') {
                layer.visible = value
            } else {
                let targetGlyph
                if (glyph.name === shapeSelector || shapeSelector === 'main') {
                    targetGlyph = glyph
                } else {
                    targetGlyph = glyph.getChild(shapeSelector)
                }
                if (typeof targetGlyph === 'undefined') {
                    throw Error(`Could not find shape '${shapeSelector}'`)
                }
                if (itemSelector === 'group') {
                    targetGlyph.group.visible = value
                } else {
                    targetGlyph.getItem(itemSelector).visible = value
                }
            }
        }
    },

    resetGlyph: (state, {glyphIndex, box}) => state.project.glyphs[glyphIndex].reset({box}),

    discardGlyphs: (state) => {
        state.project.glyphs = []
    },

    // *** other drawings ***
    addCaption: (state, {glyphIndex, caption}) => { // boundingRect, }) => {
        const captionLength = 20 // used to centre caption slightly more, but it's a hack
        if (caption.length > captionLength) {
            caption = caption.slice(0, 16)
        } else {
            const padLength = (captionLength - caption.length)/2
            caption = caption.padStart(Math.floor(padLength) + caption.length, ' ') // deprecated in IE11!
            caption = caption.padEnd(captionLength, ' ')
        }
        state.activeLayer = glyphIndex
        const drawingBox = state.project.glyphs[glyphIndex].getItem('drawingBox')
        const {x, y, width, height} = drawingBox.bounds
        // eslint-disable-next-line no-unused-vars
        const scope = glyphScope()
        scope.activate()
        new scope.PointText({
            point: [
                x + width / 10, // starting point of text
                y + height * 1.15 // slightly below glyph
            ],
            content: caption,
            fillColor: 'gray',
            fontSize: 14
        })
    },

    // *** glyph property setter ***
    setGlyphParameters: (state, {parameters, glyphName}) => {
        let targetGlyph
        for (const glyph of state.project.glyphs) {
            if (glyph.name === glyphName) {
                targetGlyph = glyph
            } else {
                targetGlyph = glyph.getChild(glyphName)
            } // target is either main glyph or one of its children
            if (!targetGlyph) {
                throw new Error(`No glyph matching '${glyphName}'`)
            }
            for (const parameter of Object.keys(parameters)) {
                if (!targetGlyph.parameters.hasOwnProperty(parameter)) {
                    console.warn(`Attempted to change non-existent parameter ${parameter}`)
                }
            }
            Object.assign(targetGlyph.parameters, parameters)
        }
    },

    setGlyphColor: (state, {glyphName, fillColor, strokeColor}) => {
        for (const glyph of state.project.glyphs) {
            let targetGlyph
            if (glyph.name === glyphName) {
                targetGlyph = glyph
            } else {
                targetGlyph = glyph.getChild(glyphName)
            } // target is either main glyph or one of its children
            const mainPath = targetGlyph.mainPath
            if (fillColor) {
                mainPath.fillColor = fillColor
                targetGlyph.parameters.shapeColor = fillColor
                targetGlyph.parameters.originalFillColor = fillColor
            }
            if (strokeColor) {
                mainPath.strokeColor = strokeColor
                targetGlyph.parameters.strokeColor = strokeColor
                targetGlyph.parameters.originalStrokeColor = strokeColor
            }
        }
    },

    setPathParameter: (state, {parameter, value, glyphName, elementName}) => {
        let targetGlyph
        for (const glyph of state.project.glyphs) {
            if (glyph.drawn && glyph.name === glyphName) {
                targetGlyph = glyph
            } else {
                targetGlyph = glyph.getChild(glyphName)
            } // target is either main glyph or one of its children
            if (targetGlyph && targetGlyph.drawn) {
                const paths = targetGlyph.getNamedItems(true)
                paths[elementName.toLowerCase()][parameter] = value
                const propString = elementName.toLowerCase() + parameter[0].toUpperCase() + parameter.slice(1)
                targetGlyph.parameters[propString] = value // .parameters must not store objects --> assemble specific string
            }
        }
    },

    // FIXME unused !!!
    setGlyphBox: (state, {glyphBoxes, update = 'box'}) => { // one update for all glyphs
        if (glyphBoxes.length !== state.project.glyphs.length) {
            throw new Error("Passed box parameters do not match number of existing glyphs")
        }
        for (const glyph of state.project.glyphs) {
            const glyphBox = glyphBoxes.find((glyphBox) => glyphBox._id === glyph.id)
            if (!glyphBox) {
                throw new Error(`No glyph box matching name '${glyphBox._id}'. Boxes template might not match dataset`) // TODO apply this anyway ?
            }
            let targetGlyph
            for (const shapeName of Object.keys(glyphBox)) {
                if (shapeName === '_id') {
                    continue // key that stores id of glyph corresponding to box
                }
                if (glyph.name === shapeName) {
                    targetGlyph = glyph
                } else {
                    targetGlyph = glyph.getChild(shapeName)
                }
                if (update === 'box') {
                    targetGlyph.box = new DrawingBox(targetGlyph, {
                        boundingRect: glyphBox[shapeName].drawingBounds,
                        shapePositions: glyphBox[shapeName].shapePositions,
                        history: glyphBox[shapeName].history,
                        maxHistLength: glyphBox[shapeName].maxHistLength,
                        applyHistoryTransforms: false // save history but do not apply transforms on box creation. Use box info instead
                    })
                } else if (update === 'positions') {
                    targetGlyph.box.shapePositions = glyphBox[shapeName].shapePositions
                }
                targetGlyph.fitToBox()
            }
        }
    },

    selectGlyphEl: (state, selection) => { // for glyph selection tool
    // selection: {layer, path} -- selection identifies a particular element in a particular glyph
        state.selection = selection
    },

    // configure glyph animations
    addShrinkRegrowAnimation: (state) => {
    // find out which glyphs overlap with other glyphs (must wait till this is complete to shrink glyphs)
        const glyphOverlaps = []
        for (const glyph0 of state.project.glyphs) {
            let overlaps = false
            for (const glyph1 of state.project.glyphs) {
                overlaps = glyph0.group.intersects(glyph1.group)
                if (overlaps) {
                    console.log(`Glyph ${glyph0.id} overlaps with glyph ${glyph1.id}`)
                    break
                }
            }
            glyphOverlaps.push(overlaps)
        }
        // apply shrink / regrowth animation
        for (const [i, overlap] of glyphOverlaps.entries()) {
            const glyph = state.project.glyphs[i]
            if (overlap && !glyph.animations.has('shrink-regrow')) {
                glyph.addShrinkRegrow(0.4)
            }
        }
    },

    removeShrinkRegrowAnimation: (state) => { // TODO use this when switching from chart to grid / edi
        for (const glyph of state.project.glyphs) {
            if (glyph.animations.has('shrink-regrow')) {
                glyph.removeShrinkRegrow()
            }
        }
    },

    saveAsSVG: (state, templateName) => {
        const fileName = `${templateName}.svg`
        const blob = new Blob([paper.project.exportSVG({asString: true})], {type: "image/svg+xml"})
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = fileName
        link.href = url
        link.click()
    }
}
