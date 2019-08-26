import paper from 'paper'
import drawAxes from "./helpers/drawAxes";

export default {
  changeDisplayedGlyphMax: (state, maxDisplayedGlyphs) => {
    const MAXGLYPHS = 20
    if (maxDisplayedGlyphs > MAXGLYPHS) {
      console.warn(`Max number of displayed glyphs exceeded, setting to constant instead (${maxDisplayedGlyphs} > ${MAXGLYPHS})`)
      state.maxDisplayedGlyphs = MAXGLYPHS
    } else {
      console.log(`Max number of displayed glyphs changed to ${maxDisplayedGlyphs}`)
      state.maxDisplayedGlyphs = maxDisplayedGlyphs
    }
  }, // used by readData in backend

  changeDisplayedGlyphNum: (state, {numDisplayedGlyphs, glyphs}) => {
    glyphs.forEach(glyph => {
      // in fluid view, reset all glyphs, so that grid can be redrawn
      if (glyph.drawn) { glyph.reset() }
    })
    state.numDisplayedGlyphs = Math.min(state.maxDisplayedGlyphs, numDisplayedGlyphs)
    // update number of pages needed to show all glyphs
    state.numPages = Math.ceil(glyphs.length / Math.max(state.numDisplayedGlyphs, 1))
    console.log(`Number of displayed glyphs changed to ${numDisplayedGlyphs} (on ${state.numPages} pages)`)
  },

  changeCurrentPage: (state, page) => { state.currentPage = page },

  setBoundingRects: (state, boundingRects) => {
    // for (let i = 0; i < boundingRects.length; i++) { // all pairs of rectangles
    //   for (let j = i; j < boundingRects.length; j++) {
    //     if (overlapTest(boundingRects[i], boundingRects[j])) {
    //       throw Error(`Bounding rectangles overlap:\n
    //       {x: ${boundingRects[i].x}, y: ${boundingRects[i].y},  w:${boundingRects[i].width}, h:${boundingRects[i].width}}\n
    //       {x: ${boundingRects[j].x}, y: ${boundingRects[j].y},  w:${boundingRects[j].width}, h:${boundingRects[j].width}}`
    //       )
    //     }
    //   }
    // }
    state.boundingRects = boundingRects
  },

  activateSnackbar: (state, {text, color, timeout}) => {
    state.snackbar.active = true
    state.snackbar.text = text || 'notification'
    state.snackbar.color = color || 'info' // color types: info, error, success, warning - can modify in theme
    state.snackbar.timeout = timeout || 4000
  },

  dismissSnackbar: state =>state.snackbar.active = false,

  toolbarOff: state => state.toolbar = false,

  toolbarOn: state => state.toolbar = true,

  toggleToolsDrawer: state => state.toolsDrawer = !state.toolsDrawer,

  toggleStudioDrawer: state => state.studioDrawer = !state.studioDrawer,

  // state setters TODO replace with one function that takes attribute name, does existence check, then sets that attribute
  setToolsDrawerState: (state, payload) => state.toolsDrawer = payload,

  setStudioDrawerState: (state, payload) => state.studioDrawer = payload,

  setGlyphBinderState: (state, payload) => state.glyphBinder = payload,

  setShapeManagerState: (state, payload) => state.shapeManager = payload,

  setShapeCanvasState: (state, payload) => state.shapeCanvas = payload,

  setWelcomeCardState: (state, payload) => state.welcomeCard = payload,

  setChartControllerState: (state, payload) => state.chartController = payload,

  setLegendViewerState: (state, payload) => state.legendViewer = payload,

  setGlyphArrangement: (state, glyphArrangement) => state.glyphArrangement = glyphArrangement,

  updateGlyphArrangement (state) {
    /* arrange glyphs onto the canvas by defining bounding rectangles */
    // !!! IMPORTANT: must produce square drawing boxes
    let boundingRects
    if (!state.numDisplayedGlyphs) {
      boundingRects = [...state.boundingRects]
    } else if (state.glyphArrangement === 'grid') {
      // set up grid where to place glyphs
      boundingRects = []
      // paper.view.bounds is in project coordinates, i.e. in canvas coordinates. Use client rect instead
      let numXGlyphs = Math.round(Math.sqrt(state.numDisplayedGlyphs * (paper.view.viewSize.width / paper.view.viewSize.height))) // rounds down
      const numYGlyphs = Math.round(state.numDisplayedGlyphs / numXGlyphs)
      if (numXGlyphs * numYGlyphs < state.numDisplayedGlyphs) {
        numXGlyphs++
      } // get space for two more glyphs horizontally
      const xOffset = paper.view.viewSize.width / (numXGlyphs + 1.0) // offset should be more than half of desired glyph width
      const yOffset = paper.view.viewSize.height / (numYGlyphs + 1.0) // offset should be more than half of desired glyph height
      const glyphSize = Math.min(xOffset, yOffset) * state.boundingRectSizeFactor - 0.5 // inscribe glyph in square in order to keep aspect ratio constant
      let numRects = 0
      const gridId = `x-offset: ${xOffset.toFixed(2)}; y-offset: ${yOffset.toFixed(2)}; width: ${glyphSize.toFixed(2)}; height: ${glyphSize.toFixed(2)}`
      const canvasRect = paper.view.element.getBoundingClientRect() // eslint-disable-line no-unused-vars
      for (let i = 0; i < numYGlyphs; i++) {
        for (let j = 0; j < numXGlyphs; j++) {
          if (numRects < state.numDisplayedGlyphs) {
            boundingRects.push({
              width: glyphSize,
              height: glyphSize,
              left: xOffset * (j + 0.3), // relative to page origin (?)
              top: yOffset * (i + 0.3),
              x: xOffset * (j + 0.3), // relative to canvas origin
              y: yOffset * (i + 0.3),
              generator: {type: 'grid', id: gridId}
            })
            numRects++
          }
        }
      }
      console.log(`Updating grid for (${paper.view.viewSize.width}, ${paper.view.viewSize.height})-view --> ` + gridId)
    } else if (state.glyphArrangement === 'editor') {
      boundingRects = Array(state.numDisplayedGlyphs).fill({
        top: 0,
        left: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        generator: {type: 'editor', id: state.editorBox.index}
      }, 0, state.numDisplayedGlyphs) // fill only modifies arrays (name is confusing)
      let singleGlyphRect = state.editorBox.boundingRect
      singleGlyphRect.generator = {type: 'editor', id: state.editorBox.index}
      // make bounding rectangle square
      if (singleGlyphRect.width !== singleGlyphRect.height) {
        const dim = Math.min(singleGlyphRect.width, singleGlyphRect.height)
        singleGlyphRect.width = dim
        singleGlyphRect.height = dim
      }
      boundingRects[state.editorBox.index] = singleGlyphRect
      console.log(`Visualising glyph #${state.editorBox.index}`)
    } else if (state.glyphArrangement === 'chart') {
      if (state.chartPoints.length === 0) {
        throw Error("'chart' glyph arrangement requires non-empty points array")
      }
      boundingRects = []
      let minXDistances = []
      let minYDistances = []
      for (let point0 of state.chartPoints) {
        let minXDist = 100000.0
        let minYDist = 100000.0
        for (let point1 of state.chartPoints) {
          if (point0.x === point1.x && point0.y === point1.y) {
            continue
          }
          let xDist = Math.abs(point0.x - point1.x)
          if (xDist < minXDist) {
            minXDist = xDist
          }
          let yDist = Math.abs(point0.y - point1.y)
          if (yDist < minYDist) {
            minYDist = yDist
          }
        }
        minXDistances.push(minXDist)
        minYDistances.push(minYDist)
      }
      // FIXME finish and deal with overlapping glyphs
      const rectSize = Math.min( // TODO kinda arbitrary
          paper.view.viewSize.width / Math.ceil(Math.sqrt(state.numDisplayedGlyphs + 1.0)),
          paper.view.viewSize.height / Math.ceil(Math.sqrt(state.numDisplayedGlyphs + 1.0))
      ) * state.boundingRectSizeFactor - 0.5 // inscribe glyph in square in order to keep aspect ratio constant
      const drawingDist = Math.max(Math.min(...minXDistances, ...minYDistances),  rectSize)
      for (let point of state.chartPoints) {
        let pointRect = {
          left: point.x - drawingDist / 2,
          top: point.y - drawingDist / 2,
          x: point.x - drawingDist / 2,
          y: point.y - drawingDist / 2,
          width: drawingDist,
          height: drawingDist,
          generator: {type: 'chart', id: `${point.x}, ${point.y}`}
        }
        boundingRects.push(pointRect)
      }
    } else if (state.glyphArrangement){ // if non-empty
      throw Error(`Unknown glyph arrangement type ${state.glyphArrangement}`)
    }
    state.boundingRects = boundingRects // assign bounding rects
    // check for overlap between bounding rects
    // const checkOverlap = false
    // if (checkOverlap) {
    //   const overlapTest = (boundingRect0, boundingRect1) => {
    //     const x0 = boundingRect0.x
    //     const y0 = boundingRect0.y
    //     const width0 = boundingRect0.width
    //     const height0 = boundingRect0.height
    //     const x1 = boundingRect1.x
    //     const y1 = boundingRect1.y
    //     const width1 = boundingRect1.width
    //     const height1 = boundingRect1.height
    //     const xOverlap = (x0 <= x1 && x1 < x0 + width0) || (x1 <= x0 && x0 < x1 + width1)
    //     const yOverlap = (y0 <= y1 && y1 < y0 + height0) || (y1 <= y0 && y0 < y1 + height1)
    //     return xOverlap && yOverlap
    //   }
    //   for (let i = 0; i < boundingRects.length; i++) { // all pairs of rectangles
    //     for (let j = i+1; j < boundingRects.length; j++) {
    //       if (overlapTest(boundingRects[i], boundingRects[j])) {
    //         throw Error(`Bounding rectangles overlap:\n
    //       {x: ${boundingRects[i].x}, y: ${boundingRects[i].y},  w:${boundingRects[i].width}, h:${boundingRects[i].width}}\n
    //       {x: ${boundingRects[j].x}, y: ${boundingRects[j].y},  w:${boundingRects[j].width}, h:${boundingRects[j].width}}`
    //         )
    //       }
    //     }
    //   }
    // }
  },

  setEditorBox: (state, editorBox) => state.editorBox = editorBox,

  // boundingRectSizeFactor is used to zoom in an out from glyphs
  setBoundingRectSizeFactor: (state, sizeFactor) => { state.boundingRectSizeFactor = sizeFactor },

  // chart drawing methods
  setChartState: (state, payload) => state.chart = payload,

  setChartPoints: (state, {xField, yField, backend}) => {
    if (!state.axesPoints) {
      throw Error("Cannot compute chart points without axis data")
    }
    state.chartXField = xField
    state.chartYField = yField
    // order data ...
    const orderedData = [...backend.normalizedData]
    orderedData.sort((dataPoint0, dataPoint1) =>
        backend.dataDisplayOrder.indexOf(dataPoint0[backend.orderField]) -
        backend.dataDisplayOrder.indexOf(dataPoint1[backend.orderField])
    )
    // remove undisplayed data points (this allows user to plot less points)
    // if no glyphs are displayed, chart is plotted without glyphs
    if (state.numDisplayedGlyphs !== 0) {
      orderedData.splice(state.numDisplayedGlyphs, orderedData.length - state.numDisplayedGlyphs)
    }
    const xSpan = state.axesPoints.xSpanEnd - state.axesPoints.origin[0]
    const ySpan = state.axesPoints.origin[1] - state.axesPoints.ySpanEnd
    state.chartPoints = orderedData.map(dataPoint => {
      const point = [
        dataPoint[xField]*xSpan + state.axesPoints.origin[0],
        state.axesPoints.origin[1] - dataPoint[yField]*ySpan
      ]
      point.x = point[0]
      point.y = point[1]
      return point
    })
  },

  drawAxes: state => state.axesPoints = drawAxes(),

  destroyAxes: () => {
    const chartLayer = paper.project.getItem({name: 'chart'})
    if (chartLayer) {
      chartLayer.remove()
    }
  }

  // chart.js
  // drawChart: (state, {xField, yField, orderedData}) => {  // TODO (?) move this to own separate module
  //   const xData = orderedData.map(dataPoint => dataPoint[xField])
  //   const yData = orderedData.map(dataPoint => dataPoint[yField])
  //   const chart = drawChart()
  //   // need to store chart somewhere in order to destroy it, but saving chart in store cause call stack overflow,
  //   // probably because of observing triggering some mutual reactions (same as when trying to store some paperjs path)
  //   window.chart = chart
  //   const chartPoints = []
  //   const datasetMeta = chart.getDatasetMeta(0).data
  //   for (let point of datasetMeta) {
  //     chartPoints.push([point._model.x, point._model.y])
  //     chartPoints[chartPoints.length - 1].x = point._model.x
  //     chartPoints[chartPoints.length - 1].y = point._model.y
  //   }
  //   state.chartPoints = chartPoints // store chart points to position glyph in their center
  // },

  // destroyChart: () => {
  //   if (window.chart) {
  //     window.chart.destroy()
  //     window.chart = null // garbage-collect chart object
  //   }3
  // },
}
