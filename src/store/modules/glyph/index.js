// This module store

// Import sub files
import actions from './actions'
import mutations from './mutations'
import getters from './getters'

import ShapeGlyph from '../../../glyphs/ShapeGlyph'
import CellGlyph from '../../../glyphs/CellGlyph'

const state = {
  glyphTypes: [CellGlyph, ShapeGlyph],
  glyphTypeName: '',
  project: {
    name: 'A new phew project',
    bindings: [], // stores features -> marker bindings
    glyphs: [], // stores the glyph objects
    captions: [], // stores captions for glyphs -- same order as glyphs TODO not integrated
    template: {}
  },
  activeLayer: null,
  selection: {layer: 0, path: ''}, // TODO this is for selecting glyph element by clicking -- not well integrated
  glyphSettings: {name: '', message: '', options: []}, // loaded from glyph type
  glyphShapes: {main: '', children: [], all: []}, // loaded from glyph type
  glyphElements: [], // loaded from glyph type
  selectedGlyphSetting: '',
  redrawing: false, // flag used to signal glyph canvas to redraw glyphs (canvas has access to bounding boxes)
  // Shape appearance parameters
  shapePositions: {}
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
