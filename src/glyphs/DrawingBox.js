import paper from 'paper'

/* Position of glyphs + helper methods to change it */
class DrawingBox {

    constructor (glyph, {boundingRect, shapePositions = {
        leftShift: 0, topShift: 0, widthProportion: 1, heightProportion: 1
    }}) {
        this.glyph = glyph
        this.drawingBounds = boundingRect // bounding rectangle of drawing box
        this.drawingCenter = {
            x: boundingRect.left + boundingRect.width / 2,
            y: boundingRect.top + boundingRect.height / 2
        }
        this.applyPositioning(shapePositions)
        this.canvasRect = paper.view.element.getBoundingClientRect()
    }

    applyPositioning (positions) {
        // updates bounding box of glyph based on new positioning parameters
        let glyphBoundingRect = Object.assign({}, this.drawingBounds)
        const {topShift, leftShift, widthProportion, heightProportion} = positions
        // topShift and leftShift are relative to boundingRect dimensions before scaling
        if (typeof topShift !== 'undefined') {
            glyphBoundingRect.top += topShift * this.drawingBounds.height
            glyphBoundingRect.y += topShift * this.drawingBounds.height
        }
        if (typeof leftShift !== 'undefined') {
            glyphBoundingRect.left += leftShift * this.drawingBounds.width
            glyphBoundingRect.x += leftShift * this.drawingBounds.width
        }
        if (typeof widthProportion !== 'undefined') {
            glyphBoundingRect.width *= widthProportion
        }
        if (typeof heightProportion !== 'undefined') {
            glyphBoundingRect.height *= heightProportion
        }
        this.bounds = glyphBoundingRect
        this.center = {
            x: this.bounds.left + this.bounds.width / 2,
            y: this.bounds.top + this.bounds.height / 2
        }
        this.shapePositions = positions
    }

    resize (widthProportion = 1.0, heightProportion = 1.0, center = true) { // TODO test
        const newWidthProportion = this.shapePositions.widthProportion * widthProportion
        const newHeightProportion = this.shapePositions.heightProportion * heightProportion
        let positions
        if (center) { // center glyph inside box
            positions = {
                leftShift: (1 - newWidthProportion) / 2,
                topShift: (1 - newHeightProportion) / 2,
                widthProportion: newWidthProportion,
                heightProportion: newHeightProportion
            }
        } else { // upper left corner remains unchanged (but center shifts)
            positions = Object.assign(this.shapePositions, {
                widthProportion: newWidthProportion,
                heightProportion: newHeightProportion
            })
        }
        this.applyPositioning(positions) // bounds for this glyph
    }

    shift (leftShift = 0.0, topShift = 0.0, scale = false) {
        let positions = {
            leftShift: this.shapePositions.leftShift + leftShift,
            topShift: this.shapePositions.topShift + topShift
        }
        if (scale) {
            positions.widthProportion = this.shapePositions.widthProportion * (1 - leftShift) // FIXME this is not based on an invariant
            positions.heightProportion = this.shapePositions.heightProportion * (1 - topShift) // FIXME this is not based on an invariant
        }
        this.applyPositioning(positions)
    }
}

export default DrawingBox
