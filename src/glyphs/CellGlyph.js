import ShapeGlyph from './ShapeGlyph'
/* Subclasses should contain rules to draw specific glyphs, while basegraph handles logistic of drawing and tracking */

class CellGlyph extends ShapeGlyph {
  constructor (
    layer,
    id,
    name = '',
    options = CellGlyph.shapeOptions(),
    parent = null
  ) {
    super(layer, id, name, options, parent)
    this.glyphElements = CellGlyph.elements
    this.itemIds = {
      ...this.itemIds,
      membrane: null,
      spikes: null,
      protrusion: null,
      mesh: null
    }
    // make nucleus glyph
    const nucleusOptions = CellGlyph.shapeOptions()
    Object.assign(nucleusOptions, {
      strokeColor: '#283593',
      primaryColor: '#AB47BC',
      secondaryColor: '#D4E157',
      lightColor: '#1E88E5',
      darkColor: '#B71C1C',
      membraneStrokeColor: '#AB47BC',
      spikesStrokeColor: '#D4E157',
      islandsSize: 5,
      maxNumIslands: 20
    })
    const nucleus = new ShapeGlyph(this.layer, id, name + ' Nucleus', nucleusOptions, this)
    this.registerChild(nucleus)
  }

  static get type () {
    return "CellGlyph"
  }

  static get settings () {
    return {
        name: 'shapeType', // NB case sensitive
        message: 'Select glyph shape',
        options: ['ellipse', 'rectangle', 'circle', 'regularPolygon', 'custom'],
        default: 'ellipse'
    }
  }

  static get shapes () {
    return {main: 'Cell', children: ['Nucleus']}
  }

  static get elements () {
    // cell elements (same as shape glyph)
    let elements = []
    for (let element of ShapeGlyph.elements) {
      element.target = 'Cell'
      elements.push(element)
    }
    // nuclear elements
    for (let element of ShapeGlyph.elements) {
      element.target = 'Nucleus'
      elements.push(element)
    }
    return elements
  }

  draw (options) {
    super.draw(options) // draws cell
    const nucleus = this.children[0]
    nucleus.draw(Object.assign(options, {shapeType: 'ellipse'}))
    // if no scale orders are given for the nucleus, it's scaled to fit inside the cell box
    if (!options.scaleOrders.some(scaleOrder => scaleOrder.element === 'Width' && scaleOrder.shape === 'Nucleus')) {
        const cellWidthOrder = options.scaleOrders.find(scaleOrder => scaleOrder.element === 'Width' &&
            scaleOrder.shape === 'Cell')
        if (cellWidthOrder) {
          nucleus.box.resize(Math.max(cellWidthOrder.value - 0.1, 0.1),
              null, {drawing: true, center: true, children: true})
        } else {
          nucleus.box.resize(0.5, null, {drawing: true, center: true, children: true})
        }
    }
    if (!options.scaleOrders.some(scaleOrder => scaleOrder.element === 'Height' && scaleOrder.shape === 'Nucleus')) {
        const cellHeightOrder = options.scaleOrders.find(scaleOrder => scaleOrder.element === 'Height' &&
            scaleOrder.shape === 'Cell')
        if (cellHeightOrder) {
            nucleus.box.resize(null, Math.max(cellHeightOrder.value - 0.3, 0.1),
                {drawing: true, center: true, children: true})
        } else {
            nucleus.box.resize(null, 0.5, {drawing: true, center: true, children: true})
        }
    }
    const shiftToMainCenter = this.box.shapePositions.topShift + this.box.shapePositions.heightProportion / 2 -
        nucleus.box.shapePositions.heightProportion / 2 - nucleus.box.shapePositions.topShift
    nucleus.box.shift(null, shiftToMainCenter, {setValues: false, drawing: true, scale: false, children: false})
    nucleus.fitToBox('glyph')
  }
}

export default CellGlyph
