<template>
    <v-card id='content' class="light elevation-5" v-resize="updateBoxRects">
        <!--<v-card-title class="title">Add new shapes and assign shapes to variables</v-card-title>-->
        <v-layout column justify-space-around>
            <v-layout row>
                <v-flex xs6 sm4>
                    <div id="drawing-box" class="canvas-box" ref="drawingBox">
                    </div>
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
                                    label="Enter glyph name"
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
                <v-flex xs6 sm3>
                    <div class="explanation-out">
                        <div class="explanation-in">
                            Click on a shape and a categorical value in order to assign the shape to the value
                        </div>
                    </div>
                    <v-select class="btn variable-selector"
                              outlined
                              :items="categoricals"
                              label="Choose feature for shape assignment"
                              v-model="selectedCategorical"
                    />
                    <v-btn class="btn close-button" depressed @click="applyShapes">
                        <v-icon color="primary">done</v-icon>
                    </v-btn>
                </v-flex>
            </v-layout>
            <v-layout>
                <v-flex xs6 sm6 class="btn">
                    <app-scroll-options id="shape-list" title="Saved shapes" :items="shapeNames"
                                        @change="loadShape" @buttonClick="removeShape"/>
                </v-flex>
                <v-flex xs6 sm6 class="btn">
                    <app-scroll-options id="value-list" title="Categorical values" :items="categoricalValues"
                                        @change="assignShape" @buttonClick="unassignShape"/>

                </v-flex>
            </v-layout>
        </v-layout>
        <!-- drawingBounds where new shape can be drawn -->
    </v-card>
</template>

<script>
    import paper from 'paper'
    import {mapState, mapActions} from 'vuex'
    import ScrollOptions from './panels/ScrollOptions'

    export default {
        name: "ShapeManager",
        components: {
            'app-scroll-options': ScrollOptions
        },
        data () {
            return {
                newShapeName: '',
                drawingMode: false,
                drawingBounds: {top: 0, bottom:0, left: 0, right: 0, width: 0, height: 0},
                drawGlyphTool: null,
                path: null,
                loadedShape: '',
                selectedCategorical: ''
            }
        },
        computed: {
            ...mapState({
                shapeJSONStore: state => state.backend.shapeJSONStore,
                fieldTypes: state => state.backend.fieldTypes,
                featuresRanges: state => state.backend.featuresRanges,
                varShapeAssignment: state => state.backend.varShapeAssignment
            }),
            shapeNames () { // names of glyph types for selection
                const shapeNames = []
                let i = 0
                for (const name of this.shapeJSONStore.keys()) {
                    shapeNames.push({
                        id: i,
                        key: name,
                        value: name,
                        selected: false,
                        button: true
                    })
                    i++
                }
                return shapeNames
            },
            categoricals () {
                const categoricals = []
                const fieldNames = Object.keys(this.fieldTypes)
                for (const fieldName of fieldNames) {
                    if (this.fieldTypes[fieldName] === String) {
                        categoricals.push(fieldName)
                    }
                }
                return categoricals
            },
            categoricalValues () {
                const categoricalValues = []
                if (this.selectedCategorical) {
                    let i = 0
                    for (const value of this.featuresRanges[this.selectedCategorical]) {
                        const valueAssignment = this.varShapeAssignment.find(
                            assignment => assignment.categoricalValue === value
                        )
                        const text = valueAssignment ? value + ` ( assigned shape: ${valueAssignment.shape} )`: value
                        categoricalValues.push({
                            id: i,
                            key: value,
                            value: text,
                            selected: false,
                            button: Boolean(valueAssignment) // button to remove shape assignment
                        })
                        i++
                    }
                }
                return categoricalValues
            }
        },
        methods: {
            ...mapActions({
                setShapeManagerState: 'app/setShapeManagerState',
                reassignGlyphLayer: 'glyph/reassignGlyphLayer',
                updateGlyphArrangement: 'app/updateGlyphArrangement',
                storeShapeJSON: 'backend/storeShapeJSON',
                activateSnackbar: 'app/activateSnackbar',
                removeShapeJSON: 'backend/removeShapeJSON',
                setVarShapeAssignment: 'backend/setVarShapeAssignment',
                activateRedrawing: 'glyph/activateRedrawing'
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
                            const [x1, y1] = [this.path.segments[p].point.x, this.path.segments[p].point.y]
                            const [x2, y2] = [this.path.segments[p+1].point.x, this.path.segments[p+1].point.y]
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
                    for (const shapeName of this.shapeNames) {
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
                        type: 'categorical'
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
            },
            removePath () {
                if (this.path) {
                    this.path.remove()
                    this.path = null
                }
            },
            loadShape (name) {
                this.removePath()
                paper.project.layers['temp'].activate()
                const path = new paper.Path()
                path.importJSON(this.shapeJSONStore.get(name))
                path.translate(new paper.Point(
                    this.drawingBounds.center.x - path.bounds.center.x,
                    this.drawingBounds.center.y - path.bounds.center.y
                ))
                path.scale(
                    0.9 * (this.drawingBounds.width / path.bounds.width),
                    0.9 * (this.drawingBounds.height / path.bounds.height)
                )
                this.path = path
                this.loadedShape = name
                this.endDrawing()
            },
            removeShape (name) {
                this.removeShapeJSON(name)
                this.removePath()
            },
            assignShape (categoricalValue) {
                const varShapeAssignment = this.varShapeAssignment.map(assignment => Object.assign({}, assignment))
                const valueAssignment = varShapeAssignment.find(
                    assignment => assignment.categoricalValue === categoricalValue &&
                        assignment.shape === this.loadedShape && assignment.field === this.selectedCategorical
                )
                if (valueAssignment) {
                    valueAssignment.categoricalValue = categoricalValue
                } else {
                    varShapeAssignment.push({
                        categoricalValue: categoricalValue,
                        shape: this.loadedShape,
                        field: this.selectedCategorical
                    })
                }
                this.setVarShapeAssignment(varShapeAssignment)
            },
            unassignShape (categoricalValue) {
                 const varShapeAssignment = this.varShapeAssignment
                    .map(assignment => Object.assign({}, assignment))
                    .filter(
                    assignment => !(assignment.categoricalValue === categoricalValue && assignment.field === this.selectedCategorical)
                )
                this.setVarShapeAssignment(varShapeAssignment)
            },
            applyShapes () {
                this.setShapeManagerState(false)
                setTimeout(function () {})
                this.activateRedrawing()
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
        width: 90%;
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
        max-width: 40%;
        margin: auto
    }

    .text-field{
        margin: auto;
    }

    #shape-list{
    }

    #value-list{
    }

    .btn{
        z-index: 4
        /*canvas is used. For input fields, need to put above canvas in z-stack
        btn class gives z-index value of 4 > 3, the canvas' value*/
    }

    .close-button{
        margin: auto;
        margin-left: 50%
    }

    .explanation-out{
        background-color: #D1C4E9;
        border: 1px solid #424242;
        color: white;
        max-width: 80%;
        margin: auto;
        text-align: justify;
        text-justify: inter-word;
    }

    .explanation-in{
        color: white;
        max-width: 95%;
        margin: auto;
        text-align: justify;
        text-justify: inter-word;
    }

    .variable-selector {
        margin: auto
    }
</style>
