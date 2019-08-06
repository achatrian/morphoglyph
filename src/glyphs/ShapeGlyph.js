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
      meshType: 'grid',
      patternSize: 5, // size of pattern elements in patterning
      patternType: 'circle',
      protrusionProportion: 0.1,
      protrusionBackgroundColor: '#F5F5F5',
      protrusionStrokeColor: '#212121',
      borderSymbolType: 'circle',
      borderSymbolSize: 10,
      maxNumBorderSymbols: 40
    }) {
    // constructor for standard PhenoPlot glyph
    super(layer, id, name, options)
    this.glyphElements = ShapeGlyph.elements
    this.itemIds = {
      ...this.itemIds,
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
        properties: {},
        target: 'main',
        subElements: []
      },
      {
        name: 'Width',
        type: 'scale',
        properties: {},
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
        name: 'Mesh',
        type: 'path',
        properties: {
          color: {range: [], step: []},
          size: {range: [0.3, 1.5], step: 0.3},
          mode: ['grid', 'vertical', 'horizontal', 'random']
        },
        target: 'main',
        subElements: []
      },
      {
        name: 'Decoration',
        type: 'path',
        properties: {
          color: {range: [], step: []},
          size: {range: [0.3, 1.5], step: 0.3},
          mode: ['circle', 'star', 'square']
        },
        target: 'main',
        subElements: []
      },
      {
        name: 'Protrusion',
        type: 'path',
        properties: {
          requiresTransform: true,
          color: {range: [], step: []},
          size: {range: [1, 20], step: 1}
        },
        target: 'main',
        subElements: []
      },
      {
        name: 'BorderSymbol',
        type: 'path',
        properties: {
          color: {range: [], step: []},
          size: {range: [1, 20], step: 1},
          mode: ['circle', 'star', 'square']
        },
        target: 'main',
        subElements: []
      },
    ]
  }

  draw (options) {
    super.draw(options) // box is also updated here
    const widthScaleOrder = options.scaleOrders.find(
        scaleOrder => scaleOrder.element === 'Width' && scaleOrder.shape === this.name
    )
    const heightScaleOrder = options.scaleOrders.find(
        scaleOrder => scaleOrder.element === 'Height' && scaleOrder.shape === this.name
    )
    if (widthScaleOrder) {
      this.box.resize(widthScaleOrder.value)
    }
    if (heightScaleOrder) {
      this.box.resize(1.0, heightScaleOrder.value)
    }
    const protrusionScaleOrder = options.scaleOrders.find(
        scaleOrder => scaleOrder.element === 'Protrusion' && scaleOrder.shape === this.name
    )
    if (protrusionScaleOrder) {
      this.box.shift(0, this.parameters.protrusionProportion, true)
    }
    let {shapeType} = options
    if (!shapeType) { shapeType = 'ellipse' }
    this.activateLayer()
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

  drawMembrane (membraneFraction, subElements) { // eslint-disable-line no-unused-vars
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
    this.registerItem(membranePath, 'membrane')
  }

  drawSpikes (spikeFraction, subElements) {
    let {spikeHeight, numPoints} = subElements
    if (typeof spikeHeight === 'undefined') { spikeHeight = this.parameters.spikeHeight }
    if (typeof numPoints === 'undefined') { numPoints = this.parameters.numPoints }
    let pathClone = this.cloneItem(this.constructor.shapes.main, numPoints)
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
    this.registerItem(spikePath, 'spikes')
  }

  drawMesh (density, subElements) { // eslint-disable-line no-unused-vars
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
    this.registerItem(mesh, 'mesh')
  }

  drawDecoration (fillingFraction, subElements) { // eslint-disable-line no-unused-vars
    // generate points where to draw pattern elements - use contains() to test whether point is inside the shape or not
    let possiblePoints = []
    const inMainOrProtrusion = (point, glyph) => {
      try {
        const protrusionPath = glyph.getItem('protrusion')
        return glyph.mainPath.contains(point) || protrusionPath.contains(point)
      } catch { // catching error in getItem if protrusion item is not defined
        return glyph.mainPath.contains(point)
      }
    }
    for (let x = this.box.drawingBounds.x; x < this.box.drawingBounds.x + this.box.drawingBounds.width; x += this.parameters.patternSize) {
      for (let y = this.box.drawingBounds.y; y < this.box.drawingBounds.y + this.box.drawingBounds.height; y += this.parameters.patternSize) {
        let possiblePoint = new paper.Point(x, y)
        let horVect = new paper.Point(this.parameters.patternSize/2, 0)
        let verVect = new paper.Point(0, this.parameters.patternSize/2)
        let containsExtremes = [ // + and - overloading for paper.Point is not working?
            inMainOrProtrusion(possiblePoint, this), // center
            inMainOrProtrusion(possiblePoint.add(horVect), this), // E
            !this.children.some(inMainOrProtrusion.bind(null, possiblePoint.add(horVect))), // E children
            inMainOrProtrusion(possiblePoint.add(horVect.negate()), this), // W
            !this.children.some(inMainOrProtrusion.bind(null, possiblePoint.add(horVect.negate()))), // W children
            inMainOrProtrusion(possiblePoint.add(verVect), this), // S
            !this.children.some(inMainOrProtrusion.bind(null, possiblePoint.add(verVect))), // S children
            inMainOrProtrusion(possiblePoint.add(verVect.negate()), this), // N
            !this.children.some(inMainOrProtrusion.bind(null, possiblePoint.add(verVect.negate()))) // N children
        ]
        if (containsExtremes.every(t => t)) {
          possiblePoints.push(possiblePoint) // FIXME nucleus bounds are as big as Cell
        }
      }
    }
    let decoration = []
    let decorationElement
    for (let i = 0; i < Math.ceil(possiblePoints.length * fillingFraction); i++) {
      switch (this.parameters.patternType) {
        case 'circle':
           decorationElement = new paper.Path.Circle(
              possiblePoints[i],
              0.8 * this.parameters.patternSize/2
          )
          break
        case 'star':
          decorationElement = new paper.Path.Star(
              possiblePoints[i],
              5,
              0.5 * this.parameters.patternSize/2,
              0.8 * this.parameters.patternSize/2
          )
          break
        case 'square':
          decorationElement = new paper.Path.Rectangle(
              possiblePoints[i],
              new paper.Size(0.8 * this.parameters.patternSize/2,0.8 * this.parameters.patternSize/2)
          )
          break
      }
      decorationElement.fillColor = this.parameters.secondaryColor
      decorationElement.visible = true
      decoration.push(decorationElement)
    }
    const decorationGroup = new paper.Group(decoration)
    decorationGroup.name = 'DecorationGroup'
    decorationGroup.bringToFront()
    this.registerItem(decorationGroup, 'decoration')
  }

  drawProtrusion (protrusionFraction, subElements) { // eslint-disable-line no-unused-vars
    let protrusionPath = this.cloneItem(this.constructor.shapes.main, this.parameters.numPoints)
    const upperEmptySpace = this.box.bounds.top - this.box.drawingBounds.top
    for (let i = 0; i < protrusionPath.segments.length; i++) {
      if (protrusionPath.segments[i].point.y < this.mainPath.position.y) {
        // shift up points in upper half of main path's clone - NB (y increases going down in screen)
        //protrusionPath.segments[i].point.y -= protrusionPath.segments[i].point.y * protrusionFraction
        protrusionPath.segments[i].point.y -= upperEmptySpace * protrusionFraction
      }
    }
    Object.assign(protrusionPath, {
      strokeWidth: this.parameters.strokeWidth,
      strokeColor: this.parameters.protrusionStrokeColor,
      fillColor: this.parameters.protrusionBackgroundColor,
      visible: true,
      closed: true
    })
    protrusionPath.sendToBack() // not maintained when building group
    this.zOrder['protrusion'] = -1
    this.registerItem(protrusionPath, 'protrusion')
  }

  drawBorderSymbol (borderFraction, subElements) {// eslint-disable-line no-unused-vars
    for (let i = 0; i < Math.ceil(this.parameters.maxNumBorderSymbols * borderFraction); i++) {
      let symbolPosition = this.mainPath.getPointAt(this.mainPath.length * (1 - i / this.parameters.maxNumBorderSymbols))
      let borderSymbol
      switch (this.parameters.borderSymbolType) {
        case 'circle':
          borderSymbol = new paper.Path.Circle(
              symbolPosition,
              0.8 * this.parameters.borderSymbolSize/2
          )
          break
        case 'star':
          borderSymbol = new paper.Path.Star(
              symbolPosition,
              5,
              0.5 * this.parameters.borderSymbolSize/2,
              0.8 * this.parameters.borderSymbolSize/2
          )
          break
        case 'square':
          borderSymbol = new paper.Path.Rectangle(
              symbolPosition,
              new paper.Size(0.8 * this.parameters.borderSymbolSize/2,
                  0.8 * this.parameters.borderSymbolSize/2)
          )
          break
      }
      borderSymbol.fillColor = this.parameters.lightColor
      borderSymbol.strokeColor = this.parameters.strokeColor
    }
  }
}

export default ShapeGlyph
