<template>
    <v-card id='content' class="light elevation-5" v-resize="updateBoxRects">
        <v-card-text class="title">
            Add a new glyph
        </v-card-text>

        <div class="text-fields">
            <v-text-field
                    class="btn"
                    label="Enter glyph name"
                    v-model="newGlyphName"
            />
            <v-select
                    class="btn"
                    :items="glyphNames"
                    label="Choose glyph type"
                    v-model="selectedGlyphName"
            />
        </div>

        <v-btn class="btn close-button" round flat @click="setShapeManagerState(false)">
            <v-icon color="primary">close</v-icon>
        </v-btn>
        <!-- Box where glyph is displayed -->
        <div id="glyph-box" class="canvas-box" ref="glyphBox">
            <v-select
                    class="btn"
                    :items="glyphs.map(glyph => glyph.id)"
                    label="Select glyph to visualize"
                    outlined
                    v-model="selectedGlyphId"
                    @change="viewGlyph"
            />
        </div>
        <!-- Box where new shape can be drawn -->
        <div id="drawing-box" class="canvas-box" ref="drawingBox">
            <v-btn class="btn white--text primary"
                   v-show="!drawingMode"
                   @click="toggleDrawing">
                Draw
            </v-btn>
            <v-btn class="btn black--text secondary"
                   v-show="drawingMode"
                   @click="savePath">
                Save
            </v-btn>
            <v-btn class="btn black--text secondary"
                   v-show="drawingMode"
                   @click="removePath">
                Clear
            </v-btn>
        </div>

        <v-btn class="btn add-button dark white--text">
            Add
        </v-btn>
    </v-card>
</template>

<script>
    import paper from 'paper'
    import {mapState, mapActions} from 'vuex'

    function rectInARect (sourceRect, resize) {
        // create rectangle with the same center as sourceRect, but smaller by a factor of resize
        const targetWidth = sourceRect.width * resize
        const targetHeight = sourceRect.height * resize
        return {
            left: sourceRect.left + sourceRect.width/2 - targetWidth/2,
            top: sourceRect.top + sourceRect.height/2 - targetHeight/2,
            x: sourceRect.x + sourceRect.width/2 - targetWidth/2,
            y: sourceRect.y + sourceRect.height/2 - targetHeight/2,
            width: targetWidth,
            height: targetHeight,
            center: sourceRect.center
        }
    }

    export default {
        name: "GlyphAdder",
        data () {
            return {
                newGlyphName: '',
                drawingMode: false,
                drawingBounds: {top: 0, bottom:0, left: 0, right: 0, width: 0, height: 0},
                drawGlyphTool: null,
                path: null,
                selectedGlyphName: '',
                selectedGlyphId: '',
                glyphBoundingRect: {top: 0, bottom:0, left: 0, right: 0, width: 0, height: 0}
            }
        },
        computed: {
            ...mapState({
                glyphTypes: state => state.glyph.glyphTypes,
                glyphs: state => state.glyph.project.glyphs
            }),
            glyphNames () { // names of glyph types for selection
                let glyphNames = []
                this.glyphTypes.forEach(glyphType => glyphNames.push(glyphType.type))
                return glyphNames
            },
        },
        methods: {
            ...mapActions({
                setShapeManagerState: 'app/setShapeManagerState',
                setGlyphType: 'glyph/setGlyphType',
                reassignGlyphLayer: 'glyph/reassignGlyphLayer',
                setEditorBox: 'app/setEditorBox',
                updateGlyphArrangement: 'app/updateGlyphArrangement',
                activateRedrawing: 'glyph/activateRedrawing',
                setGlyphVisibility: 'glyph/setGlyphVisibility',
                setShapeJSON: 'glyph/setShapeJSON',
                activateSnackbar: 'app/activateSnackbar'
            }),
            initialiseTool () {
                paper.PaperScope.get(0).activate()
                const toolDown = event => {
                    // If there is no current active path then create one.
                    paper.project.layers['temp'].activate()
                    if (!this.path && this.drawingMode) {
                        console.log("Tool activated")
                        this.path = new paper.Path({
                            segments: [event.point],
                            closed: true,
                            strokeColor: 'black', // Select the path, so we can see its segment points
                            fullySelected: true
                        })
                        //let firstPoint = event.point;
                    }
                }
                const toolDrag = event => {
                    const pointInBox = event.point.x > this.drawingBounds.left &&
                        event.point.x < this.drawingBounds.left + this.drawingBounds.width &&
                        event.point.y > this.drawingBounds.top &&
                        event.point.y < this.drawingBounds.top + this.drawingBounds.height
                    if (this.path && this.drawingMode && pointInBox) {
                        this.path.add(event.point)
                        // If the user if sufficiently clost to the intial point that the
                        // draw area will be closed upon releasing the mouse then indicate
                        // this by drawing the filled colour.
                        let hitResult = this.path.hitTest(event.point, this.hitOptions)
                        if (hitResult && hitResult.segment === this.path.firstSegment) {
                            this.path.closed = true
                        } else {
                            this.path.closed = false
                            if (this.path.fillColor) {
                                this.path.fillColor.alpha = 0
                            }
                        }
                    }
                }
                const toolUp = event => {
                    if (this.path && this.drawingMode) {
                        // If user releases mouse near the first segment then close path
                        let hitResult = this.path.hitTest(event.point, this.hitOptions)
                        if (hitResult && hitResult.segment === this.path.firstSegment) {
                            this.path.closed = true
                        }

                        // Deselect path.
                        this.path.selected = false

                        // The path.segments array is analyzed and replaced by a more
                        // optimal set of segments, reducing memory usage and speeding up
                        // drawing.
                        this.path.simplify()

                        // Rescale path so that height and width are the same (TODO is this always desirable ?)
                        const pathHeight = this.path.bounds.height
                        const pathWidth = this.path.bounds.width
                        if (pathHeight >= pathWidth) {
                            this.path.scale(pathHeight/pathWidth, 1)
                        } else {
                            this.path.scale(1, pathWidth/pathHeight)
                        }
                    }
                }
                this.drawGlyphTool = new paper.Tool()
                Object.assign(this.drawGlyphTool, {
                    onMouseDown: toolDown,
                    onMouseDrag: toolDrag,
                    onMouseUp: toolUp
                })
                this.drawGlyphTool.activate() // Activate the paperJS tool.
                console.log('Drawing tool activated')
                // Set tool stroke width and hitOptions settings.
                this.strokeWidth = 10
                this.hitOptions = {
                    segments: true,
                    tolerance: this.strokeWidth
                }
                // The distance the mouse has to be dragged before an event is fired
                // is dependent on the current zoom level
                this.drawGlyphTool.minDistance = this.strokeWidth
            },
            updateBoxRects () {
                if (this.selectedGlyphId) {
                    // toggle glyph and re-activate after timeout
                    this.setGlyphVisibility({
                        value: false,
                        glyphSelector: this.selectedGlyphId
                    })
                    setTimeout(
                        () => this.setGlyphVisibility({
                            value: true,
                            glyphSelector: this.selectedGlyphId
                        }), // this in arrow function is the same as in surrounding function
                        1000
                    )
                }
                // update drawing boxes
                const oldBox = this.drawingBounds
                if (this.$refs.drawingBox) {
                    const canvasRect = document.getElementById('glyph-canvas').getBoundingClientRect()
                    const drawingBoxRect = this.$refs.drawingBox.getBoundingClientRect()
                    this.drawingBoundingRect = {
                        left: drawingBoxRect.left - canvasRect.left,
                        top: drawingBoxRect.top - canvasRect.top,
                        x: drawingBoxRect.left - canvasRect.left,
                        y: drawingBoxRect.top - canvasRect.top,
                        width: drawingBoxRect.width,
                        height: drawingBoxRect.height
                    }
                    const glyphBoxRect = this.$refs.glyphBox.getBoundingClientRect()
                    this.glyphBoundingRect = rectInARect({
                        left: glyphBoxRect.left - canvasRect.left,
                        top: glyphBoxRect.top - canvasRect.top,
                        x: glyphBoxRect.left - canvasRect.left,
                        y: glyphBoxRect.top - canvasRect.top,
                        width: glyphBoxRect.width,
                        height: glyphBoxRect.height
                    }, 0.7)
                }
                // update box in state, so that glyph can be visualised inside its box
                this.setEditorBox({
                    index: this.glyphs.findIndex(glyph => glyph.id === this.selectedGlyphId),
                    boundingRect: this.glyphBoundingRect
                })
                // transform path when box is moved / re-sized
                if (this.path) {
                    this.path.translate( new paper.Point(
                        this.drawingBounds.left - oldBox.left,
                        this.drawingBounds.top - oldBox.top
                    ))
                    this.path.scale(
                        this.drawingBounds.width / oldBox.width,
                        this.drawingBounds.height / oldBox.height
                    )
                }
            },
            drawPath () {
                if (!this.drawingMode) {
                    this.initialiseTool()
                    this.drawingMode = true
                } else {
                    this.drawGlyphTool.remove()
                    this.drawingMode = false
                }
            },
            savePath () {
                if (this.path) {
                    this.setShapeJSON(this.path.exportJSON())
                } else {
                    this.activateSnackbar({
                        text: 'No path to save - please draw a path',
                        color: 'warning',
                        timeout: 2000
                    })
                }
            },
            removePath () {
                if (this.path) {
                    this.path.remove()
                    this.path = null
                }
            },
            viewGlyph (glyphId) {
                this.setGlyphVisibility({
                    value: false,
                    glyphSelector: 'all'
                })
                this.setEditorBox({
                    index: this.glyphs.findIndex(glyph => glyph.id === glyphId),
                    boundingRect: this.glyphBoundingRect
                })
                this.updateGlyphArrangement() // recompute bounding rects in editor mode
                setTimeout(
                    () => this.setGlyphVisibility({
                        value: true,
                        glyphSelector: this.selectedGlyphId
                    }), // this in arrow function is the same as in surrounding function
                    1000
                )
            }
        },
        beforeDestroy () {
            if (this.drawGlyphTool) {
                this.drawGlyphTool.remove()
            }
        }
    }
</script>

<style scoped>
    /* can try to use grid area as well ? */
    #content{
        width: 100%;
        height: 100%;
        margin: auto;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(4, 1fr);
        align-items: center;
    }

    .canvas-box{ /* class to make divs into boxes where graphics are visualised */
        background-color: white;
        border: 1px solid black;
        min-height: 250px;
        min-width: 200px;
        margin: auto
    }

    #drawing-box{
        grid-column: 1 / 2;
        grid-row: 3 / 5;
    }

    #glyph-box{
        grid-column: 2 / 4;
        grid-row: 2 / 5;
        min-height: 400px;
        min-width: 300px;
    }

    .btn{
        z-index: 4
        /*canvas is used. For input fields, need to put above canvas in z-stack
        btn class gives z-index value of 4 > 3, the canvas' value*/
    }

    .title{
        grid-column: 1 / 2;
        grid-row: 1 / 2
    }

    .text-fields{
        grid-column: 1 / 2;
        grid-row: 2 / 3;
        margin: auto;
        max-width: 200px
    }

    .close-button{
        grid-column: 4 / 5;
        grid-row: 1 / 2;
    }

    .add-button{
        grid-column: 4 / 5;
        grid-row: 4 / 5;
    }
</style>
