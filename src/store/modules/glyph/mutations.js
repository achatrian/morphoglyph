// import Vue from 'vue'
import paper from 'paper'
import Vue from 'vue'

export default {
  setLayersUp: (state, maxDisplayedGlyphs) => {
    for (let i = 0; i < maxDisplayedGlyphs; i++) {
      let newPaperLayer = new paper.Layer({name: `glyph${i}`}) // automatically attached to project
      newPaperLayer.opacity = 1
    }
    state.activeLayer = 0
    paper.project.layers[state.activeLayer].activate()
  },

  setGlyphType: (state, {glyphTypeName, glyphSetting}) => {
    state.glyphTypeName = glyphTypeName
    let glyphElements = []
    let glyphClass
    for (let glyphType of state.glyphTypes) {
      if (glyphType.type.startsWith(glyphTypeName)) {
        glyphClass = glyphType
      }
    }
    if (typeof glyphClass === 'undefined') {
      throw Error(`Unknown glyph type: ${glyphTypeName}`)
    }
    // update settings with those of currently selected class
    state.glyphSettings = glyphClass.settings
    // update shapes names those of currently selected class
    state.glyphShapes = glyphClass.shapes
    state.glyphShapes.all = [state.glyphShapes.main, ...state.glyphShapes.children]
    // update elements names with those from currently selected class
    glyphElements.push(...glyphClass.elements)
    state.glyphElements = glyphElements
    console.log(`Loaded settings and elements for glyph type: ${glyphClass.type}`)
    if (glyphSetting.length > 0) { state.selectedGlyphSetting = glyphSetting }
  },

  resetProject: (state) => {
    paper.project.clear()
    Vue.set(state, 'project', {
      name: 'A Phew project',
      glyphs: [],
      bindings: []
    })
  },

  setBindings: (state, bindings) => { state.project.bindings = bindings },

  addGlyphs: (state, {parsedData, namingField}) => { // payload is added in action
    let glyphClass
    for (let glyphType of state.glyphTypes) {
      if (glyphType.type.startsWith(state.glyphTypeName)) {
        glyphClass = glyphType
      }
    }
    if (typeof glyphClass === 'undefined') {
      throw Error(`Unknown glyph type: ${state.glyphTypeName}`)
    }
    // eslint-disable-next-line new-cap
    state.glyphElements = glyphClass.elements // update glyph elements for feature binding
    // extract naming field from data-points and initialise glyphs in order of appearance in file
    // eslint-disable-next-line new-cap
    state.project.glyphs = parsedData.map((dataPoint, i) => new glyphClass(i, dataPoint[namingField]))
  },

  reassignLayers: (state, {startIndex, endIndex}) => {
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

  reassignGlyphIds: (state, glyphIds) => state.project.glyphs.forEach((glyph, i) => {
    glyph.id = glyphIds[i]
  }),

  drawGlyph: (state, {boundingRect, glyphId, dataPoint}) => {
    /* params {
          glyphIndex: Number
          boundingRect: {left: Number, top: Number, width: Number, height: Number}
    } */
    let glyph = state.project.glyphs.find(glyph => glyph.id === glyphId)
    state.activeLayer = glyph.layer // activate layer corresponding to glyph
    paper.project.layers[state.activeLayer].activate()
    let drawOptions = {
      boundingRect: Object.assign({}, boundingRect),
      shapePositions: state.shapePositions,
      [state.glyphSettings.name]: state.selectedGlyphSetting
    }
    // Draw all glyph paths
    glyph.draw(drawOptions)
    let targetGlyph
    for (let binding of state.project.bindings) {
      if (binding.element === 'Height' || binding.element === 'Width') {
        continue // skipping height and width -- TODO generalise to scale-type elements
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
    // Handle scaling of glyph (relies on built groups !) -- TODO generalise to scale-type elements other than Height and Width ?
    for (let shape of state.glyphShapes.all) {
      const widthBinding = state.project.bindings.find(binding => binding.element === 'Width' && binding.shape === shape)
      const heightBinding = state.project.bindings.find(binding => binding.element === 'Height' && binding.shape === shape)
      if (glyph.name === shape) {
        targetGlyph = glyph
      } else {
        targetGlyph = glyph.getChild(shape)
      }
      targetGlyph.scale(
          widthBinding ? dataPoint[widthBinding.field] : 1,
          heightBinding ? dataPoint[heightBinding.field] : 1
      )
    }
  },

  moveGlyph: (state, {boundingRect, glyphId, shapeSelector = 'layer'}) => {
    // loop over paths in layer corresponding to dock
    const glyph = state.project.glyphs.find(glyph => glyph.id === glyphId)
    state.activeLayer = glyph.layer // activate layer corresponding to glyph
    paper.project.layers[state.activeLayer].activate()
    // Layer extends Group, so transformations can be applied to all the elements
    // there is lag in reappearance - if timeout in reacting to resize event is 0 the layer resize breaks
    // main path's position and size attributes are used as reference for translation and scaling
    let group, refPath, targetGlyph
    if (shapeSelector === 'layer') { // translate and scale the whole layer
      group = paper.project.layers[state.activeLayer] // layer is a special group
      refPath = glyph.mainPath
    } else { // translate and scale selected shape
      if (glyph.constructor.shapes.main === shapeSelector) {
        targetGlyph = glyph
      } else {
        targetGlyph = glyph.getChild(shapeSelector)
      }
      if (typeof targetGlyph === 'undefined') {
        throw Error(`Could not find shape '${shapeSelector}'`)
      }
      group = targetGlyph.group
      refPath = targetGlyph.mainPath
    }
    group.translate(new paper.Point(
      boundingRect.left + boundingRect.width / 2 - refPath.position.x,
      boundingRect.top + boundingRect.height / 2 - refPath.position.y
    ))
    const newWidth = (boundingRect.width + boundingRect.height) / 2
    const newHeight = newWidth * (refPath.size[1] / refPath.size[0])
    group.scale(newWidth / refPath.size[0], newHeight / refPath.size[1]) // NB mainPath.size[0] ≠ mainPath.bounds.width
    refPath.size = [newWidth, newHeight] // NB Size of main path would not change automatically after scaling layer !!!
    glyph.updateBox({
      boundingRect: boundingRect,
      shapePositions: state.shapePositions
    })
  },

  setRedrawing: (state, redrawing) => { state.redrawing = redrawing },

  toggleGlyph: (state, {glyphIndex, value}) => {
    state.activeLayer = glyphIndex
    let layer = paper.project.layers[state.activeLayer]
    layer.activate()
    layer.visible = value
  },

  hideGlyphs: state => {
    for (let i = 0; i < state.numDisplayedGlyphs; i++) {
      state.activeLayer = i
      let layer = paper.project.layers[state.activeLayer]
      layer.activate()
      layer.visible = false
    }
  },

  showGlyphs: state => {
    for (let i = 0; i < state.numDisplayedGlyphs; i++) {
      state.activeLayer = i
      let layer = paper.project.layers[state.activeLayer]
      layer.activate()
      layer.visible = true
    }
  },

  resetGlyph: (state, glyphIndex) => state.project.glyphs[glyphIndex].reset(),

  // *** other drawings ***
  addCaption: (state, {glyphIndex, caption}) => { //boundingRect, }) => {
    state.activeLayer = glyphIndex
    // const {left, top, width, height} = boundingRect
    const {x, y, width, height} = state.project.glyphs[glyphIndex].mainPath.bounds
    const captionText = new paper.PointText({
      point: [
        x + width / 10, // starting point of text TODO move to middle
        y + height * 1.15 // slightly below glyph
      ],
      content: caption,
      fillColor: 'gray',
      fontSize: 14
    })
    state.project.captions[glyphIndex] = captionText.id // causes stack limit error, same as storing path in vuex
  },

  // *** glyph property setter ***
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

  selectGlyphEl: (state, selection) => {
    // selection: {layer, path} -- selection identifies a particular element in a particular glyph
    state.selection = selection
  },

  addChildGlyph (state, {glyphId, childName}) {
    // function to add arbitrary children to existing glyphs
    // TODO integrate and add new button
    let glyphClass
    for (let glyphType of state.glyphTypes) {
      if (glyphType.type.startsWith(state.glyphTypeName)) {
        glyphClass = glyphType
      }
    }
    if (typeof glyphClass === 'undefined') {
      throw Error(`Unknown glyph type: ${state.glyphTypeName}`)
    }
    const glyph = state.project.glyphs.find(glyph => glyph.id === glyphId)
    // eslint-disable-next-line new-cap
    glyph.registerChild(new glyphClass(childName))
  }
}
