import BaseGlyph from './BaseGlyph'
import paper from 'paper'
/* Subclasses should contain rules to draw specific glyphs, while basegraph handles logistic of drawing and tracking */

/* Simple glyph implementing paper.Path closed paths as main path */
class ShapeGlyph extends BaseGlyph {
  constructor (
    layer,
    id,
    name = '',
    options = {
      ...ShapeGlyph.baseOptions(),
      numSides: 6, // for RegularPolygon: defaults to hexagon
      numPoints: 250, // for drawing Membrane and Spikes
      spikeHeight: 0.3,
      meshType: 'grid'
    }) {
    // constructor for standard PhenoPlot glyph
    super(layer, id, name, options)
    this.glyphElements = ShapeGlyph.elements
    this.pathIds = {
      ...this.pathIds,
      membrane: null,
      spikes: null,
      protrusion: null,
      mesh: null
    }
  }

  static get type () {
    return "ShapeGlyph"
  }

  static get settings () {
    return {
      name: 'shapeType', // NB case sensitive
      message: 'Select glyph shape',
      options: ['ellipse', 'rectangle', 'circle', 'regularPolygon']
    }
  }

  static get shapes () {
    return {main: 'main', children: []}
  }

  static get elements () {
    return [
      {
        name: 'Height',
        type: 'scale',
        properties: [],
        target: 'main',
        subElements: []
      },
      {
        name: 'Width',
        type: 'scale',
        properties: [],
        target: 'main',
        subElements: []
      },
      {
        name: 'Membrane',
        type: 'path',
        properties: {
          color: {range: [], step: []},
          size: {range: [1, 30], step: 1}
        },
        target: 'main',
        subElements: []
      },
      {
        name: 'Spikes',
        type: 'path',
        properties: {
          color: {range: [], step: []},
          size: {range: [1, 15], step: 1}
        },
        target: 'main',
        subElements: ['SpikeHeight', 'NumberOfPoints']
      },
      {
        name: 'Protrusion',
        type: 'path',
        properties: {
          color: {range: [], step: []},
          size: {range: [1, 20], step: 1}
        },
        target: 'main',
        subElements: []
      },
      {
        name: 'Mesh',
        type: 'path',
        properties: {
          color: {range: [], step: []},
          size: {range: [0.3, 1.5], step: 0.3}
        },
        target: 'main',
        subElements: []
      }
    ]
  }

  draw (options) {
    let {shapeType} = options
    if (typeof shapeType === 'undefined') { shapeType = 'ellipse' }
    this.activateLayer()
    super.draw(options)
    let path // declare here so that it can be initialized inside switch
    switch (shapeType) {
      case 'ellipse':
        path = new paper.Path.Ellipse({
          center: [this.box.center.x, this.box.center.y],
          size: [this.box.bounds.width, this.box.bounds.height],
          strokeColor: this.parameters.strokeColor,
          fillColor: this.parameters.lightColor,
          strokeWidth: this.parameters.strokeWidth
        })
        break
      case 'rectangle':
        path = new paper.Path.Rectangle({
          center: [this.box.center.x, this.box.center.y],
          size: [this.box.bounds.width, this.box.bounds.height],
          strokeColor: this.parameters.strokeColor,
          fillColor: this.parameters.lightColor,
          strokeWidth: this.parameters.strokeWidth
        })
        break
      case 'circle':
        path = new paper.Path.Circle({
          center: [this.box.center.x, this.box.center.y],
          radius: Math.min(this.box.bounds.width, this.box.bounds.height),
          strokeColor: this.parameters.strokeColor,
          fillColor: this.parameters.lightColor,
          strokeWidth: this.parameters.strokeWidth
        })
        break
      case 'regularPolygon':
        path = new paper.Path.RegularPolygon({
          center: [this.box.center.x, this.box.center.y],
          sides: this.numSides,
          radius: Math.min(this.box.bounds.width, this.box.bounds.height),
          strokeColor: this.parameters.strokeColor,
          fillColor: this.parameters.lightColor,
          strokeWidth: this.parameters.strokeWidth
        })
        break
      default:
        throw Error(`Unknown shape type '${shapeType}'`)
    }
    this.mainPath = path // uses setter that store id rather than storing a pointer to the path, which breaks vue reactivity
  }

  drawMembrane (membraneFraction, subElements) {
    /* Draws a thicker membrane */
    if (!(membraneFraction >= 0.0 || membraneFraction <= 1.0)) {
      throw Error(`Invalid membrane fraction ${membraneFraction}, it must be in [0, 1] (`)
    }
    this.activateLayer()
    // TODO delete previous membrane path and update reference index
    // create new open path
    let membranePath = new paper.Path()
    for (let i = 0; i < Math.floor(this.parameters.numPoints * membraneFraction); i++) {
      membranePath.add(this.mainPath.getLocationAt(this.mainPath.length * (1 - i / this.parameters.numPoints)))
    }
    membranePath.strokeColor = this.parameters.primaryColor
    membranePath.strokeWidth = this.parameters.thickPathSize
    this.registerPath(membranePath, 'membrane')
  }

  drawSpikes (spikeFraction, subElements) {
    let {spikeHeight, numPoints} = subElements
    if (typeof spikeHeight === 'undefined') { spikeHeight = this.parameters.spikeHeight }
    if (typeof numPoints === 'undefined') { numPoints = this.parameters.numPoints }
    let pathClone = this.clonePath('main', numPoints)
    pathClone.visible = false
    let n = Math.floor(pathClone.segments.length * spikeFraction)
    let spikePath = new paper.Path()
    for (let i = 0; i < n; i++) {
      let offset = [0, 0]
      let dirX = pathClone.segments[i].point.x - this.mainPath.position.x
      let dirY = pathClone.segments[i].point.y - this.mainPath.position.y
      if (i % 2 === 1 && i !== (n - 1)) {
        offset[0] = dirX * spikeHeight
        offset[1] = dirY * spikeHeight
      } else if (i > 0 && i < numPoints - 1) {
        offset = [offset[0] * 0.35, offset[1] * 0.35]
      }
      let newPoint = new paper.Point(pathClone.segments[i].point.x + offset[0],
        pathClone.segments[i].point.y + offset[1])
      spikePath.add(newPoint)
    }
    spikePath.strokeColor = this.parameters.secondaryColor
    spikePath.strokeWidth = this.parameters.narrowPathSize
    this.registerPath(spikePath, 'spikes')
  }

  drawProtrusion (protrusionFraction, subElements) {
    let protrusionPath = this.clonePath('main', this.parameters.numPoints)
    for (let i = 0; i < protrusionPath.segments.length; i++) {
      if (protrusionPath.segments[i].point.y < this.mainPath.position.y) {
        protrusionPath.segments[i].point.y = protrusionPath.segments[i].point.y * (1 - protrusionFraction)
      }
    }
    protrusionPath.strokeWidth = this.parameters.strokeWidth
    protrusionPath.strokeColor = this.parameters.strokeColor
    protrusionPath.fillColor = this.parameters.lightColor
    protrusionPath.visible = true
    protrusionPath.closed = true
    protrusionPath.insertBelow(this.mainPath) // inserts in mainPath's background
  }

  drawMesh (density, subElements) {
    let numLines = Math.floor(2 * Math.exp(3 * density)) // density used to scale thickness of grid
    let lines = []
    let spacing
    // vertical mesh
    for (let i = 0; i < numLines; i++) {
      switch (this.parameters.meshType) {
        case 'grid':
        case 'vertical':
          spacing = (this.mainPath.bounds.right - this.mainPath.bounds.left) / numLines
          lines.push(new paper.Path.Line(
            new paper.Point(this.mainPath.bounds.left + (i + 0.5) * spacing, this.mainPath.bounds.top),
            new paper.Point(this.mainPath.bounds.left + (i + 0.5) * spacing, this.mainPath.bounds.bottom)
          ))
          if (this.parameters.meshType !== 'grid') {
            break // otherwise do horizontal as well
          }
        // eslint-disable-line no-fallthrough
        case 'horizontal': // fallthrough when doing grid
          spacing = (this.mainPath.bounds.bottom - this.mainPath.bounds.top) / numLines
          lines.push(new paper.Path.Line(
            new paper.Point(this.mainPath.bounds.left, this.mainPath.bounds.top + (i + 0.5) * spacing),
            new paper.Point(this.mainPath.bounds.right, this.mainPath.bounds.top + (i + 0.5) * spacing)
          ))
          break
        case 'random':
          throw Error("Random grid not implemented")
        // break
        default:
          throw Error(`Unknown mesh type ${this.parameters.meshType}`)
      }
    }
    let mesh = new paper.Group([])
    for (let line of lines) {
      let intersections = line.getIntersections(this.mainPath)
      // debug - show intersections
      for (let i = 0; i + 1 < intersections.length; i = i + 2) {
        mesh.addChild(paper.Path.Line(intersections[i].point, intersections[i + 1].point))
      }
    }
    mesh.strokeColor = this.parameters.darkColor
    mesh.strokeWidth = this.parameters.strokeWidth
    mesh.bringToFront()
    this.registerPath(mesh, 'mesh')
  }
}

export default ShapeGlyph
