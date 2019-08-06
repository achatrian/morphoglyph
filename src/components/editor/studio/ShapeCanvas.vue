<template>
    <v-card class="panel" v-if="shapeCanvas">
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
               @click="cancelDrawing">
            Cancel
        </v-btn>
        <canvas id="shape-canvas"/>
    </v-card>
</template>

<script>
    import {mapState} from 'vuex'
    import paper from 'paper'

    export default {
        name: "ShapeCanvas",
        data () {
            return {
                drawingMode: false,
                scope: null
            }
        },
        computed: {
            ...mapState({
                shapeCanvas: state => state.app.shapeCanvas
            })
        },
        methods: {
            initialiseTool () {
                this.scope.project.layers['draw'].activate()
                const toolDown = event => {
                    // If there is no current active path then create one.
                    this.scope.project.layers['draw'].activate()
                    if (!this.path && this.drawingMode) {
                        console.log("Tool activated")
                        this.path = new this.scope.Path({
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
                this.drawGlyphTool = new this.scope.Tool()
                Object.assign(this.drawGlyphTool, {
                    onMouseDown: toolDown,
                    onMouseDrag: toolDrag,
                    onMouseUp: toolUp
                })
                this.drawGlyphTool.activate() // Activate the paperJS tool.
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
                    this.initialiseTool()
                    this.drawingMode = true
                    this.scope.activate()
                } else {
                    this.drawGlyphTool.remove()
                    this.drawingMode = false
                }
            },
            savePath () {

            },
            cancelDrawing () {
                if (this.path) {
                    this.path.remove()
                    this.path = null
                }
                this.scope.PaperScope.get(0).activate() // reactivate glyph canvas
                this.drawGlyphTool.remove()
                this.drawingMode = false
            }
        },
        mounted() {
            this.scope = new paper.PaperScope()
            this.scope.setup('shape-canvas')
            new this.scope.Layer({name: 'draw'})
        }
    }
</script>

<style scoped>
    #shape-canvas{
        background-color: white;
        border: 1px solid black;
        min-height: 250px;
        min-width: 200px;
        margin: auto
    }

    .panel {
        margin-top: 20px;
    }
</style>
