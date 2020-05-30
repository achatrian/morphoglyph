<template>
    <v-card id='content' class="light elevation-5" v-resize="updateBoxRects">
        <v-layout row justify-space-around>
            <v-flex xs6 sm4>
                <div id="drawing-box" class="canvas-box" ref="drawingBox"></div>
            </v-flex>
            <v-flex xs6 sm4>
                <div class="buttons">
                    <!--TODO remove draw button and always allow drawing (but remove tool when possible to save run-time)-->
                    <v-btn class="btn white--text primary"
                           :disabled="drawingMode"
                           @click="drawPath">
                        Draw
                    </v-btn>
                    <div class="text-field btn">
                        <v-text-field
                                style="z-index: 4"
                                label="Shape name"
                                placeholder="Assign name to shape"
                                v-model="newShapeName"
                        />
                    </div>
                    <v-btn class="btn primary light--text"
                           :disabled="!drawingMode"
                           @click="savePath">
                        Save
                    </v-btn>
                    <v-btn class="btn secondary dark--text"
                           :disabled="!drawingMode"
                           @click="removePath">
                        Clear
                    </v-btn>
                </div>
            </v-flex>
        </v-layout>
    </v-card>
</template>

<script>
    import paper from "paper"
    import {mapActions} from 'vuex'

    export default {
        name: "ShapeCanvas",
        data () {
            return {
                newShapeName: '',
                drawingMode: false,
                drawingBounds: {top: 0, bottom:0, left: 0, right: 0, width: 0, height: 0},
                drawGlyphTool: null,
                path: null,
            }
        },
        methods: {
            ...mapActions({
               setShapeCanvasState: 'app/setShapeCanvasState',
                storeShapeJSON: 'backend/storeShapeJSON'
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
                const toolUp = () => {
                    if (this.path && this.drawingMode) {
                        // if path was drawn counter-clockwise, rebuild it in a clockwise manner and save it
                        let signedArea = 0
                        for (let p = 0; p < this.path.segments.length - 2; p++) {
                            let [x1, y1] = [this.path.segments[p].point.x, this.path.segments[p].point.y]
                            let [x2, y2] = [this.path.segments[p+1].point.x, this.path.segments[p+1].point.y]
                            signedArea += (x2 - x1) * (y2 + y1)
                        }
                        let [x1, y1] = [this.path.segments[this.path.segments.length - 1].point.x,
                            this.path.segments[this.path.segments.length - 1].point.y]
                        let [x2, y2] = [this.path.segments[0].point.x, this.path.segments[0].point.y]  // starting point
                        signedArea += (x2 - x1) * (y2 + y1)
                        if (signedArea > 0) {
                            const clockwisePath = new paper.Path({
                                segments: this.path.segments.reverse(),
                                strokeColor: 'black',
                                closed: true
                            })
                            this.path.replaceWith(clockwisePath)
                            this.path = clockwisePath
                            console.log("Replaced counter-clockwise path with clock-wise equivalent")
                        }

                        // If user releases mouse near the first segment then close path
                        this.path.closed = true

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
                        // Shift the path to the canvas' center
                        this.path.translate(new paper.Point(
                            this.drawingBounds.center.x - this.path.bounds.center.x,
                            this.drawingBounds.center.y - this.path.bounds.center.y
                        ))
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
                // update drawing box
                const canvasRect = document.getElementById('glyph-canvas').getBoundingClientRect()
                const drawingBoxRect = this.$refs.drawingBox.getBoundingClientRect()
                this.drawingBounds = {
                    left: drawingBoxRect.left - canvasRect.left,
                    top: drawingBoxRect.top - canvasRect.top,
                    x: drawingBoxRect.left - canvasRect.left,
                    y: drawingBoxRect.top - canvasRect.top,
                    width: drawingBoxRect.width,
                    height: drawingBoxRect.height,
                    center: {
                        x: drawingBoxRect.left - canvasRect.left + drawingBoxRect.width/2,
                        y: drawingBoxRect.top - canvasRect.top + drawingBoxRect.height/2
                    }
                }
                // transform path when drawingBounds is moved / re-sized
                if (this.path) {
                    this.path.translate( new paper.Point(
                        this.drawingBounds.left - this.path.bounds.left,
                        this.drawingBounds.top - this.path.bounds.top
                    ))
                    this.path.scale(
                        this.drawingBounds.width / this.path.bounds.width,
                        this.drawingBounds.height / this.path.bounds.height
                    )
                }
            },
            drawPath () {
                if (this.path) {
                    this.removePath()
                    for (let shapeName of this.shapeNames) {
                        shapeName.selected = false
                    }
                }
                this.initialiseTool()
                this.drawingMode = true
                this.loadedShape = ''
                this.newShapeName = ''
            },
            endDrawing () {
                this.drawGlyphTool.remove()
                this.drawingMode = false
                this.newShapeName = ''
            },
            savePath () {
                if (this.path) {
                    this.storeShapeJSON({
                        name: this.newShapeName,
                        shapeJSON: this.path.exportJSON(),
                        type: 'global' // global shape is applied to all glyphs that don't have a
                    })
                    this.drawingMode = false
                    this.removePath()
                    this.newShapeName = ''
                } else {
                    this.activateSnackbar({
                        text: 'No path to save - please draw a path',
                        color: 'warning',
                        timeout: 2000
                    })
                }
                this.setShapeCanvasState(false)
            },
            removePath () {
                if (this.path) {
                    this.path.remove()
                    this.path = null
                }
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
    #content{
        width: 50%;
        margin: auto
    }

    .canvas-box{ /* class to make divs into boxes where graphics are visualised */
        background-color: white;
        border: 1px solid black;
        min-height: 250px;
        min-width: 250px;
        margin: auto
    }

    #drawing-box{
        width: 50%;
        height: 0%;  /* needs to be zero in order for padding-top to keep the width and height equal */
        padding-top: 50%;
    }

    .buttons{
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        max-width: 90%;
        margin: auto
    }

    .btn{
        z-index: 4
        /*canvas is used. For input fields, need to put above canvas in z-stack
        btn class gives z-index value of 4 > 3, the canvas' value*/
    }
</style>