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
        name: 'A new MorphoGlyph project',
        bindings: [], // stores features -> marker bindings
        glyphs: [], // stores the glyph objects,
        glyphNames: [],
        mainGlyphNames: [],
        template: {} // FIXME unused
    },
    totalGlyphNum: 0,
    activeLayer: null,
    selection: {layer: 0, path: ''}, // TODO this is for selecting glyph element by clicking -- not well integrated
    glyphSettings: {name: '', message: '', options: []}, // loaded from glyph type
    glyphShapes: {main: '', children: [], all: []}, // loaded from glyph type
    glyphElements: [], // loaded from glyph type
    selectedGlyphSetting: '',
    redrawing: false, // flag used to signal glyph canvas to redraw glyphs (canvas has access to bounding boxes)
    // Shape appearance parameters

}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
