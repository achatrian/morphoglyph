/* author: Andrea Chatrian
General Template class that can be used to create glyph instances.
Glyph itself is made of items in paperjs or other framework.
BaseGlyph and its subclasses are stateless, if not for the references to the paper.js items (interface model ?)
and references to parent / children glyphs.
*/

import paper from 'paper'
// import store from '../store/index'
import DrawingBox from './DrawingBox'


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

  static get glyphScope () {
    for (let i = 0; i < 3; i++) {
      let scope = paper.PaperScope.get(i)
      if (scope.view.element.id === 'glyph-canvas') {
        return scope
      }
    }
    throw Error("No scope bound to element 'glyph-canvas'")
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
    this.activateLayer()
    this.group = new paper.Group([])
  }
  glyphElements = BaseGlyph.elements // names of available elements for this type of glyph
  drawn = false // flag to check if draw() has been called
  itemIds = {}
  drawnItems = new Set()
  zOrder = {} // used to specify z-stack position of paths (which is lost when building group)

  // height and width don't have any visual properties that can be tweaked by the user
  children = [] // array storing children glyphs
  box = null
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
    // Possible element properties include: color, size, requiresTransform, priority
    return [
      {name: 'Height', type: 'scale', properties: {}, target: 'main', subElements: []},
      {name: 'Width', type: 'scale', properties: {}, target: 'main', subElements: []}
    ] // not inherited by children
  }

  // iterate over self and children
  * iter () {
    yield this
    for (let child of this.children) {
      yield child
    }
  }

  activateLayer () {
    BaseGlyph.glyphScope.activate()
    BaseGlyph.glyphScope.project.layers[this.layer].activate()
  }

  draw (options) {
    // method to draw myself -- must be called by subclasses before rest of drawing statements
    this.drawOptions = options
    this.box = new DrawingBox(this, options) // adapt box to shapePosition instructions for self and children
    if (this.layer === null) {
      throw Error(`Cannot draw glyph ${this.id} with null layer`)
    }
    this.activateLayer()
    if (!Object.is(paper.project.layers[this.layer], paper.project.activeLayer)) {
      throw Error(`Cannot set glyph: Active layer '${paper.project.activeLayer.name}' differs from glyph layer '${paper.project.layers[this.layer].name}'`)
    }
    if (!this.parent) {
      const drawingBox = paper.Path.Rectangle({
        center: [this.box.drawingCenter.x, this.box.drawingCenter.y],
        size: [this.box.drawingBounds.width, this.box.drawingBounds.height],
        strokeColor: 'black',
        strokeWidth: 5,
        visible: false
      })
      this.registerItem(drawingBox, 'drawingBox')
    }
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
          this.group.getItem(item => item.name === itemName).sendToBack() // TODO does this modify z position or project hierarchy only (or are they the same thing ?)
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
    if (this.parent) {
      this.parent.itemIds[this.name + '-' + itemName] = item.id // makes paths accessible from parent
    }
    // if (item instanceof paper.Path
    //     && item.name !== 'protrusion') {
    //   item.simplify() // reduces memory usage and speeds up drawing
    // } // protrusion path looks skewed if simplified
  }

  findItem = (children, itemName) => children.find(item => { return item.id === this.itemIds[itemName] && item.name === itemName })

  getItem (itemName = this.name) {
    let children = this.group.children
    let item = this.findItem(children, itemName)
    if (typeof item === 'undefined') {
      children = paper.project.layers[this.layer].children
      item = this.findItem(children, itemName)
    }
    // id matching should make layer search work, but in case glyph has children of same type there will be multiple
    // items with the same name
    if (typeof item === 'undefined') {
      throw new Error(`Either id or name did not match the tracked id (${this.itemIds[itemName]}) / name (${itemName})`)
    }
    return item
  }

  deleteItem (itemName = this.name) {
    // deleting path if it is drawn (and id was registered using registerItem)
    let children = this.group.children
    let item = this.findItem(children)
    if (typeof item === 'undefined') {
      children = paper.project.layers[this.layer].children
      item = this.findItem(children, itemName)
    }
    if (typeof item === 'undefined') {
      throw new Error(`Either id or name did not match the tracked id (${this.itemIds[itemName]}) / name (${itemName})`)
    }
    item.remove()
    this.itemIds[itemName] = null
  }

  set mainPath (path) { // this should be original path with fixed aspect ratio
    if (this.itemIds[this.name]) {
      throw Error(`Cannot register main path - path with name ${this.name} already exists`)
    }
    this.registerItem(path, this.name)
  }

  get mainPath () {
    return this.getItem(this.name)
  }

  get outerPath () { // path where elements are drawn onto. It can vary with the data-points' value (e.g. protrusion)
    return this.mainPath
  }

  getNamedItems (searchChildren = true) {
    // object with keys referencing path objects in layer
    // does not return drawing box
    let items = {}
    items[this.name] = this.getItem(this.name)
    for (let element of this.glyphElements) {
      if (element.type === 'scale') {
        continue // no item to return for scale-type elements
      }
      let targetGlyph
      if (element.target === 'main' || element.target === this.name) {
        targetGlyph = this
      } else if (searchChildren) {
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

  cloneItem (itemName = 'outer', numPoints = 100) {
    // clone glyph item with an arbitrary number of points
    let item
    if (itemName === 'outer') {
      item = this.outerPath
    } else {
      item = this.getItem(itemName)
    }
    let newPath = new paper.Path()
    const theta = item.length / numPoints
    for (let t = 0; t < numPoints; t++) {
      newPath.add(item.getLocationAt(theta * t))
    }
    return newPath
  }

  changeLayer (layerId) { // layer ID can be its index or its name, as both are keys of project.layers
    const targetLayer = paper.project.layers[layerId]
    const addedGroup = this.group.addTo(targetLayer)
    if (!addedGroup) {
      throw Error(`Could not add glyph '${addedGroup.id}' to layer '${layerId}'`)
    }
    this.layer = targetLayer.index // index of layer in project array
    for (let childGlyph of this.children) {
      childGlyph.changeLayer(layerId) // apply to children as well
    }
  }

  updateDrawingBounds(drawingBounds, children = false) { // updates drawing box for glyph and children
    this.box = new DrawingBox(this, {
        boundingRect: drawingBounds,
        shapePositions: this.box.shapePositions,
        history: this.box.history, // so that transformers can be re-applied
    })
    if (children) {
      for (let childGlyph of this.children) {
        childGlyph.box = new DrawingBox(childGlyph, {
          boundingRect: drawingBounds,
          shapePositions: childGlyph.box.shapePositions,
          history: childGlyph.box.history,
          maxHistLength: childGlyph.box.maxHistLength
        })
      }
    }
  }

  checkBoxUpdate (threshold = 0.1) {
    // Check whether drawing bounds have change, in which case the change is applied with reference to the drawing box
    let updated = {box: false, main: false}
    let drawingBox
    try {
      drawingBox = this.getItem('drawingBox')
    } catch (e) {
      return updated
    }
    if (this.drawn && (
        Math.abs(this.box.drawingBounds.x - drawingBox.bounds.x) > threshold ||
        Math.abs(this.box.drawingBounds.y - drawingBox.bounds.y) > threshold ||
        Math.abs(this.box.drawingBounds.width -  drawingBox.bounds.width) > threshold ||
        Math.abs(this.box.drawingBounds.height - drawingBox.bounds.height) > threshold
    )) {
      updated.box = true
    }
    const mainPath = this.mainPath
    // same, but w.r. to the main path
    if (this.drawn && (
        Math.abs(this.box.bounds.x - mainPath.bounds.x) > threshold ||
        Math.abs(this.box.bounds.y - mainPath.bounds.y) > threshold ||
        Math.abs(this.box.bounds.width -  mainPath.bounds.width) > threshold ||
        Math.abs(this.box.bounds.height - mainPath.bounds.height) > threshold
    )) {
      updated.main = true
    }
    return updated
  }

  fitToBox (selector = 'glyph') {
    /*
      selector === 'layer': update drawing box and all glyphs
      selector ===  'glyph': only update glyph group (main + elements)
      selector === 'all' : update glyph and children
    */
    let group
    if (selector === 'layer') {
      group = paper.project.layers[this.layer]
    } else if (selector === 'glyph' || selector === 'all') {
      group = this.group
    }
    // for transforms applied before element drawing: if group is empty target the main path
    if (group.children.length === 0) {
      group = this.mainPath
    }
    const updated = this.checkBoxUpdate()
    if (selector === 'layer' && updated.box) {
      const drawingBox = this.getItem('drawingBox')
      group.translate(new paper.Point(
          this.box.drawingBounds.x - drawingBox.bounds.x,
          this.box.drawingBounds.y - drawingBox.bounds.y
      ))
      group.scale(
          this.box.drawingBounds.width /  drawingBox.bounds.width,
          this.box.drawingBounds.height /  drawingBox.bounds.height
      )
    } else if (updated.main) {
      const mainPath = this.mainPath
      group.translate(new paper.Point(
          this.box.bounds.x - mainPath.bounds.x,
          this.box.bounds.y - mainPath.bounds.y
      ))
      group.scale(
          this.box.bounds.width / mainPath.bounds.width,
          this.box.bounds.height / mainPath.bounds.height
      )
    } else {
      console.warn('fitToBox did not update any path')
    }
    if (selector === 'all') {
      for (let glyph of this.children) {
        glyph.fitToBox('glyph')
      }
    }
  }

  reset () { // reset box to null and delete all paperjs items associated with glyph
    this.box = null
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

  registerChild (glyph) { // function to register children, used mainly in constructor of complex glyphs or to add a new custom glyph
    if (!glyph.id) {
      glyph.id = `${this.children.length - 1}`
    }
    if (glyph.layer !== this.layer) {
      throw Error(`Child ${glyph.name}'s layer (${glyph.layer}) differs from parent ${this.name}'s layer (${this.layer}`)
    }
    glyph.parent = this // storing reference
    this.children.push(glyph)
    // register drawing methods
    for (let element of glyph.constructor.elements) {
      if (element.type !== 'scale') { // scale elements don't have draw function
        this[`draw${glyph.name}${element.name}`] = glyph[`draw${element.name}`].bind(glyph) // drawElement method of child
      }
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
