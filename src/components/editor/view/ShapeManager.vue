<template>
    <v-card id='content' class="light elevation-5" v-resize="updateBoxRects">
        <!--<v-card-title class="title">Add new shapes and assign shapes to variables</v-card-title>-->
        <app-scroll-options id="shape-list" title="Saved shapes" :items="shapeNames"
                            @change="loadShape" @buttonClick="removeShape"/>


        <app-scroll-options id="value-list" title="Categorical values" :items="categoricalValues"
                            @change="assignShape" @buttonClick="unassignShape"/>

        <v-btn class="btn close-button" round flat fab @click="setShapeManagerState(false)">
            <v-icon color="primary">close</v-icon>
        </v-btn>
        <!-- drawingBounds where new shape can be drawn -->
        <div id="drawing-box" class="canvas-box" ref="drawingBox">
        </div>

        <div class="text-fields btn">
            <v-text-field
                    style="z-index: 4"
                    label="Enter glyph name"
                    v-model="newShapeName"
            />
        </div>

        <v-select class="btn variable-selector"
                  outlined
                  :items="categoricals"
                  label="Choose feature for shape assignment"
                  v-model="selectedCategorical"
        />

        <div class="buttons">
            <!--TODO remove draw button and always allow drawing (but remove tool when possible to save run-time)-->
            <v-btn class="btn white--text primary"
                   v-show="!drawingMode"
                   @click="drawPath">
                Draw
            </v-btn>
            <v-btn class="btn white--text dark"
                   v-show="!drawingMode && loadedShape"
                   @click="editPath">
                Edit
            </v-btn>
            <v-btn class="btn primary light--text"
                   v-show="drawingMode"
                   @click="savePath">
                Save
            </v-btn>
            <v-btn class="btn secondary dark--text"
                   v-show="drawingMode"
                   @click="removePath">
                Clear
            </v-btn>
        </div>
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
                for (let name of this.shapeJSONStore.keys()) {
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
                for (let fieldName of fieldNames) {
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
                    for (let value of this.featuresRanges[this.selectedCategorical]) {
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
                setVarShapeAssignment: 'backend/setVarShapeAssignment'
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
            editPath () {
                this.initialiseTool()
                this.drawingMode = true
                this.newShapeName = this.loadedShape
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
                        shapeJSON: this.path.exportJSON()
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
        height: 80%;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(4, 1fr);
        align-items: center;
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
        width: 75%;
        height: 0%;
        padding-top: 75%;
        grid-column: 1 / 3;
        grid-row: 1 / 5;
    }

    #shape-list{
        grid-column: 3 / 4;
        grid-row: 3 / 5;
        height: 100%;
        margin: auto
    }


    .btn{
        z-index: 4
        /*canvas is used. For input fields, need to put above canvas in z-stack
        btn class gives z-index value of 4 > 3, the canvas' value*/
    }

    .title{
        grid-column: 3 / 4;
        grid-row: 1 / 2
    }

    .text-fields{
        grid-column: 3 / 4;
        grid-row: 2 / 3;
        margin: auto;
        max-width: 200px
    }

    .close-button{
        grid-column: 4 / 5;
        grid-row: 1 / 2;
        margin: auto
    }

    .buttons{
        display: flex;
        justify-content: center;
        align-items: center;
        grid-column: 3 / 4;
        grid-row: 1 / 2;
        margin: auto
    }

    .variable-selector{
        grid-column: 4 / 5;
        grid-row: 2 / 3;
        margin: auto
    }

    #value-list{
        grid-column: 4 / 5;
        grid-row: 3 / 5;
        max-height: 100%;
        margin: auto
    }
</style>
