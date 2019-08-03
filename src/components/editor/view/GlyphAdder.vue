<template>
    <v-card id='content' class="light elevation-5" v-resize="updateDrawingBoxRect">
        <v-card-text class="title">
            Add a new glyph
        </v-card-text>

        <div class="glyph-name-type">
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

        <v-btn class="btn close-button" round flat @click="setGlyphAdderState(false)">
            <v-icon color="primary">close</v-icon>
        </v-btn>

        <div id="glyph-box" ref="glyphBox">
            <v-btn class="btn white--text primary"
                   v-show="!drawingMode"
                   @click="toggleDrawing">
                Draw
            </v-btn>
            <v-btn class="btn black--text secondary"
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

    export default {
        name: "GlyphAdder",
        data () {
            return {
                newGlyphName: 'NewGlyph',
                drawingMode: false,
                boxBoundingRect: {top: 0, bottom:0, left: 0, right: 0, width: 0, height: 0},
                drawGlyphTool: null,
                path: null,
                selectedGlyphName: ''
            }
        },
        computed: {
            ...mapState({
               glyphTypes: state => state.glyph.glyphTypes
            }),
            glyphNames () { // names of glyph types for selection
                let glyphNames = []
                this.glyphTypes.forEach(glyphType => glyphNames.push(glyphType.type))
                return glyphNames
            },
        },
        methods: {
            ...mapActions({
                setGlyphAdderState: 'app/setGlyphAdderState',
                setGlyphType: 'glyph/setGlyphType'
            }),
            initialiseTool () {
                const toolDown = event => {
                    // If there is no current active path then create one.
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
                    const pointInBox = event.point.x > this.boxBoundingRect.left &&
                        event.point.x < this.boxBoundingRect.left + this.boxBoundingRect.width &&
                        event.point.y > this.boxBoundingRect.top &&
                        event.point.y < this.boxBoundingRect.top + this.boxBoundingRect.height
                    if (this.path && this.drawingMode && pointInBox) {
                        this.path.add(event.point)
                        // If the user if sufficiently clost to the intial point that the
                        // draw area will be closed upon releasing the mouse then indicate
                        // this by drawing the filled colour.
                        let hitResult = this.path.hitTest(event.point, this.hitOptions)
                        if (hitResult && hitResult.segment === this.path.firstSegment) {
                            this.path.closed = true
                            this.path.fillColor = new paper.Color(this.getColor().fill)
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
                        // and set fill.
                        let hitResult = this.path.hitTest(event.point, this.hitOptions)
                        if (hitResult && hitResult.segment === this.path.firstSegment) {
                            this.path.closed = true
                            this.path.fillColor = new paper.Color(this.getColor().fill)
                        }

                        // Deselect path.
                        this.path.selected = false

                        // The path.segments array is analyzed and replaced by a more
                        // optimal set of segments, reducing memory usage and speeding up
                        // drawing.
                        this.path.simplify()
                    }
                }

                this.drawGlyphTool = new paper.Tool()
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
            updateDrawingBoxRect () {
                if (this.$refs.glyphBox) {
                    const viewRect = document.getElementById('view').getBoundingClientRect()
                    const boxRect = this.$refs.glyphBox.getBoundingClientRect()
                    this.boxBoundingRect = {
                        top: boxRect.top - viewRect.top,
                        left: boxRect.left - viewRect.top,
                        width: boxRect.width,
                        height: boxRect.height
                    }
                }
            },
            toggleDrawing () {
                if (!this.drawingMode) {
                    this.initialiseTool()
                    this.drawingMode = true
                } else {
                    this.drawGlyphTool.remove()
                    this.drawingMode = false
                }
            },
            removePath () {
                // TODO clear path and reactivate tool so that one can keep drawing
            },
            savePath () {
                // TODO save shape to be set it as a ShapeGlyph's main path when glyph is created
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
        width: 80%;
        height: 80%;
        margin: auto;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(4, 1fr);
        align-items: center;
    }

    #glyph-box{
        background-color: white;
        border: 1px solid black;
        grid-column: 3 / 4;
        grid-row: 2 / 4;
        min-height: 250px
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

    .glyph-name-type{
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
