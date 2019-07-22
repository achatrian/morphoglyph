/* author: Andrea Chatrian
General Template class that can be used to create glyph instances.
Glyph itself is made of items in paperjs or other framework.
BaseGlyph and its subclasses are stateless, if not for the references to the paper.js items (interface model ?)
and references to parent / children glyphs.
*/

import paper from 'paper'
// import store from '../store/index'

class BaseGlyph {
  static baseOptions () {
    return {
      backend: 'paper',
      strokeColor: '#78909C',
      primaryColor: '#00897B',
      secondaryColor: '#F50057',
      lightColor: '#E1F5FE',
      darkColor: '#880E4F',
      strokeWidth: 1,
      thickPathSize: 6,
      narrowPathSize: 3
    }
  }
  parameters = {} // stores the drawing parameters for the glyph
  constructor (
    layer, // paperjs layer where glyph path will be drawn
    id,
    name = '', // name to select / find glyph
    options = BaseGlyph.baseOptions(),
    parent = null) {
    // add options as object
    for (let option in options) {
      this.parameters[option] = options[option]
    }
    this.layer = layer
    this.id = id
    if (name) {
      this.name = name
    } else if (parent === null) {
      this.name = this.constructor.shapes.main // if this is not a child glyph take main name
    } else {
      this.name = this.children[this.parent.children.length] || '' // else take name of nth child
    }
    if (parent !== null && parent.layer !== this.layer) {
      throw Error(`Child ${this.name}'s layer (${this.layer}) differs from parent ${parent.name}'s layer (${parent.layer}`)
    }
    this.parent = parent
    // create main group where to store shape items:
    paper.project.layers[this.layer].activate()
    this.group = new paper.Group([])
  }
  glyphElements = BaseGlyph.elements // names of available elements for this type of glyph
  drawn = false // flag to check if draw() has been called
  itemIds = {}
  drawnItems = new Set()
  zOrder = {} // used to specify z-stack position of paths (which is lost when building group)

  // height and width don't have any visual properties that can be tweaked by the user
  children = [] // array storing children glyphs
  box = {
    canvasRect: { top: 0, bottom: 0, left: 0, right: 0 },
    bounds: { top: 0, bottom: 0, left: 0, right: 0 },
    center: { x: 0, y: 0 },
    shapePositions: {}
  }
  drawOptions = {} // in BaseGlyph().draw() drawing options for glyphs are stored here

  static get type () {
    return 'BaseGlyph'
  }

  static get settings () {
    return {name: '', message: '', options: []}
  }

  static get shapes () {
    return { main: 'main', children: [] }
  }

  static get elements () {
    return [
      {name: 'Height', type: 'scale', properties: [], target: 'main', subElements: []},
      {name: 'Width', type: 'scale', properties: [], target: 'main', subElements: []}
    ] // not inherited by children
  }

  activateLayer () { paper.project.layers[this.layer].activate() }

  getDrawingBox ({boundingRect, shapePositions}) { // compute box
    let newBoundingRect = Object.assign({}, boundingRect)
    if (typeof shapePositions[this.name] !== 'undefined') {
      const {topShift, leftShift, widthProportion, heightProportion} = shapePositions[this.name]
      // topShift and leftShift are relative to boundingRect dimensions before scaling
      if (typeof topShift !== 'undefined') {
        newBoundingRect.top += topShift * boundingRect.height
        newBoundingRect.y += topShift * boundingRect.height
      }
      if (typeof leftShift !== 'undefined') {
        newBoundingRect.left += leftShift * boundingRect.width
        newBoundingRect.x += leftShift * boundingRect.width
      }
      if (typeof widthProportion !== 'undefined') {
        newBoundingRect.width *= widthProportion
      }
      if (typeof heightProportion !== 'undefined') {
        newBoundingRect.height *= heightProportion
      }
    }
    return {
      drawingBounds: boundingRect, // bounds for whole glyph group (is the same in parent / children)
      drawingCenter: {
        x: boundingRect.left + boundingRect.width / 2,
        y: boundingRect.top + boundingRect.height / 2
      },
      bounds: newBoundingRect, // bounds for this glyph
      center: {
        x: newBoundingRect.left + newBoundingRect.width / 2,
        y: newBoundingRect.top + newBoundingRect.height / 2
      },
      shapePositions: shapePositions,
      canvasRect: paper.view.element.getBoundingClientRect()
    }
  }

  updateBox({boundingRect, shapePositions}) { // updates drawing box for glyph and children
    const options = {boundingRect, shapePositions}
    this.box = this.getDrawingBox(options)
    for (let childGlyph of this.children) {
      childGlyph.box = this.getDrawingBox(options)
    }
  }

  draw (options) {
    // method to draw myself -- must be called by subclasses before rest of drawing statements
    this.drawOptions = options
    this.updateBox(this.drawOptions) // adapt box to shapePosition instructions for self and children
    if (this.layer === null) {
      throw Error(`Cannot draw glyph ${this.id} with null layer`)
    }
    if (!Object.is(paper.project.layers[this.layer], paper.project.activeLayer)) {
      throw Error(`Cannot set glyph: Active layer '${paper.project.activeLayer.name}' differs from glyph layer '${paper.project.layers[this.layer].name}'`)
    }
    const drawingBox = paper.Path.Rectangle({
      center: [this.box.drawingCenter.x, this.box.drawingCenter.y],
      size: [this.box.drawingBounds.width, this.box.drawingBounds.height],
      strokeColor: 'black',
      strokeWidth: 5,
      visible: false
    })
    this.registerItem(drawingBox, 'drawingBox')
    this.drawn = true
  }

  set group (group) {
    if (!Object.is(paper.project.layers[this.layer], paper.project.activeLayer)) {
      throw Error(`Cannot set glyph: Active layer '${paper.project.activeLayer.name}' differs from glyph layer '${paper.project.layers[this.layer].name}'`)
    }
    const children = paper.project.layers[this.layer].children
    const groupName = this.name + 'Group'
    const oldGroup = children.find(item => { return item.name === groupName })
    if (typeof oldGroup !== 'undefined') {
      oldGroup.replaceWith(group)
    }
    group.name = groupName
  }

  get group () {
    const children = paper.project.layers[this.layer].children
    const groupName = this.name + 'Group'
    const group = children.find(item => { return item.name === groupName })
    if (typeof group === 'undefined') {
      console.warn(`No group in layer ${this.layer} matched name '${groupName}'.`)
    }
    return group
  }

  buildGroups () { // group drawn items for ease of translation
    const namedItems = this.getNamedItems(false)
    let items = []
    Object.values(namedItems).forEach(path => items.push(path))
    this.group = new paper.Group(items)
    // NB when building group, z order of paths is not necessarily maintained
    for (let itemName in this.zOrder) {
      if (this.zOrder.hasOwnProperty(itemName)) {
        if (this.zOrder[itemName] === -1) {
          this.group.getItem(item => item.name === itemName).sendToBack()
        }
      }
    }
    this.children.forEach(glyph => glyph.buildGroups()) // recursive call on children
  }

  registerItem (item, itemName) { //selectable = true) {
    // associate item unique id with a name that can be used to retrieve it
    // itemName should be lower case (as it's not used for display here)
    this.itemIds[itemName] = item.id
    this.drawnItems.add(itemName)
    item.name = itemName // assign name to item
    // if (selectable) {
    //   item.onClick = async function () {
    //     await store.dispatch('glyph/selectGlyphEl', {
    //       layer: this.layer,
    //       item: itemName
    //     })
    //     console.log(`Selected item ${itemName} of glyph ${this.layer}`)
    //   }.bind(this)
    // } // TODO use hitTest instead
  }

  getItem (itemName = this.constructor.shapes.main) {
    const findItem = children => children.find(path => { return path.id === this.itemIds[itemName] && path.name === itemName })
    let children = this.group.children
    let item = findItem(children)
    if (typeof item === 'undefined') {
      children = paper.project.layers[this.layer].children
      item = findItem(children)
    }
    // id matching should make layer search work, but in case glyph has children of same type there will be multiple
    // items with the same namae
    if (typeof item === 'undefined') {
      throw new Error(`Either id or name did not match the tracked id (${this.itemIds[itemName]}) / name (${itemName})`)
    }
    return item
  }

  deleteItem (itemName = this.constructor.shapes.main) {
    // deleting path if it is drawn (and id was registered using registerItem)
    let found = false
    const itemId = this.itemIds[itemName]
    if (itemId !== null) {
      for (let path of paper.project.layers[this.layer].children) {
        if (path.id === itemId) {
          path.remove()
          this.itemIds[itemName] = null
          found = true
          break
        }
      }
    }
    if (itemId !== null && !found) {
      // shouldn't get here
      throw new Error(`Either id or name did not match the tracked id (${this.itemIds[itemName]}) / name (${itemName})`)
    }
  }

  set mainPath (path) {
    this.registerItem(path, this.constructor.shapes.main)
  }

  get mainPath () {
    return this.getItem(this.constructor.shapes.main)
  }

  getNamedItems (includeChildren = true) {
    // object with keys referencing path objects in layer
    // does not return drawing box
    let items = {}
    items[this.constructor.shapes.main] = this.getItem(this.constructor.shapes.main)
    for (let element of this.glyphElements) {
      if (element.type === 'scale') {
        continue // no item to return for scale-type elements
      }
      let targetGlyph
      if (element.target === this.constructor.shapes.main) {
        targetGlyph = this
      } else if (includeChildren) {
        targetGlyph = this.children.find(glyph => glyph.name === element.target)
      } else {
        continue // only get here if includeChildren is false
      }
      if (typeof targetGlyph === 'undefined') {
        throw Error(`Neither main glyph nor children names matched element's target '${element.target}' `)
      }
      let itemName = element.name.toLowerCase()
      if (this.drawnItems.has(itemName)) {
        items[itemName] = this.getItem(itemName)
        if (!(items[itemName] instanceof paper.Item)) {
          console.warn(`Referenced object '${itemName}' is not a paper.Item instance`)
        }
      }
    }
    return items
  }

  cloneItem (itemName = this.constructor.shapes.main, numPoints = 300) {
    // clone glyph item with an arbitrary number of points
    const item = this.getItem(itemName)
    let newPath = new paper.Path()
    const theta = item.length / numPoints
    for (let t = 0; t < numPoints; t++) {
      newPath.add(item.getLocationAt(theta * t))
    }
    return newPath
  }

  scale (factorX = 1, factorY = 1) {
    // wrapper to paper scale function - can only make smaller if features are normalized correctly into [0, 1]
    if (factorX > 1 || factorY > 1) {
      throw Error("Cannot scale by factor greater than 1")
    }
    if (factorX === 0.0) {
      factorX += 0.05 // cannot scale to 0
    }
    if (factorY === 0.0) {
      factorY += 0.05 // cannot scale to 0
    }
    this.activateLayer()
    //paper.project.layers[this.layer].scale(factorX, factorY)
    const group = this.group
    if (group.children.length === 0) {
      console.warn(`Scaling empty group for glyph ${this.id} - must call buildPathGroups first`)
    }
    group.scale(factorX, factorY)
  }

  reset () { // delete all paperjs items associated with glyph
    if (this.drawn) {
      if (this.parent === null) { // if this is root glyph, clear layer
        paper.project.layers[this.layer].removeChildren()
        this.itemIds = {}
        this.drawnItems = new Set()
      } else {
        for (let itemName in this.itemIds) {
          if (this.itemIds.hasOwnProperty(itemName)) {
            this.deleteItem(itemName) // this should loop over children items as well
          }
        }
      }
      this.children = [] // clear all children
      this.drawn = false
      this.activateLayer()
      this.group = new paper.Group([]) // reset to empty group (needed for path methods to work on new glyph)
    }
  }

  registerChild (glyph) { // function to register children, used mainly in constructor of complex glyphs
    if (!glyph.id) {
      glyph.id = `${this.children.length - 1}`
    }
    if (glyph.layer !== this.layer) {
      throw Error(`Child ${glyph.name}'s layer (${glyph.layer}) differs from parent ${this.name}'s layer (${this.layer}`)
    }
    glyph.parent = this // storing reference
    this.children.push(glyph)
    this.updateBox(this.drawOptions) // make sure box of child is updated with correct shape positions
    // register drawing methods
    for (let element of glyph.constructor.elements) {
      if (element.type !== 'scale') { // scale elements don't have draw function
        this[`draw${glyph.name}${element.name}`] = glyph[`draw${element.name}`].bind(glyph) // drawElement method of child
      }
    }
    if (glyph.drawn) {
      // made child items accessible through parent
      for (let itemName in glyph.itemIds) {
        if (glyph.itemIds.hasOwnProperty(itemName)) { this.itemIds[glyph.name + '-' + itemName] = glyph.itemIds[itemName] }
      }
    } else {
      console.warn(`Passed glyph '${glyph.name}' has not been drawn`)
    }
  }

  getChild (childName) {
    try {
      return this.children.find(childGlyph => { return childGlyph.name === childName })
    } catch (e) {
      throw Error(`Glyph ${this.name} has no children named '${childName}'`)
    }
  }

  deleteChild (childName) {
    let i
    for (i = 0; i < this.children.length; i++) {
      if (this.children[i] === childName) { return i }
    }
    delete this.children[i]
    throw Error(`Glyph ${this.name} has no children named '${childName}'`)
  }
}

export default BaseGlyph

// {
//   deleted: false,
//     enable: true,
//   shape: 'ellipse',
//   dynamicColor: '#edf8fb-#bfd3e6-#9ebcda-#8c96c6-#8856a7-#810f7c',
//   colorFill: '#dac8f4', // hex
//   colorChoice: true,
//   colorGradient: 'empty',
//   colorBorder: '#231736', // hex
//   sizeBorder: 1,
//   length: 'empty',
//   width: 'empty',
//   spikeFraction: 'empty',
//   spikeHeight: 'empty',
//   sizeBorderSpike: 2,
//   colorSpike: '#2d118e',
//   numberOfPoints: 60,
//   staticHeight: true,
//   enableSpike: true,
//   membraneFraction: 'empty',
//   colorMembrane: '#ee311a',
//   membraneSize: 4,
//   enableMembrane: true,
//   symbolFilling: 'empty',
//   orderSymbol: 'radial',
//   colorSymbol: '#eeea3e',
//   sizeSymbol: 3,
//   symbol1: 'circle',
//   enableSymbol: true,
//   protrusionFraction: 'empty',
//   sizeBorderProtrusion: 3,
//   colorProtrusion: '#2d118e',
//   enableProtrusion: true,
//   symbolBorderFraction: 'empty',
//   colorSymbolBorder: '#ed5cee',
//   sizeSymbolBorder: 2,
//   symbolBorderSymbol: 'dashes',
//   enableBorderSymbol: true,
//   densityElement: 'empty',
//   organisationMesh: 'vertical',
//   colorMesh: '#2d118e',
//   sizeMesh: 1,
//   enableMesh: true,
//   centerX: 0,
//   centerY: 0
// }
