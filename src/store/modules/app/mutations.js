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

  setBoundingRects: (state, boundingRects) => { state.boundingRects = boundingRects },

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

  setWelcomeCardState: (state, payload) => {
    state.welcomeCard = payload
  },

  updateGrid (state) { // function to create rects from a regular grid (not used in docked view)
    // set up grid where to place glyphs
    let boundingRects = []
    if (state.numDisplayedGlyphs) {
      let bounds = paper.view.bounds
      let numXGlyphs = Math.round(Math.sqrt(state.numDisplayedGlyphs * (bounds.width / bounds.height))) // rounds down
      const numYGlyphs = Math.round(state.numDisplayedGlyphs / numXGlyphs)
      if (numXGlyphs * numYGlyphs < state.numDisplayedGlyphs) {
        numXGlyphs++
      } // get space for two more glyphs horizontally
      const xOffset = bounds.width / (numXGlyphs + 1.0) // offset should be more than half of desired glyph width
      const yOffset = bounds.height / (numYGlyphs + 1.0) // offset should be more than half of desired glyph height
      const glyphWidth = xOffset * state.boundingRectSizeFactor
      const glyphHeight = yOffset * state.boundingRectSizeFactor
      let numRects = 0
      const gridId = `x-offset: ${xOffset.toFixed(2)}; y-offset: ${yOffset.toFixed(2)}; width: ${glyphWidth.toFixed(2)}; height: ${glyphHeight.toFixed(2)}`
      for (let i = 0; i < numYGlyphs; i++) {
        for (let j = 0; j < numXGlyphs; j++) {
          if (numRects < state.numDisplayedGlyphs) {
            boundingRects.push({
              width: glyphWidth,
              height: glyphHeight,
              left: bounds.x + xOffset * (j + 0.5),
              top: bounds.y + yOffset * (i + 0.5),
              generator: {type: 'grid', id: gridId}
            })
            numRects++
          }
        }
      }
      console.log(`Updating grid for (${bounds.width}, ${bounds.height})-view --> ` + gridId)
    }
    state.boundingRects = boundingRects // assign bounding rects
  },

  setBoundingRectSizeFactor (state, sizeFactor) { state.boundingRectSizeFactor = sizeFactor }
}
