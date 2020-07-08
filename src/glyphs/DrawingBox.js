
/* Position of glyphs + helper methods to change it
* If glyph has any children */
class DrawingBox {

    // all transforms applied to box
    history = []
    // transforms used during drawing of glyphs, must be reapplied when setting transforms are applied
    drawingTransforms = []
    bounds = {}
    gridPosition = { // position in grid terms
        horizontal: 2,
        vertical: 2,
        scale: 3
    }

    constructor (glyph, {
                    boundingRect,
                    shapePositions = {leftShift: 0, topShift: 0, widthProportion: 1, heightProportion: 1},
                    history = [],
                    maxHistLength = 20,
                    applyTransformsFlag: applyHistoryTransforms = false
                 },
    ) {
        this.glyph = glyph
        this.drawingBounds = boundingRect // bounding rectangle of drawing box
        this.drawingCenter = {
            x: boundingRect.left + boundingRect.width / 2,
            y: boundingRect.top + boundingRect.height / 2
        }
        this.applyPositioning(shapePositions)
        if (applyHistoryTransforms) {
            this.applyTransforms(history)
            this.history = history
        }
        if (history.length > 0) {
            this.history = history
        }
        this.drawingTransforms = this.history.filter(step => step.parameters[2].drawing)
        this.maxHistLength = maxHistLength
        this.applyTransformsFlag = applyHistoryTransforms
        this.glyph.box = this
    }

    copyTo (glyph) {
        glyph.box = new DrawingBox(glyph, {
            boundingRect: this.drawingBounds,
            shapePositions: this.shapePositions,
            history: this.history,
            maxHistLength: this.maxHistLength,
            applyTransforms: false
        })
    }

    get childrenBoxes () { // returns boxes of children glyphs
        let boxes = []
        for (const glyph of this.glyph.children) {
            if (glyph.box) {
                boxes.push(glyph.box)
            }
        }
        return boxes
    }

    applyPositioning (positions) {
        // updates bounding box of glyph based on new positioning parameters
        let glyphBoundingRect = {...this.bounds}
        const {topShift, leftShift, widthProportion, heightProportion} = positions
        // topShift and leftShift are relative to boundingRect dimensions before scaling
        if (typeof topShift !== 'undefined') {
            glyphBoundingRect.top = this.drawingBounds.y + topShift * this.drawingBounds.height
            glyphBoundingRect.y = glyphBoundingRect.top
        }
        if (typeof leftShift !== 'undefined') {
            glyphBoundingRect.left = this.drawingBounds.x + leftShift * this.drawingBounds.width
            glyphBoundingRect.x = glyphBoundingRect.left
        }
        if (typeof widthProportion !== 'undefined') {
            glyphBoundingRect.width = widthProportion * this.drawingBounds.width
        }
        if (typeof heightProportion !== 'undefined') {
            glyphBoundingRect.height = heightProportion * this.drawingBounds.height
        }
        this.bounds = glyphBoundingRect
        this.center = {
            x: this.bounds.left + this.bounds.width / 2,
            y: this.bounds.top + this.bounds.height / 2
        }
        this.shapePositions = positions
    }

    recordTransform (transformName, parameters = [], drawing = false) { // TODO test
        if (parameters.length !== 3) {
            throw Error('Transforms take 3 parameters')
        }
        this.history.push({
            transform: transformName,
            parameters: parameters
        })
        if (drawing) {
            this.drawingTransforms.push({
                transform: transformName,
                parameters: parameters
            })
        }
    }

    applyTransforms(history) { // applies all transforms in a given history (own history is updated by transforms)
        for (const step of history) {
            this[step.transform](...step.parameters)
        }
    }

    // applyDrawingTransforms(selector = '') {
    //     // adapts drawing transforms for re-application (e.g. by removing centering directives)
    //     let adaptedTransforms = [...this.drawingTransforms]
    //     switch (selector) {
    //         case 'resize':
    //             adaptedTransforms = adaptedTransforms.filter(step => step.transform === 'resize')
    //             break
    //         case 'resizeWidth':
    //             adaptedTransforms = adaptedTransforms.filter(step => step.transform === 'resize' && step.parameters[1] == null)
    //             break
    //         case 'resizeHeight':
    //             adaptedTransforms = adaptedTransforms.filter(step => step.transform  === 'resize' && step.parameters[0] == null)
    //             break
    //         case 'shift':
    //             adaptedTransforms = adaptedTransforms.filter(step => step.transform === 'shift')
    //             break
    //         case 'shiftLeft':
    //             adaptedTransforms = adaptedTransforms.filter(step => step.transform === 'shift' && step.parameters[1] == null)
    //             break
    //         case 'shiftTop':
    //             adaptedTransforms = adaptedTransforms.filter(step => step.transform === 'shift' && step.parameters[0] == null)
    //             break
    //     }
    //     for (let step of adaptedTransforms) {
    //         if (step.transform === 'resize') {
    //             step.parameters[2].center = false // prevent shifting in re-sizes when re-applying transforms
    //         }
    //         if (step.transform === 'shift') {
    //             step.parameters[2].scale = false // prevent re-sizing in shifts when re-applying transforms
    //         }
    //         step.parameters[2].drawing = false // prevents storing duplicates in drawingTransforms
    //     }
    //     for (let step of adaptedTransforms) {
    //         step.parameters[3] = false // do not register drawing transforms that have already been registered
    //         this[step.transform](...step.parameters)
    //     }
    // }

    resize (widthProportion = 1.0, heightProportion = 1.0,
            options = {setValues: false, drawing: false, center: false, children: false, setScale: false},
            record=true) {
        const {center, children, setValues, drawing, setScale} = options
        let newWidthProportion, newHeightProportion
        if (widthProportion == null) {
            newWidthProportion = this.shapePositions.widthProportion // if null, keep old value
        } else if (setValues) {
            if (setScale) {
                newWidthProportion = widthProportion // setting scale
            } else {
                newWidthProportion = widthProportion * this.gridPosition.scale/3 // with respect to set scale
            }
        } else {
            newWidthProportion = this.shapePositions.widthProportion * widthProportion
        }
        if (heightProportion == null) {
            newHeightProportion = this.shapePositions.heightProportion // if null, keep old value
        } else if (setValues) {
            if (setScale) {
                newHeightProportion = heightProportion // setting scale
            } else {
                newHeightProportion = heightProportion * this.gridPosition.scale/3 // with respect to set scale
            }
        } else {
            newHeightProportion = this.shapePositions.heightProportion * heightProportion
        }
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
        // record transformation acting on box (unless transform is being replayed, in which case 'record' should be false)
        if (record) {
            this.recordTransform('resize', [widthProportion, heightProportion, options], drawing)
        }
        // re-applies drawing transforms in case a modification occurred
        // if (redraw) {
        //     let selector = ''
        //     if (heightProportion == null) {
        //         selector = 'resizeWidth'
        //     } else if (widthProportion == null) {
        //         selector = 'resizeHeight'
        //     }
        //     this.applyDrawingTransforms(selector)
        // }
        // apply to children
        if (children) { // TODO test
            for (const childBox of this.childrenBoxes) {
                childBox.resize(widthProportion, heightProportion, options)
            }
        }
        if (setScale) {
            this.gridPosition.scale = setScale
        }
    }

    shift (leftShift = 0.0, topShift = 0.0,
           options = {setValues: false, drawing: false, scale: false, children: false, redraw: false},
           record=true) {
        const {scale, children, setValues, drawing, redraw} = options
        let newLeftShift, newTopShift
        if (leftShift == null) {
            newLeftShift = this.shapePositions.leftShift // if null, keep old value
        } else if (setValues) {
            newLeftShift = leftShift
        } else {
            newLeftShift = Math.min(this.shapePositions.leftShift + leftShift, 1.0)
        }
        if (topShift == null) {
            newTopShift = this.shapePositions.topShift
        } else if (setValues) {
            newTopShift = topShift
        } else {
            newTopShift = Math.min(this.shapePositions.topShift + topShift, 1.0)
        }
        let positions = {
            leftShift: newLeftShift,
            topShift: newTopShift,
            widthProportion: scale ?
                this.shapePositions.widthProportion * (1 - leftShift) : this.shapePositions.widthProportion,
            heightProportion: scale ?
                this.shapePositions.heightProportion * (1 - topShift) : this.shapePositions.heightProportion,
        }
        this.applyPositioning(positions)
        if (record) {
            this.recordTransform('shift', [leftShift, topShift, options], drawing)
        }
        // re-applies drawing transforms in case a modification occurred
        // if (redraw) {
        //     let selector = ''
        //     if (topShift == null) {
        //         selector = 'shiftLeft'
        //     } else if (leftShift == null) {
        //         selector = 'shiftTop'
        //     }
        //     this.applyDrawingTransforms(selector)
        // }
        if (children) { // TODO test
            for (const childBox of this.childrenBoxes) {
                childBox.shift(leftShift, topShift, options)
            }
        }
    }

    toCenter (left = true, top = true, options = {drawing: false}, record=true) {
        const {drawing} = options
        const positions = {
            leftShift: left ? (1 - this.shapePositions.widthProportion) / 2 : this.shapePositions.leftShift,
            topShift: top ? (1 - this.shapePositions.heightProportion) / 2 : this.shapePositions.topShift,
            widthProportion: this.shapePositions.widthProportion,
            heightProportion: this.shapePositions.heightProportion,
        }
        this.applyPositioning(positions)
        // this.applyDrawingTransforms('shift') // applies any required drawing shifts after centering
        if (record) {
            this.recordTransform('center', [left, top, options], drawing)
        }
    }

    relativeShift (leftShift = null, topShift = null,
                   options = {setValues: false, drawing: false, scale: false, children: false, redraw: false},
                   record= true) {
        console.assert(new Set([1, 2, 3, null]).has(leftShift), 'shift must be equal to 1, 2 or 3')
        console.assert(new Set([1, 2, 3, null]).has(topShift), 'shift must be equal to 1, 2 or 3')
        const horShift = (leftShift - 1)*(1 - this.shapePositions.widthProportion)/2
        const vertShift = (topShift - 1)*(1 - this.shapePositions.heightProportion)/2
        this.shift(leftShift ? horShift : null, topShift ? vertShift : null, options, record)
    }

}

export default DrawingBox
