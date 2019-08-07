// FIXME imperfect resizing when drawer is already activated
<template>
    <v-card id="panel" v-show="shapeCanvas" v-resize.quiet="resizeCanvas">
        <v-btn class="white--text primary"
               small
               v-show="!drawingMode"
               @click="toggleDrawing">
            Draw
        </v-btn>
        <v-btn class="primary light--text"
               small
               v-show="drawingMode"
               @click="savePath">
            Save
        </v-btn>
        <v-btn class="secondary dark--text"
               small
               v-show="drawingMode"
               @click="clearPath">
            Clear
        </v-btn>
        <v-btn small
               icon
               v-show="drawingMode"
               @click="cancelDrawing">
            <v-icon>close</v-icon>
        </v-btn>
        <canvas id="shape-canvas"/>
    </v-card>
</template>

<script>
    import {mapState, mapActions} from 'vuex'
    import paper from 'paper'

    export default {
        name: "ShapeCanvas",
        data () {
            return {
                drawingMode: false,
            }
        },
        computed: {
            ...mapState({
                shapeCanvas: state => state.app.shapeCanvas,
                glyphBinder: state => state.app.glyphBinder,
                studioDrawer: state => state.app.studioDrawer
            }),
            glyphScope () {
                for (let i = 0; i < 3; i++) {
                    let scope = paper.PaperScope.get(i)
                    if (scope.view.element.id === 'glyph-canvas') {
                        return scope
                    }
                }
                throw Error("No scope bound to element 'glyph-canvas'")
            },
            shapeScope () {
                for (let i = 0; i < 3; i++) {
                    let scope = paper.PaperScope.get(i)
                    if (scope.view.element.id === 'shape-canvas') {
                        return scope
                    }
                }
                throw Error("No scope bound to element 'shape-canvas'")
            }
        },
        methods: {
            ...mapActions({
                setShapeCanvasState: 'app/setShapeCanvasState',
                setStudioDrawerState: 'app/setStudioDrawerState',
                setShapeJSON: 'glyph/setShapeJSON',
                activateSnackbar: 'app/activateSnackbar'
            }),
            initialiseTool () {
                this.shapeScope.project.layers['draw'].activate()
                const toolDown = event => {
                    // If there is no current active path then create one.
                    this.shapeScope.project.layers['draw'].activate()
                    if (!this.path && this.drawingMode) {
                        console.log("Tool activated")
                        this.path = new this.shapeScope.Path({
                            segments: [event.point],
                            closed: true,
                            strokeColor: 'black', // Select the path, so we can see its segment points
                            fullySelected: true
                        })
                        //let firstPoint = event.point;
                    }
                }
                const toolDrag = event => {
                    if (this.path && this.drawingMode) {
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
                const toolUp = event => { // eslint-disable-line no-unused-vars
                    if (this.path && this.drawingMode) {
                        // If user releases mouse near the first segment then close path
                        // let hitResult = this.path.hitTest(event.point, this.hitOptions)
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
                        this.path.translate(new this.shapeScope.Point(
                            this.shapeScope.view.center.x - this.path.bounds.center.x,
                            this.shapeScope.view.center.y - this.path.bounds.center.y
                        ))
                        console.log('Path was drawn')
                    }
                }
                this.drawGlyphTool = new this.shapeScope.Tool()
                Object.assign(this.drawGlyphTool, {
                    onMouseDown: toolDown,
                    onMouseDrag: toolDrag,
                    onMouseUp: toolUp
                })
                this.drawGlyphTool.activate() // Activate the paperJS tool.
                console.log('Tool activated')
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
            toggleDrawing () {
                if (!this.drawingMode) {
                    this.resizeCanvas()
                    this.shapeScope.activate() // activate shape canvas
                    this.initialiseTool()
                    this.drawingMode = true
                } else {
                    this.glyphScope.activate() // reactivate glyph canvas
                    this.drawGlyphTool.remove()
                    this.drawingMode = false
                }
            },
            savePath () {
                this.toggleDrawing()
                if (this.path) {
                    this.setShapeJSON(this.path.exportJSON())
                    if (this.glyphBinder) {
                        // if canvas was called by BindOptions, toggle it after saving the path
                        this.setShapeCanvasState(false)
                        this.setStudioDrawerState(false)
                    }
                    this.glyphScope.activate()
                } else {
                    this.activateSnackbar({
                        text: 'No path to save - please draw a path',
                        color: 'warning',
                        timeout: 2000
                    })
                }

            },
            clearPath () {
                if (this.path) {
                    this.path.remove()
                    this.path = null
                }
            },
            cancelDrawing () {
                this.clearPath()
                this.toggleDrawing()
            },
            resizeCanvas () {
                const panel = document.getElementById('panel')
                if (this.shapeCanvas) {
                    this.shapeScope.view.viewSize.width = panel.offsetWidth
                    this.shapeScope.view.viewSize.height = panel.offsetHeight
                }
            }
        },
        mounted() {
            const shapeScope = new paper.PaperScope()
            shapeScope.setup('shape-canvas')
            new shapeScope.Layer({name: 'draw'})
             // makes controls robust to adding new canvas
            // HACKY - but I cannot get canvas size fitting to work with css only ...
            this.resizeCanvas()
        },
        watch: {
            studioDrawer () {
                this.resizeCanvas()
            },
            shapeCanvas () {
                if (this.shapeCanvas) {
                    this.shapeScope.activate()
                } else {
                    this.glyphScope.activate()
                }
                this.resizeCanvas()
            }
        }
    }
</script>

<style scoped>
    #shape-canvas{
        background-color: white;
        border: 1px solid black;
        width: 100%; /* using fix width or height was distorting canvas scale and thus the drawn path */
        height: 100%;
        margin: auto
    }

    #panel {
        margin-top: 20px;
        height: 300px
    }
</style>
