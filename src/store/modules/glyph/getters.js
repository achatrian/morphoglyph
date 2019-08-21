export default {
    totalGlyphNum: (state) => state.project.glyphs.reduce((total, newGlyph) => total + [...newGlyph.iter()].length, 0),

    glyphNames: (state) => state.project.glyphs.reduce((names, newGlyph) => {
        for (let glyph of [...newGlyph.iter()]) {
            names.add(glyph.name)
        }
        return names
    }, new Set())
}

