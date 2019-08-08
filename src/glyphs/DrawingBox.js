import paper from 'paper'

/* Position of glyphs + helper methods to change it
* If glyph has any children */
class DrawingBox {

    constructor (glyph, {
        boundingRect,
        shapePositions = {leftShift: 0, topShift: 0, widthProportion: 1, heightProportion: 1}}
    ) {
        this.glyph = glyph
        this.drawingBounds = boundingRect // bounding rectangle of drawing box
        this.drawingCenter = {
            x: boundingRect.left + boundingRect.width / 2,
            y: boundingRect.top + boundingRect.height / 2
        }
        this.applyPositioning(shapePositions)
        this.canvasRect = paper.view.element.getBoundingClientRect()
    }

    history = []

    copyTo (glyph) {
        glyph.box = new DrawingBox(glyph, {
            boundingRect: this.drawingBounds,
            shapePositions: this.shapePositions
        })
    }

    get childrenBoxes () { // returns boxes of children glyphs
        let boxes = []
        for (let glyph of this.glyph.children) {
            if (!glyph.box) {
                console.warn(`${this.glyph.name}'s child '${glyph.name}' has no drawing box`)
            } else {
                boxes.push(glyph.box)
            }
        }
        return boxes
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

    applyTransforms(history) { // applies all transforms in a given history (own history is updated by transforms)
        for (let step of history) {
            this[step.transform](...step.parameters)
        }
    }

    resize (widthProportion = 1.0, heightProportion = 1.0, options = {center: false, children: false}) { // TODO test
        const {center, children} = options
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
        // record transformation that occured on box
        this.history.push({
            transform: 'resize',
            parameters: [widthProportion, heightProportion, {center: center, children: children}]
        })
        // apply to children
        if (children) { // TODO test
            for (let childBox of this.childrenBoxes) {
                childBox.resize(widthProportion, heightProportion, center)
            }
        }

    }

    shift (leftShift = 0.0, topShift = 0.0, options = {scale: false, children: false}) {
        const {scale, children} = options
        let positions = {
            leftShift: this.shapePositions.leftShift + leftShift,
            topShift: this.shapePositions.topShift + topShift,
            widthProportion: this.shapePositions.widthProportion,
            heightProportion: this.shapePositions.heightProportion
        }
        if (scale) {
            // FIXME this is not based on an invariant
            positions.widthProportion = this.shapePositions.widthProportion * (1 - leftShift)
            positions.heightProportion = this.shapePositions.heightProportion * (1 - topShift)
        }
        this.applyPositioning(positions)
        this.history.push({
            transform: 'scale',
            parameters: [leftShift, topShift, {scale: scale, children: children}]
        })
        if (children) { // TODO test
            for (let childBox of this.childrenBoxes) {
                childBox.shift(leftShift, topShift, scale)
            }
        }
    }
}

export default DrawingBox
