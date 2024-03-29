/* author: Andrea Chatrian
General Template class that can be used to create glyph instances.
Glyph provides interface to control drawing of items in paperjs or other framework.
*/

import paper from 'paper'
import debounce from 'debounce'
// import store from '../store/index'
import DrawingBox from './DrawingBox'


class BaseGlyph {

  static baseParameters () {
    return {
      backend: 'paper',
      strokeColor: '#78909C',
      primaryColor: '#00897B',
      secondaryColor: '#F50057',
      lightColor: '#E1F5FE',
      darkColor: '#880E4F',
      strokeWidth: 1
    }
  }

  static get glyphScope () {
    for (let i = 0; i < 3; i++) {
      const scope = paper.PaperScope.get(i)
      if (scope.view.element.id === 'glyph-canvas') {
        return scope
      }
    }
    throw Error("No scope bound to element 'glyph-canvas'")
  }

  parameters = {

  } // stores the drawing parameters for the glyph

  constructor(
      layer, // paperjs layer where glyph path will be drawn
      id,
      name = '', // name to select / find glyph
      parameters = BaseGlyph.baseParameters(),
      parent = null) {
    // add options as object
    for (const option in parameters) {
      this.parameters[option] = parameters[option]
    }
    this.layer = layer
    this.id = id
    if (parent === null) {  // add shape attribute to locate predefined parts of a glyph
      this.shape = this.constructor.shapes.main
    } else {
      this.shape = parent.constructor.shapes.children[parent.children.length] || '' // else take name of nth child
    }
    if (name) {
      this.name = name
    } else {
      this.name = this.shape
    }
    if (parent !== null && parent.layer !== this.layer) {
      throw Error(`Child ${this.name}'s layer (${this.layer}) differs from parent ${parent.name}'s layer (${parent.layer}`)
    }
    this.parent = parent
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
  animations = new Set() // stores animations that were added to glyph

  static get type () {
    return 'BaseGlyph'
  }

  static get settings () {
    return {name: '', message: '', options: []}
  }

  static get shapes () {
    return { main: 'main', children: [], all: ['main']}
  }

  static get elements () {
    // Possible element properties include: color, size, requiresTransform, priority
    return [
      {name: 'Height', type: 'scale', properties: {}, target: 'main', subElements: []},
      {name: 'Width', type: 'scale', properties: {}, target: 'main', subElements: []}
    ] // not inherited by children
  }

  // iterate over self and children
  * iter (recursive=false) {
    yield this
    for (const child of this.children) {
      if (recursive) {
        yield* child.iter(recursive) // yields from generator
      } else {
        yield child
      }
    }
  }

  activateLayer () {
    BaseGlyph.glyphScope.activate()
    BaseGlyph.glyphScope.project.layers[this.layer].activate()
  }

  draw (options) {
    // method to draw myself -- must be called by subclasses before rest of drawing statements
    this.drawOptions = options
    if (!this.box) { // if box was preset (e.g. when loading template) there's no need for a new box
      this.box = new DrawingBox(this, options) // adapt box to shapePosition instructions for self and children
    }
    if (this.layer === null) {
      throw Error(`Cannot draw glyph ${this.id} with null layer`)
    }
    this.activateLayer()
    // create main group where to store shape items:
    this.group = new paper.Group([])
    if (!Object.is(paper.project.layers[this.layer], paper.project.activeLayer)) {
      throw Error(`Cannot set glyph: Active layer '${paper.project.activeLayer.name}' differs from glyph layer '${paper.project.layers[this.layer].name}'`)
    }
    if (!this.parent) { // register a visible black rectangle used for debugging purposes
      const drawingBox = paper.Path.Rectangle({
        center: [this.box.drawingCenter.x, this.box.drawingCenter.y],
        size: [this.box.drawingBounds.width, this.box.drawingBounds.height],
        strokeColor: 'black',
        strokeWidth: 5,
        visible: false
      })
      this.registerItem(drawingBox, 'drawingBox')
      for (const childGlyph of this.children) {
        childGlyph.registerItem(drawingBox, 'drawingBox')
        // drawing box is registered in every child
        // needed to move children relatively to it
      }
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
    for (const itemName in this.zOrder) {
      if (this.zOrder.hasOwnProperty(itemName)) {
        if (this.zOrder[itemName] === -1) {
          this.group.getItem(item => item.name === itemName).sendToBack() // TODO does this modify z position or project hierarchy only (or are they the same thing ?)
        }
      }
    }
    for (const childGlyph of this.children) {
      if (childGlyph.drawn) {
        childGlyph.buildGroups()
      }
    }
  }

  registerItem (item, itemName) { //selectable = true) {
    // associate item unique id with a name that can be used to retrieve it
    // itemName should be lower case (as it's not used for display here)
    this.itemIds[itemName] = item.id
    this.drawnItems.add(itemName)
    item.name = itemName // assign name to item
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
    if (this.group) {
      let children = this.group.children
      let item = this.findItem(children, itemName)
      if (typeof item === 'undefined') {
        children = paper.project.layers[this.layer].children
        item = this.findItem(children, itemName)
      }
      if (typeof item === 'undefined') {
        throw new Error(`Either id or name did not match the tracked id (${this.itemIds[itemName]}) / name (${itemName})`)
      }
      item.remove()
    } else {
      console.warn(`No group for glyph ${itemName}`)
    }
    this.drawnItems.delete(itemName)
    delete this.zOrder[itemName]
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
    for (const element of this.glyphElements) {
      if (element.type === 'scale') {
        continue // no item to return for scale-type elements
      }
      let targetGlyph
      if (element.target === 'main' || element.target === this.shape) {
        targetGlyph = this
      } else if (searchChildren) {
        targetGlyph = this.children.find(glyph => glyph.shape === element.target)
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
    for (const childGlyph of this.children) {
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
      for (const childGlyph of this.children) {
        if (!childGlyph.drawn) {
          continue  // sometimes automatic update happens before added glyphs can be drawn
        }
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
    if (!this.drawn) { // TODO test
      return updated
    }
    let drawingBox
    let glyph = this
    while (!drawingBox) {
      // walk up to top parent and find drawing box
      // (this works in case children glyphs also have drawing boxes, but it currently has no use)
      try {
        drawingBox = glyph.getItem('drawingBox')
      } catch (e) {
        if (glyph.parent !== null) {
          glyph = glyph.parent
        } else {
          throw Error(`No drawingBox registered in top glyph '${glyph.name}'`)
        }
      }
    }
    if (drawingBox && this.drawn && (
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
    if (this.drawn) {  // if glyph is not drawn do not do anything
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
        group.bounds = new paper.Rectangle(
            this.box.bounds.x,
            this.box.bounds.y,
            this.box.bounds.width,
            this.box.bounds.height
        )
      }
      if (selector === 'all') {
        for (const glyph of this.children) {
          glyph.fitToBox('glyph')
        }
      }
    }
  }

  clear (layer = true) {
    if (this.parent === null && layer) { // if this is root glyph, clear layer
      paper.project.layers[this.layer].removeChildren()
      this.itemIds = {}
      this.drawnItems = new Set()
    } else {
      for (const itemName in this.itemIds) {
        if (this.itemIds.hasOwnProperty(itemName) && this.itemIds[itemName]) {
          if (itemName === 'drawingBox') {
            continue // don't delete drawing box used by parent and other children
          }
          this.deleteItem(itemName) // this should loop over children items as well (??)
        }
      }
    }
  }

  reset ({box = true, layer = true}) { // reset box to null and delete all paperjs items associated with glyph
    // NB reset does not reset the glyph parameters to defaults! If default parameters are needed a new glyph should be created
    if (box) {
      this.box = null
    }
    if (this.drawn) {
      this.clear(layer)
      this.drawn = false
      this.activateLayer()
      this.group = new paper.Group([]) // reset to empty group (needed for path methods to work on new glyph)
      for (const childGlyph of this.children) {
        childGlyph.reset({box, layer})
      }
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
    for (const element of glyph.constructor.elements) {
      if (element.type !== 'scale') { // scale elements don't have draw function
        this[`draw${glyph.name}${element.name}`] = glyph[`draw${element.name}`].bind(glyph) // drawElement method of child
      }
    }
  }

  getChild (childName, by='name') {
    const selector = (glyph) => by === 'name' ? glyph.name : glyph.shape
    if (selector(this) === childName) {
      return this
    }
    try {
      return this.children.find(childGlyph => selector(childGlyph) === childName)
    } catch (e) {
      throw Error(`Glyph ${this.name} has no children named '${childName}'`)
    }
  }

  deleteChild (childName) {
    let i
    for (i = 0; i < this.children.length; i++) {
      if (this.children[i].name === childName) {
        const child = this.children.splice(i, 1)[0]
        child.clear()
        for (const grandchild of child.children) {
          grandchild.clear()
        }
        child.children = []
        return
      }
    }
    throw Error(`Glyph ${this.name} has no children named '${childName}'`)
  }

  addShrinkRegrow (scaleFactor) {
    // scaleFactor must be less than 1
    const group = this.group
    const childrenGroups = this.children.map(glyph => glyph.group)
    group.scale(scaleFactor)
    for (const childGroup of childrenGroups) {
      childGroup.scale(scaleFactor)
    }
    // TODO can responsiveness be improved through hit-testing?
    // TODO can scale change be achieved gradually through tween() ?
    group.on({
      mouseenter: debounce.call(this, function () {
        if (!this.data.shrunk) {
          this.scale(1/scaleFactor)
          for (const group of childrenGroups) {
            group.scale(1/scaleFactor)
          }
          this.data.shrunk = true
        }
      }, 300),
      mouseleave: debounce.call(this, function () {
        setTimeout(function(this_) {
          if (this_.data.shrunk) {
            this_.scale(scaleFactor)
            for (const group of childrenGroups) {
              group.scale(scaleFactor)
            }
            this_.data.shrunk = false
          }
        }, 500, this)
      }, 1000)
    })
    this.animations.add('shrink-regrow')
    this.shirnkRegrowScaleFactor = scaleFactor // save for scaling glyphs up again!
  }

  removeShrinkRegrow () {
    this.group.off('mouseenter').off('mouseleave')
    this.animations.delete('shrink-regrow')
    const group = this.group
    const childrenGroups = this.children.map(glyph => glyph.group)
    group.scale(1/this.shirnkRegrowScaleFactor)
    for (const childGroup of childrenGroups) {
      childGroup.scale(1/this.shirnkRegrowScaleFactor)
    }
    this.shirnkRegrowScaleFactor = null
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
