export default {
    totalGlyphNum: (state) => {
        return state.project.glyphs.reduce((total, newGlyph) => total + [...newGlyph.iter()].length)
    }
}
