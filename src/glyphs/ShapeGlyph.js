import BaseGlyph from './BaseGlyph'
import paper from 'paper'
/* Subclasses should contain rules to draw specific glyphs, while basegraph handles logistic of drawing and tracking */


/* Simple glyph implementing paper.Path closed paths as main path */
class ShapeGlyph extends BaseGlyph {

  static shapeParameters () {
    const {lightColor, darkColor, primaryColor, secondaryColor, strokeColor} = ShapeGlyph.baseParameters()
    return {
      ...ShapeGlyph.baseParameters(),
      shapeType: 'ellipse',
      shapeColor: lightColor,
      originalFillColor: lightColor,
      originalStrokeColor: strokeColor,
      numSides: 6, // for RegularPolygon: defaults to hexagon
      numPoints: 150, // for drawing Border and Spikes
      borderStrokeColor: primaryColor,
      borderStrokeWidth: 5,
      spikeHeight: 0.12 ,
      spikesStrokeWidth: 0.4,
      spikesStrokeColor: secondaryColor,
      meshMode: 'grid',
      meshStrokeColor: darkColor,
      meshStrokeWidth: 1,
      decorationSize: 5, // size of pattern elements in patterning
      decorationMode: 'circle',
      decorationFillColor: secondaryColor,
      extensionProportion: 0.15,
      extensionBackgroundColor: '#F5F5F5',
      extensionStrokeColor: '#212121',
      islandsMode: 'circle',
      islandsSize: 10,
      islandsStrokeColor: secondaryColor,
      maxNumIslands: 20
    }
  }

  constructor(
      layer,
      id,
      name = '',
      parameters = ShapeGlyph.shapeParameters(),
      parent = null) {
    // constructor for standard PhenoPlot glyph
    super(layer, id, name, parameters, parent)
    this.glyphElements = ShapeGlyph.elements
    this.itemIds = {
      ...this.itemIds,
      border: null,
      spikes: null,
      extension: null,
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
      options: ['ellipse', 'rectangle', 'circle', 'regularPolygon', 'custom'],
      default: 'ellipse'
    }
  }

  static get shapes () {
    return {main: 'main', children: [], all: ['main']}
  }

  static get elements () {
    /*Description of element properties
    * fillColor: if true, color picker changes fillColor besides changing the stroke color
    *
    * */
    return [
      {
        name: 'Height',
        type: 'scale',
        properties: {direction: 'vertical'},
        target: 'main',
        subElements: []
      },
      {
        name: 'Width',
        type: 'scale',
        properties: {direction: 'horizontal'},
        target: 'main',
        subElements: []
      },
      {
        name: 'Border',
        type: 'path',
        properties: {
          color: {range: [], step: [], fillColor: false},
          size: {range: [1, 30], step: 1}
        },
        target: 'main',
        subElements: []
      },
      {
        name: 'Spikes',
        type: 'path',
        properties: {
          color: {range: [], step: [], fillColor: false},
          size: {range: [0.4, 2], step: 0.2}
        },
        target: 'main',
        subElements: ['SpikeHeight', 'NumberOfPoints']
      },
      {
        name: 'Mesh',
        type: 'path',
        properties: {
          color: {range: [], step: [], fillColor: false},
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
          color: {range: [], step: [], fillColor: true},
          size: {range: [0.3, 1.5], step: 0.3},
          mode: ['circle', 'star', 'square', 'dash', 'line']
        },
        target: 'main',
        subElements: []
      },
      {
        name: 'Extension',
        type: 'path',
        properties: {
          requiresTransform: true, // used to send scale orders into glyph as drawing options
          priority: 1, // elements are drawn according to their priority value in decreasing order (default is 0)
          color: {range: [], step: [], fillColor: false},
          size: {range: [1, 20], step: 1}
        },
        target: 'main',
        subElements: []
      },
      {
        name: 'Islands', // previously BorderSymbol
        type: 'path',
        properties: {
          color: {range: [], step: [], fillColor: false},
          size: {range: [0.3, 2], step: 0.3},
          mode: ['circle', 'star', 'square']
        },
        target: 'main',
        subElements: []
      },
      {
        name: 'Shade',
        type: 'color',  // no special provisions for the 'color' type of element have been taken so far
        properties: {},
        target: 'main',
        subElements: []
      }
    ]
  }

  draw (options) {
    super.draw(options) // box is also updated here
    const widthScaleOrder = options.scaleOrders.find(
        scaleOrder => scaleOrder.element === 'Width' && scaleOrder.shape === this.shape
    )
    const heightScaleOrder = options.scaleOrders.find(
        scaleOrder => scaleOrder.element === 'Height' && scaleOrder.shape === this.shape
    )
    if (widthScaleOrder) {
      // drawing option must be set to true for box to remember to reapply this transforms when shape positions is reset
      this.box.resize(widthScaleOrder.value, null, {drawing: true, center: true, children: true})
    }
    if (heightScaleOrder) {
      this.box.resize(null, heightScaleOrder.value, {drawing: true, center: true, children: true})
    }
    const extensionScaleOrder = options.scaleOrders.find(
        scaleOrder => scaleOrder.element === 'Extension' && scaleOrder.shape === this.shape
    )
    if (extensionScaleOrder) {
      this.box.shift(null, this.parameters.extensionProportion, {drawing: true, scale: true, children: true})
    }
    this.drawOptions = options // update drawOptions !
    this.activateLayer()
    let path // declare here so that it can be initialized inside switch
    switch (this.parameters.shapeType) {
      case 'custom':
        if (options.shapeJSONs.length > 0) {
          // create empty path and import JSON into it, then
          path = new paper.Path()
          path.importJSON(options.shapeJSONs[0]) // only one shape per glyph should be passed
          path.translate(new paper.Point(
              this.box.center.x - path.bounds.center.x,
              this.box.center.y - path.bounds.center.y
          ))
          path.scale(
              this.box.bounds.width / path.bounds.width,
              this.box.bounds.height / path.bounds.height
          )
          Object.assign(path, {
            strokeColor: this.parameters.strokeColor,
            fillColor: this.parameters.lightColor,
            strokeWidth: this.parameters.strokeWidth
          })
          break
        } // if no shapes are given, falls through to ellipse drawing
      /* eslint-disable-next-line no-fallthrough */
      case 'ellipse':
        path = new paper.Path.Ellipse({
          center: [this.box.center.x, this.box.center.y],
          size: [this.box.bounds.width, this.box.bounds.height],
          strokeColor: this.parameters.strokeColor,
          fillColor: this.parameters.shapeColor,
          strokeWidth: this.parameters.strokeWidth
        })
        break
      case 'rectangle':
        path = new paper.Path.Rectangle({
          center: [this.box.center.x, this.box.center.y],
          size: [this.box.bounds.width, this.box.bounds.height],
          strokeColor: this.parameters.strokeColor,
          fillColor: this.parameters.shapeColor,
          strokeWidth: this.parameters.strokeWidth
        })
        break
      case 'circle':
        path = new paper.Path.Circle({
          center: [this.box.center.x, this.box.center.y],
          radius: Math.min(this.box.bounds.width, this.box.bounds.height),
          strokeColor: this.parameters.strokeColor,
          fillColor: this.parameters.shapeColor,
          strokeWidth: this.parameters.strokeWidth
        })
        break
      case 'regularPolygon':
        path = new paper.Path.RegularPolygon({
          center: [this.box.center.x, this.box.center.y],
          sides: this.numSides,
          radius: Math.min(this.box.bounds.width, this.box.bounds.height),
          strokeColor: this.parameters.strokeColor,
          fillColor: this.parameters.shapeColor,
          strokeWidth: this.parameters.strokeWidth
        })
        break
      default:
        throw Error(`Unknown shape type '${this.parameters.shapeType}'`)
    }
    this.mainPath = path // uses setter that store id rather than storing a pointer to the path, which breaks vue reactivity
  }

  get outerPath () { // outer path where elements are drawn onto
    let outerPath
    try {
      outerPath = this.getItem('extension')
    } catch {
      outerPath = this.mainPath
    }
    return outerPath
  }

  drawHeight(heightProportion) {
    this.box.resize(null, heightProportion, {setValues: true, drawing: false, center: true, children: false, redraw: false})
    this.fitToBox()
  }

  drawWidth(widthProportion) {
    this.box.resize(widthProportion, null, {setValues: true, drawing: false, center: true, children: false, redraw: false})
    this.fitToBox()
  }

  drawBorder (borderProportion, subElements) { // eslint-disable-line no-unused-vars
    /* Draws a thicker border */
    if (!(borderProportion >= 0.0 || borderProportion <= 1.0)) {
      throw Error(`Invalid border proportion ${borderProportion}, it must be in [0, 1] (`)
    }
    this.activateLayer()
    // create new open path
    let borderPath = new paper.Path()
    const outerPath = this.outerPath
    for (let i = 0; i < Math.floor(this.parameters.numPoints * borderProportion); i++) {
      borderPath.add(outerPath.getLocationAt(outerPath.length * (1 - i / this.parameters.numPoints)))
    }
    borderPath.strokeColor = this.parameters.borderStrokeColor
    borderPath.strokeWidth = this.parameters.borderStrokeWidth
    borderPath.fillColor = null
    this.registerItem(borderPath, 'border')
  }

  drawSpikes (spikeProportion, subElements = {}) {
    let {spikeHeight, numPoints} = subElements // FIXME unused
    if (typeof spikeHeight === 'undefined') { spikeHeight = this.parameters.spikeHeight }
    if (typeof numPoints === 'undefined') { numPoints = this.parameters.numPoints }
    let pathClone = this.cloneItem('outer', numPoints)
    pathClone.visible = false
    let n = Math.floor(pathClone.segments.length * spikeProportion)
    let spikePath = new paper.Path()
    for (let i = 0; i < n; i++) {
      let offset = [0, 0]
      const dirX = pathClone.segments[i].point.x - this.outerPath.position.x
      const dirY = pathClone.segments[i].point.y - this.outerPath.position.y
      if (i % 2 === 1 && i !== (n - 1)) {
        offset[0] = dirX * spikeHeight
        offset[1] = dirY * spikeHeight
      } else if (i > 0 && i < numPoints - 1) {
        offset = [offset[0] * 0.35, offset[1] * 0.35]
      }
      const newPoint = new paper.Point(pathClone.segments[i].point.x + offset[0],
        pathClone.segments[i].point.y + offset[1])
      spikePath.add(newPoint)
    }
    spikePath.strokeColor = this.parameters.spikesStrokeColor
    spikePath.strokeWidth = this.parameters.spikesStrokeWidth
    spikePath.fillColor = null
    this.registerItem(spikePath, 'spikes')
  }

  drawMesh (density, subElements) { // eslint-disable-line no-unused-vars
    let numLines = Math.floor(2 * Math.exp(3 * density)) // density used to scale thickness of grid
    let lines = []
    let spacing
    // vertical mesh
    for (let i = 0; i < numLines; i++) {
      switch (this.parameters.meshMode) {
        case 'grid':
        case 'vertical':
          spacing = (this.mainPath.bounds.right - this.mainPath.bounds.left) / numLines
          lines.push(new paper.Path.Line(
            new paper.Point(this.outerPath.bounds.left + (i + 0.5) * spacing, this.outerPath.bounds.top),
            new paper.Point(this.outerPath.bounds.left + (i + 0.5) * spacing, this.outerPath.bounds.bottom)
          ))
          if (this.parameters.meshMode !== 'grid') {
            break // otherwise do horizontal as well
          }
        // eslint-disable-line no-fallthrough
        case 'horizontal': // fallthrough when doing grid
          spacing = (this.outerPath.bounds.bottom - this.outerPath.bounds.top) / numLines
          lines.push(new paper.Path.Line(
            new paper.Point(this.outerPath.bounds.left, this.outerPath.bounds.top + (i + 0.5) * spacing),
            new paper.Point(this.outerPath.bounds.right, this.outerPath.bounds.top + (i + 0.5) * spacing)
          ))
          break
        case 'random':
          throw Error("Random grid not implemented")
        // break
        default:
          throw Error(`Unknown mesh type ${this.parameters.meshMode}`)
      }
    }
    let mesh = new paper.Group([])
    for (const line of lines) {
      let intersections = line.getIntersections(this.outerPath)
      // debug - show intersections
      for (let i = 0; i + 1 < intersections.length; i = i + 2) {
        mesh.addChild(paper.Path.Line(intersections[i].point, intersections[i + 1].point))
      }
    }
    mesh.strokeColor = this.parameters.meshStrokeColor
    mesh.strokeWidth = this.parameters.meshStrokeWidth
    mesh.bringToFront()
    this.registerItem(mesh, 'mesh')
  }

  drawDecoration (fillingProportion, subElements) { // eslint-disable-line no-unused-vars
    // generate points where to draw pattern elements - use contains() to test whether point is inside the shape or not
    let possiblePoints = []
    const outerPath = this.outerPath
    for (let x = this.box.drawingBounds.x; x < this.box.drawingBounds.x + this.box.drawingBounds.width; x += this.parameters.decorationSize) {
      for (let y = this.box.drawingBounds.y; y < this.box.drawingBounds.y + this.box.drawingBounds.height; y += this.parameters.decorationSize) {
        const possiblePoint = new paper.Point(x, y)
        const horVect = new paper.Point(this.parameters.decorationSize/2, 0)
        const verVect = new paper.Point(0, this.parameters.decorationSize/2)
        const containsExtremes = [ // + and - overloading for paper.Point is not working?
            outerPath.contains(possiblePoint), // center
            outerPath.contains(possiblePoint.add(horVect)), // E
            !this.children.some(child => child.outerPath.contains(possiblePoint.add(horVect))), // E children
            outerPath.contains(possiblePoint.add(horVect.negate())), // W
            !this.children.some(child => child.outerPath.contains(possiblePoint.add(horVect.negate()))), // W children
            outerPath.contains(possiblePoint.add(verVect)), // S
            !this.children.some(child => child.outerPath.contains(possiblePoint.add(verVect))), // S children
            outerPath.contains(possiblePoint.add(verVect.negate())), // N
            !this.children.some(child => child.outerPath.contains(possiblePoint.add(verVect.negate()))) // N children
        ]
        if (containsExtremes.every(t => t)) {
          possiblePoints.push(possiblePoint) // FIXME nucleus bounds are as big as Cell
        }
      }
    }
    let decoration = []
    let decorationElement
    for (let i = 0; i < Math.ceil(possiblePoints.length * fillingProportion); i++) {
      switch (this.parameters.decorationMode) {
        case 'circle':
           decorationElement = new paper.Path.Circle(
              possiblePoints[i],
              0.8 * this.parameters.decorationSize/2
          )
          break
        case 'star':
          decorationElement = new paper.Path.Star(
              possiblePoints[i],
              5,
              0.5 * this.parameters.decorationSize/2,
              0.8 * this.parameters.decorationSize/2
          )
          break
        case 'square':
          decorationElement = new paper.Path.Rectangle(
              possiblePoints[i].subtract(new paper.Point(
                  0.8 * this.parameters.decorationSize/4,
              0.8 * this.parameters.decorationSize/4
              )),
              new paper.Size(0.8 * this.parameters.decorationSize/2,0.8 * this.parameters.decorationSize/2)
          )
          break
        case 'dash':
          decorationElement = new paper.Path.Line({
            from: possiblePoints[i].subtract(new paper.Point(this.parameters.decorationSize/4, 0)),
            to: possiblePoints[i].add(new paper.Point(this.parameters.decorationSize/4, 0)),
            strokeWidth: Math.max(this.parameters.decorationSize/8, 1),
            strokeColor: this.parameters.decorationFillColor
          })
          break
        case 'line':
          decorationElement = new paper.Path.Line({
            from: possiblePoints[i].subtract(new paper.Point(0, this.parameters.decorationSize/4)),
            to: possiblePoints[i].add(new paper.Point(0, this.parameters.decorationSize/4)),
            strokeWidth: Math.max(this.parameters.decorationSize/8, 1),
            strokeColor: this.parameters.decorationFillColor
          })
          break
      }
      decorationElement.fillColor = this.parameters.decorationFillColor
      decorationElement.visible = true
      decoration.push(decorationElement)
    }
    const decorationGroup = new paper.Group(decoration)
    decorationGroup.bringToFront()
    this.registerItem(decorationGroup, 'decoration')
  }

  drawExtension (extensionProportion, subElements) { // eslint-disable-line no-unused-vars
    let extrusionPath = this.cloneItem(this.name, this.parameters.numPoints)
    // compute min space available to draw extension. This corresponds to glyph with the same height as the box's height
    // this glyph will touch the lower boundary of the drawing box after being shifted and scaled.
    const upperEmptySpace = this.box.drawingBounds.height * this.parameters.extensionProportion
    for (let i = 0; i < extrusionPath.segments.length; i++) {
      if (extrusionPath.segments[i].point.y < this.mainPath.position.y) {
        // shift up points in upper half of main path's clone - NB (y increases going down in screen)
        //extensionPath.segments[i].point.y -= extensionPath.segments[i].point.y * extensionProportion
        extrusionPath.segments[i].point.y -= upperEmptySpace * extensionProportion
      }
    }
    const originalPath = this.cloneItem(this.name, this.parameters.numPoints)
    const intersections = originalPath.getCrossings(extrusionPath)
    let extensionPath
    const upperLeftCorner = [originalPath.bounds.x, originalPath.bounds.y]
    const upperRightCorner = [originalPath.bounds.x + originalPath.bounds.width, originalPath.bounds.y]
    if (intersections.length > 0) {
      const intersectionPoints = intersections.map(intersection => originalPath.getLocationOf(intersection.point))
      intersectionPoints.sort(
          (loc1, loc2) => loc1.point.getDistance(upperLeftCorner) - loc2.point.getDistance(upperLeftCorner)
      )
      const leftUpperOffset = intersectionPoints[0].offset
      intersectionPoints.sort(
          (loc1, loc2) => loc1.point.getDistance(upperRightCorner) - loc2.point.getDistance(upperRightCorner)
      )
      const rightUpperOffset = intersectionPoints[0].offset
      const extensionSegments = []
      // originalPath and extrusionPath have the same number of segments by construction
      for (let j = 0; j < originalPath.segments.length; j++) {
        const segmentOffset = originalPath.segments[j].location.offset
        const extrusionPoint = extrusionPath.segments[j].point
        if (leftUpperOffset < rightUpperOffset) {
          if (segmentOffset > leftUpperOffset && segmentOffset < rightUpperOffset) {
            if (extrusionPoint.getDistance(originalPath.getNearestPoint(extrusionPoint)) > 1 &&
                !originalPath.contains(extrusionPoint)
            ) {
              extensionSegments.push(extrusionPath.segments[j].clone())
            } else {
              extensionSegments.push(originalPath.getNearestLocation(extrusionPoint).segment.clone())
            }
          } else {
            extensionSegments.push(originalPath.segments[j].clone())
          }
        } else {
          if (segmentOffset > rightUpperOffset && segmentOffset < leftUpperOffset) {
            extensionSegments.push(originalPath.segments[j].clone())
          } else {
            if (extrusionPoint.getDistance(originalPath.getNearestPoint(extrusionPoint)) > 1 &&
                !originalPath.contains(extrusionPoint)
            ) {
              extensionSegments.push(extrusionPath.segments[j].clone())
            } else {
              extensionSegments.push(originalPath.getNearestLocation(extrusionPoint).segment.clone())
            }
          }
        }
      }
      extensionPath = new paper.Path(extensionSegments)
    } else {
      extensionPath = extrusionPath
    }
    Object.assign(extensionPath, {
      strokeWidth: this.parameters.strokeWidth,
      strokeColor: this.parameters.extensionStrokeColor,
      fillColor: this.parameters.extensionBackgroundColor,
      visible: true,
      closed: true
    })
    extensionPath.sendToBack()  // not maintained when building group
    this.zOrder['extension'] = -1
    this.registerItem(extensionPath, 'extension')
  }

  drawIslands (borderProportion, subElements) {// eslint-disable-line no-unused-vars
    let islands = []
    for (let i = 0; i < Math.ceil(this.parameters.maxNumIslands * borderProportion); i++) {
      const symbolPosition = this.outerPath.getPointAt(this.outerPath.length * (1 - i / this.parameters.maxNumIslands))
      let island
      switch (this.parameters.islandsMode) {
        case 'circle':
          island = new paper.Path.Circle(
              symbolPosition,
              0.8 * this.parameters.islandsSize/2
          ).subtract(new paper.Path.Circle(
                  symbolPosition,
                  0.5  * this.parameters.islandsSize/2
              ))
          break
        case 'star':
          island = new paper.Path.Star(
              symbolPosition,
              5,
              0.5 * this.parameters.islandsSize/2,
              0.8 * this.parameters.islandsSize/2
          ).subtract(new paper.Path.Star(
                  symbolPosition,
                  5,
                  0.3 * this.parameters.islandsSize/2,
                  0.5 * this.parameters.islandsSize/2
              ))
          break
        case 'square':
          island = new paper.Path.Rectangle(
              symbolPosition,
              new paper.Size(0.8 * this.parameters.islandsSize/2,
                  0.8 * this.parameters.islandsSize/2)
          ).subtract(new paper.Path.Rectangle(
                  symbolPosition,
                  new paper.Size(0.5 * this.parameters.islandsSize/2,
                      0.5 * this.parameters.islandsSize/2)
              ))
          break
      }
      island.fillColor = ''  // islands are unfilled so underlying membrane can be seen 
      island.strokeColor = this.parameters.islandsStrokeColor
      islands.push(island)
    }
    const borderSymbolGroup = new paper.Group(islands)
    this.registerItem(borderSymbolGroup, 'islands')
  }
  
  drawShade (shadingProportion, subElements) { // eslint-disable-line no-unused-vars
    const hexColor = this.parameters.shapeColor.slice(0, -2)  // slice out old opacity hex code
    const opacity = Math.round(shadingProportion * 255).toString(16)
    this.parameters.shapeColor = hexColor + opacity
    this.mainPath.fillColor = this.parameters.shapeColor
  }
}

export default ShapeGlyph
