import paper from 'paper'

/* Position of glyphs + helper methods to change it */
class DrawingBox {

    static applyPositioning (boundingRect, positions) {
        let glyphBoundingRect = Object.assign({}, boundingRect)
        const {topShift, leftShift, widthProportion, heightProportion} = positions
        // topShift and leftShift are relative to boundingRect dimensions before scaling
        if (typeof topShift !== 'undefined') {
            glyphBoundingRect.top += topShift * boundingRect.height
            glyphBoundingRect.y += topShift * boundingRect.height
        }
        if (typeof leftShift !== 'undefined') {
            glyphBoundingRect.left += leftShift * boundingRect.width
            glyphBoundingRect.x += leftShift * boundingRect.width
        }
        if (typeof widthProportion !== 'undefined') {
            glyphBoundingRect.width *= widthProportion
        }
        if (typeof heightProportion !== 'undefined') {
            glyphBoundingRect.height *= heightProportion
        }
        return glyphBoundingRect
    }

    constructor (glyph, {boundingRect, shapePositions}) {
        this.glyph = glyph
        const glyphBoundingRect = shapePositions[this.glyph.name] ? this.constructor.applyPositioning(
            boundingRect, shapePositions[this.glyph.name]
        ) : boundingRect
        this.drawingBounds = boundingRect
        this.drawingCenter = {
            x: boundingRect.left + boundingRect.width / 2,
                y: boundingRect.top + boundingRect.height / 2
        }
        this.bounds = glyphBoundingRect // bounds for this glyph
        this.center = {
            x: glyphBoundingRect.left + glyphBoundingRect.width / 2,
            y: glyphBoundingRect.top + glyphBoundingRect.height / 2
        }
        this.shapePositions = shapePositions
        this.canvasRect = paper.view.element.getBoundingClientRect()
    }

    resize (widthProportion = 1.0, heightProportion = 1.0, center = true) {
        const positions = this.shapePositions[this.glyph.name]
        if (center) { // keep glyph centered
            positions.leftShift += (1 - widthProportion)/2
            positions.widthProportion *= widthProportion
            positions.topShift += (1 - heightProportion)/2
            positions.heightProportion *= heightProportion
        } else { // upper left corner remains unchanged (but center shifts)
            positions.widthProportion *= widthProportion
            positions.heightProportion *= heightProportion
        }
        let glyphBoundingRect = DrawingBox.applyPositioning(this.bounds)
        this.bounds = glyphBoundingRect // bounds for this glyph
        this.shapePositions[this.glyph.name] = positions
        // TODO test
    }
}

export default DrawingBox
