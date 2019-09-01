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
      numPoints: 200,
      spikeHeight: 0.3,
      meshType: 'grid',
      spikeSize: 0.4,
      decorationSize: 5, // size of pattern elements in patterning
      decorationType: 'circle',
      protrusionProportion: 0.15,
      protrusionBackgroundColor: '#F5F5F5',
      protrusionStrokeColor: '#212121',
      islandsType: 'circle',
      islandsSize: 10,
      maxNumIslands: 55
    }) {
    super(layer, id, name, options)
    this.glyphElements = CellGlyph.elements
    this.itemIds = {
      ...this.itemIds,
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
    return {
        name: 'shapeType', // NB case sensitive
        message: 'Select glyph shape',
        options: ['ellipse', 'rectangle', 'circle', 'regularPolygon', 'customShape']
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
    const nucleusOptions = {
      backend: 'paper',
      strokeColor: '#283593',
      primaryColor: '#AB47BC',
      secondaryColor: '#D4E157',
      lightColor: '#1E88E5',
      darkColor: '#B71C1C',
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
    const shiftToMainCenter = this.box.shapePositions.topShift + this.box.shapePositions.heightProportion / 2 -
        nucleus.box.shapePositions.heightProportion / 2 - nucleus.box.shapePositions.topShift
    nucleus.box.shift(null, shiftToMainCenter, {setValues: false, drawing: true, scale: false, children: false})
    nucleus.fitToBox('glyph')
    this.registerChild(nucleus)
  }
}

export default CellGlyph
