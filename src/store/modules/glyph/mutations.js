// import Vue from 'vue'
import paper from 'paper'
import Vue from 'vue'

function glyphScope() {
  for (let i = 0; i < 3; i++) {
    let scope = paper.PaperScope.get(i)
    if (scope.view.element.id === 'glyph-canvas') {
      return scope
    }
  }
  throw Error("No scope bound to element 'glyph-canvas'")
}

const checkRect = boundingRect => {
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
      let newPaperLayer = new paper.Layer({name: `glyph${i}`}) // automatically attached to project
      newPaperLayer.opacity = 1
    }
    state.activeLayer = 0
    paper.project.layers[state.activeLayer].activate()
  },

  makeTempLayer: (state) => {
    const scope = glyphScope()
    scope.activate()
    let tempLayer = new scope.Layer({name: 'temp'}) // using glyphScope().Layer breaks initialization
    state.activeLayer = 'temp'
    tempLayer.activate()
  },

  removeTempLayer: () => {
    const scope = glyphScope()
    scope.activate()
    const tempLayer = scope.project.layers.find(layer => layer.name === 'temp')
    if (typeof tempLayer !== 'undefined') {
      tempLayer.remove()
    } else {
      console.warn('Attempted to remove non-existent temporary layer')
    }
  },

  setGlyphType: (state, {glyphTypeName, glyphSetting}) => {
    state.glyphTypeName = glyphTypeName
    const glyphClass = state.glyphTypes.find(glyphType => glyphType.type.startsWith(state.glyphTypeName))
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
    if (glyphSetting.length > 0) {
      state.selectedGlyphSetting = glyphSetting
    }
  },

  resetProject: (state) => {
    glyphScope().project.clear()
    Vue.set(state, 'project', {
      name: 'A Phew project',
      glyphs: [],
      bindings: []
    })
  },

  setBindings: (state, bindings) => {
    state.project.bindings = bindings
  },

  addDataBoundGlyphs: (state, {parsedData, namingField}) => { // payload is added in action
    const glyphClass = state.glyphTypes.find(glyphType => glyphType.type.startsWith(state.glyphTypeName))
    if (typeof glyphClass === 'undefined') {
      throw Error(`Unknown glyph type: ${state.glyphTypeName}`)
    }
    // eslint-disable-next-line new-cap
    state.glyphElements = glyphClass.elements // update glyph elements for feature binding
    // extract naming field from data-points and initialise glyphs in order of appearance in file
    // eslint-disable-next-line new-cap
    state.project.glyphs = parsedData.map((dataPoint, layerIndex) => new glyphClass(layerIndex, dataPoint[namingField]))
  },

  makeEmptyGlyphs: (state, {
    newGlyphName,
    createOptions,
      boundingRects
  }) => {
    if (state.project.glyphs.length === 0) {
      throw Error("Databound glyphs must be added before empty glyphs can be created")
    }
    const glyphClass = state.glyphTypes.find(glyphType => glyphType.type.startsWith(state.glyphTypeName))
    if (typeof glyphClass === 'undefined') {
      throw Error(`Unknown glyph type: ${state.glyphTypeName}`)
    }
    let createdGlyphs = [] // store references to newly created glyphs in order to draw them
    for (let glyph of state.project.glyphs) {
      let emptyGlyph
      if (createOptions) {
        emptyGlyph = new glyphClass(glyph.layer, newGlyphName, createOptions) // glyphs will be undrawn at this point
      } else {
        emptyGlyph = new glyphClass(glyph.layer, newGlyphName) // default options will be used
      }
      glyph.registerChild(emptyGlyph)
      createdGlyphs.push(emptyGlyph)
    }
    // draw created children glyphs
    for (let [i, boundingRect] of boundingRects.entries()) {
      createdGlyphs[i].draw({
        boundingRect: Object.assign({}, boundingRect),
        scaleOrders: [],
        [state.glyphSettings.name]: state.selectedGlyphSetting,
        shapeJSON: state.shapeJSON // used by glyphs to draw custom main paths
      })
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
    const glyph = state.project.glyphs.find(glyph => glyph.id === glyphId)
    glyph.changeLayer(layerId)
  },

  drawGlyph: (state, {boundingRect, glyphId, dataPoint, varShapeAssignment, shapeJSONStore}) => {
    /* params {
          glyphIndex: Number
          boundingRect: {left: Number, top: Number, width: Number, height: Number}
    } */
    checkRect(boundingRect) // ensures correct rect format
    let glyph = state.project.glyphs.find(glyph => glyph.id === glyphId)
    state.activeLayer = glyph.layer // activate layer corresponding to glyph
    glyph.activateLayer()
    // Handle scaling of glyph
    let scaleOrders = []
    for (let binding of state.project.bindings) {
      let glyphElement = state.glyphElements.find(element => element.name === binding.element)
      if (glyphElement.type !== 'scale' && !glyphElement.properties.requiresTransform) {
        continue // skipping bindings that are not scales and do not require a transform
      }
      let scaleOrder = Object.assign({}, {
        ...binding,
        value: dataPoint[binding.field]
      })
      scaleOrders.push(scaleOrder)
    }
    // pass custom shape according to categorical features
    const shapeJSONs = []
    for (let assignment of varShapeAssignment) {
      if (dataPoint[assignment.field] === assignment.categoricalValue) {
        shapeJSONs.push(shapeJSONStore.get(assignment.shape))
        // for glyphs that require named shapes (N.B not used yet)
        shapeJSONs[assignment.shape] = shapeJSONStore.get(assignment.shape)
      }
    }
    let drawOptions = {
      boundingRect: Object.assign({}, boundingRect),
      scaleOrders: scaleOrders,
      [state.glyphSettings.name]: state.selectedGlyphSetting,
      shapeJSONs: shapeJSONs // used by glyphs to draw custom main paths
    }
    // Draw all glyph paths
    glyph.draw(drawOptions)
    let targetGlyph
    // elements are drawn according to their priority value in decreasing order (the default is 0)
    // need to clone the binding array first as .sort() mutates its parent
    const orderedBindings = [...state.project.bindings].sort(binding => {
      let element = state.glyphElements.find(element => element.name === binding.element)
      if (element.properties.priority) {
        return  - element.properties.priority // negative sign needed as sorting order will be ascending
      } else {
        return 0
      }
    })
    for (let binding of orderedBindings) {
      let glyphElement = state.glyphElements.find(element => element.name === binding.element)
      if (glyphElement.type === 'scale') {
        continue // skipping bindings to scale-type elements
      }
      if (glyph.name === binding.shape) {
        targetGlyph = glyph
      } else {
        targetGlyph = glyph.getChild(binding.shape)
      } // target is either main glyph or one of children
      if (typeof targetGlyph === 'undefined') {
        throw Error(`Neither glyph ${glyphId} nor its children match shape '${binding.shape}' `)
      }
      try {
        targetGlyph['draw' + binding.element](dataPoint[binding.field]) // get draw method for element and call it
      } catch (e) {
        if (typeof targetGlyph['draw' + binding.element] === 'undefined') {
          throw Error(`Handler for element ${binding.element} not defined on glyph type ${targetGlyph.name}`)
        } else {
          throw e
        }
      }
    }
    // Group all drawn paths to enable movements of individual shapes
    glyph.buildGroups()
  },

  moveGlyph: (state, {boundingRect, glyphId}) => {
    // function to change drawing bounds of a glyph
    // Warning: this function's purpose isn't to change relative position of glyphs in the drawing box
    checkRect(boundingRect) // ensures correct rect format TODO disable if in production mode ?
    const glyph = state.project.glyphs.find(glyph => glyph.id === glyphId)
    state.activeLayer = glyph.layer // activate layer corresponding to glyph
    glyph.activateLayer()
    glyph.updateDrawingBounds(boundingRect, true)
    setTimeout(glyph.fitToBox('layer'))
  },

  changeGlyphPosition: (state, {steps, shapeSelector = '', children = false}) => {
    for (let glyph of state.project.glyphs) {
      let targetGlyph = glyph
      if (shapeSelector) {
         targetGlyph = [...glyph.iter()].find(glyph => glyph.name === shapeSelector)
      }
      if (children) { // must use initial glyph position
        for (let childGlyph of targetGlyph.children) {
          // make child steps relative to parent glyph
          let childSteps = steps.map(step => {
            let childStep = JSON.parse(JSON.stringify(step)) // deep copy
            if (childStep.transform === 'shift' && childStep.parameters[2].setValues) {
              if (childStep.parameters[0] !== null) {
                childStep.parameters[0] += childGlyph.box.shapePositions.leftShift -
                    targetGlyph.box.shapePositions.leftShift
              }
              if (childStep.parameters[1] !== null) {
                childStep.parameters[1] += childGlyph.box.shapePositions.topShift -
                    targetGlyph.box.shapePositions.topShift
              }
              return childStep
            }
          })
          childGlyph.box.applyTransforms(childSteps)
        }
      }
      targetGlyph.box.applyTransforms(steps)
      targetGlyph.fitToBox(children ? 'all' : 'glyph')
    }
  },

  setRedrawing: (state, redrawing) => {
    state.redrawing = redrawing
  }, // used in activateRedrawing action

  redrawElement: (state, {binding, normalizedData}) => {
    for (let [i, glyph] of state.project.glyphs.entries()) {
      let targetGlyph = [...glyph.iter()].find(glyph => glyph.name === binding.shape)
      if (targetGlyph.drawn) {
        targetGlyph.activateLayer()
        if (targetGlyph.itemIds[binding.element]) {
          targetGlyph.deleteItem(binding.element.toLowerCase()) // paths have same name of elements in lower-case
        }
        targetGlyph['draw' + binding.element](normalizedData[i][binding.field]) // FIXME must look for datapoint with correct id
        targetGlyph.buildGroups()
      }
    }
    // remove any binding with same element as in new assignment
    state.project.bindings.filter(
        binding_ => !(binding_.element === binding.element && binding_.shape === binding.shape)
    )
    state.project.bindings.push(binding)
  },

  setGlyphVisibility: (state, {value, glyphSelector = 'all', shapeSelector = 'layer', itemSelector = 'group'}) => {
    let glyphsToChange = []
    if (glyphSelector === 'all') {
      glyphsToChange = state.project.glyphs
    } else {
      const selectedGlyph = state.project.glyphs.find(glyph => glyph.id === glyphSelector)
      if (typeof selectedGlyph === 'undefined') {
        throw Error(`No glyphs were found to match selector '${glyphSelector}'`)
      }
      glyphsToChange.push(state.project.glyphs.find(glyph => glyph.id === glyphSelector))
    }
    for (let glyph of glyphsToChange) {
      state.activeLayer = glyph.layer
      let layer = glyphScope().project.layers[state.activeLayer]
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

  resetGlyph: (state, glyphIndex) => state.project.glyphs[glyphIndex].reset(),

  discardGlyphs: (state) => {
    state.project.glyphs = []
  },

  // *** other drawings ***
  addCaption: (state, {glyphIndex, caption}) => { //boundingRect, }) => {
    state.activeLayer = glyphIndex
    // const {left, top, width, height} = boundingRect
    const {x, y, width, height} = state.project.glyphs[glyphIndex].mainPath.bounds
    // eslint-disable-next-line no-unused-vars
    const scope = glyphScope()
    scope.activate()
    new scope.PointText({
      point: [
        x + width / 10, // starting point of text TODO move to middle
        y + height * 1.15 // slightly below glyph
      ],
      content: caption,
      fillColor: 'gray',
      fontSize: 14
    })
  },

  // *** glyph property setter ***
  setGlyphParameters: (state, {parameters, shapeName}) => {
    let targetGlyph
    for (let glyph of state.project.glyphs) {
      if (glyph.drawn && glyph.name === shapeName) {
        targetGlyph = glyph
      } else {
        targetGlyph = glyph.getChild(shapeName)
      } // target is either main glyph or one of its children
      Object.assign(targetGlyph.parameters, parameters)
    }
  },

  setPathParameter: (state, {parameter, value, shapeName, elementName}) => {
    let targetGlyph
    for (let glyph of state.project.glyphs) {
      if (glyph.drawn && glyph.name === shapeName) {
        targetGlyph = glyph
      } else {
        targetGlyph = glyph.getChild(shapeName)
      } // target is either main glyph or one of its children
      if (targetGlyph && targetGlyph.drawn) {
        let paths = targetGlyph.getNamedItems(true)
        paths[elementName.toLowerCase()][parameter] = value
        let propString = elementName.toLowerCase() + parameter[0].toUpperCase() + parameter.slice(1)
        targetGlyph.parameters[propString] = value // .parameters must not store objects --> assemble specific string
      }
    }
  },

  setShapePosition: (state, {shapeName, position}) => {
    let shapePositions = state.shapePositions
    shapePositions[shapeName] = position
    state.shapePositions = shapePositions // principle of rewriting object for vuex to react to it
  },

  selectGlyphEl: (state, selection) => { // for glyph selection tool
    // selection: {layer, path} -- selection identifies a particular element in a particular glyph
    state.selection = selection
  },

  // configure glyph animations
  addShrinkRegrowAnimation: (state) => {
    // find out which glyphs overlap with other glyphs (must wait till this is complete to shrink glyphs)
    let glyphOverlaps = []
    for (let glyph0 of state.project.glyphs) {
      let overlaps = false
      for (let glyph1 of state.project.glyphs) {
        overlaps = glyph0.group.intersects(glyph1.group)
        if (overlaps) {
          console.log(`Glyph ${glyph0.id} overlaps with glyph ${glyph1.id}`)
          break
        }
      }
      glyphOverlaps.push(overlaps)
    }
    // apply shrink / regrowth animation
    for (let [i, overlap] of glyphOverlaps.entries()) {
      let glyph = state.project.glyphs[i]
      if (overlap && !glyph.animations.has('shrink-regrow')) {
        glyph.addShrinkRegrow(0.4)
      }
    }
  },

  removeShrinkRegrowAnimation: (state) => { // TODO use this when switching from chart to grid / edi
    for (let glyph of state.project.glyphs) {
      if (glyph.animations.has('shrink-regrow')) {
        glyph.removeShrinkRegrow()
      }
    }
  }
}
