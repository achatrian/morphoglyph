<template>
    <v-card class="light elevation-5" style="overflow: auto">
        <v-container fluid id="lists-container">
            <v-layout column>
                <v-flex>
                    <v-card-title>
                        Create a new glyph
                    </v-card-title>
                </v-flex>
                <v-layout row>
                    <v-input>

                    </v-input>
                </v-layout>
                <v-layout>
                    <v-flex>
                        <canvas id="new-glyph-canvas" v-if="drawingMode"></canvas>
                    </v-flex>
                </v-layout>
            </v-layout>
        </v-container>
    </v-card>
</template>

<script>
    import paper from 'paper'

    export default {
        name: "GlyphAdder",
        data () {
            return {
                drawingMode: false,
                drawGlyphTool: null,
                path: null,
            }
        },
        methods: {
            initialiseTool () {
                // Prepare PaperJS canvas for interaction.
                paper.setup('new-glyph-canvas')

                // Activate the paperJS tool.
                this.drawGlyphTool.activate()

                // Set tool stroke width and hitOptions settings.
                this.strokeWidth = (this.imageWidth * this.strokeScale) / (this.viewportZoom * 1000)
                this.hitOptions = {
                    segments: true,
                    tolerance: this.strokeWidth
                }

                // The distance the mouse has to be dragged before an event is fired
                // is dependent on the current zoom level
                this.drawGlyphTool.minDistance = this.strokeWidth
            }
        },
        created () {
            const toolDown = event => {
                // If there is no current active path then create one.
                if (!this.path || !this.path.data.active) {
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
            const toolUp = event => {
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

                // Ensure this path is no longer the active path to be edited.
                this.path.data.active = false
            }

            this.drawGlyphTool = new paper.Tool()
            this.drawGlyphTool.onMouseDown = toolDown
            this.drawGlyphTool.onMouseDraw = toolDrag
            this.drawGlyphTool.onMouseUp = toolUp
        },
        beforeDestroy () {
            this.drawGlyphTool.remove()
        }
    }
</script>

<style scoped>
    #lists-container{
        display: flex;
        flex: 1 1 auto;
        justify-content: center;
        align-content: stretch;
        height: 80%;
    }
</style>
