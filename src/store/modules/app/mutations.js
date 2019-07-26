import paper from 'paper'

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
    if (state.dockedView) {
      if (numDisplayedGlyphs <= state.numDisplayedGlyphs) {
        for (let glyph of glyphs.slice(numDisplayedGlyphs, glyphs.length - 1)) {
          if (glyph.drawn) { glyph.reset() }
        } // reset extra glyphs (erase paths) given new number of docks
      }
    } else {
      glyphs.forEach(glyph => {
        // in fluid view, reset all glyphs, so that grid can be redrawn
        if (glyph.drawn) { glyph.reset() }
      })
    }
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

  dismissSnackbar: state => {
    state.snackbar.active = false
  },

  toolbarOff: state => {
    state.toolbar = false
  },

  toolbarOn: state => {
    state.toolbar = true
  },

  toggleToolsDrawer: state => {
    state.toolsDrawer = !state.toolsDrawer
  },

  toggleStudioDrawer: state => {
    state.studioDrawer = !state.studioDrawer
  },

  setToolsDrawerState: (state, payload) => {
    state.toolsDrawer = payload
  },

  setStudioDrawerState: (state, payload) => {
    state.studioDrawer = payload
  },

  setGlyphBinderState: (state, payload) => {
    state.glyphBinder = payload
  },

  setGlyphAdderState: (state, payload) => {
    state.glyphAdder = payload
  },

  setWelcomeCardState: (state, payload) => {
    state.welcomeCard = payload
  },

  updateGrid (state) { // function to create rects from a regular grid (not used in docked view)
    // set up grid where to place glyphs
    let boundingRects = []
    if (state.numDisplayedGlyphs) {
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

  setBoundingRectSizeFactor (state, sizeFactor) { state.boundingRectSizeFactor = sizeFactor }
}
