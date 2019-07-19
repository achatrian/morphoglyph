import ShapeGlyph from './ShapeGlyph'
/* Subclasses should contain rules to draw specific glyphs, while basegraph handles logistic of drawing and tracking */

class CellGlyph extends ShapeGlyph {
  constructor (
    layer,
    id,
    name = '',
    options = {
      ...CellGlyph.baseOptions(),
      membraneFraction: 0.5,
      membraneSize: '',
      numPoints: 300,
      spikeHeight: 0.3,
      meshType: 'grid'
    }) {
    super(layer, id, name, options)
    this.glyphElements = CellGlyph.elements
    this.pathIds = {
      ...this.pathIds,
      membrane: null,
      spikes: null,
      protrusion: null,
      mesh: null
    }
  }

  static get type () {
    return "CellGlyph"
  }

  static get settings () {
    return {name: 'drawNucleus', message: 'Draw nucleus', options: ['Yes', 'No']}
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
    options.shapeType = 'ellipse' // Fixed elliptic shape for cell and nucleus glyphs
    super.draw(options)
    this.activateLayer()
    if (options.drawNucleus) {
      // draw nucleus
      // options.shapePositions.nucleus = {
      //   topShift: 1 / 4, // upper left corner of child's bounding box is shifted down by one fourth of the box height
      //   leftShift: 1 / 4, // upper left corner of child's bounding box is shifted right by one fourth of the box width
      //   widthProportion: 1 / 2, // width of child's bounding box is half that of the full box
      //   heightProportion: 1 / 2 // height of child's bounding box is half that of the full box
      // }
      this.box = this.getDrawingBox(options) // update box info
      const nucleusOptions = {
        backend: 'paper',
        strokeColor: '#283593',
        primaryColor: '#AB47BC',
        secondaryColor: '#D4E157',
        lightColor: '#1E88E5',
        darkColor: '#66BB6A',
        strokeWidth: 2,
        thickPathSize: 7,
        narrowPathSize: 4,
        numSides: 6, // for RegularPolygon: defaults to hexagon
        numPoints: 250, // for drawing Membrane and Spikes
        spikeHeight: 0.3,
        meshType: 'grid'
      }
      const nucleus = new ShapeGlyph(this.layer, '0', 'Nucleus', nucleusOptions, this)
      nucleus.draw(options)
      this.registerChild(nucleus)
    }
  }
}

export default CellGlyph
