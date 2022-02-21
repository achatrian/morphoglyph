<template>
    <v-card id='content' class="light elevation-5" v-resize="updateBoxRects">
        <v-card-text class="title">
            Add a new glyph
        </v-card-text>

        <div class="text-fields btn">
            <v-text-field
                    label="Enter glyph name"
                    v-model="newGlyphName"
            />
            <v-select
                    :items="glyphNames"
                    label="Choose glyph type"
                    v-model="selectedGlyphName"
                    @change="glyphTypeSetter"
            />
            <v-select
                    class="selector"
                    outlined
                    :items="glyphSettings.options"
                    :label="glyphSettings.message || 'Choose glyph-specific options'"
                    v-model="selectedGlyphSetting"
                    @change="glyphSettingsSetter"
            />
            <v-btn class="btn add-button dark white--text"
                   small
                   @click="addNewGlyph"
            >
                Add
            </v-btn>
        </div>

        <v-btn class="btn close-button" round flat @click="setGlyphAdderState(false)">
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
    </v-card>
</template>

<script>
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
            height: targetHeight
        }
    }

    export default {
        name: "GlyphPreview",
        data () {
            return {
                newGlyphName: '',
                selectedGlyphName: '',
                selectedGlyphId: '',
                selectedGlyphSetting: '',
                glyphBoundingRect: {top: 0, bottom:0, left: 0, right: 0, width: 0, height: 0},
                leftShift: 0.0,
                topShift: 0.0,
                widthProportion: 1.0,
                heightProportion: 1.0
            }
        },
        computed: {
            ...mapState({
                glyphs: state => state.glyph.project.glyphs,
                glyphTypes: state => state.glyph.glyphTypes,
                glyphSettings: state => state.glyph.glyphSettings
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
                setGlyphType: 'glyph/setGlyphType',
                reassignGlyphLayer: 'glyph/reassignGlyphLayer',
                setEditorBox: 'app/setEditorBox',
                updateGlyphArrangement: 'app/updateGlyphArrangement',
                activateRedrawing: 'glyph/activateRedrawing',
                setGlyphVisibility: 'glyph/setGlyphVisibility',
                setStudioDrawerState: 'app/setStudioDrawerState',
                setShapeCanvasState: 'app/setShapeCanvasState',
                addDataBoundGlyphs: 'glyph/addDataBoundGlyphs'
            }),
            updateBoxRects () {
                if (this.selectedGlyphId) {
                    // toggle glyph and re-activate after timeout
                    this.setGlyphVisibility({
                        value: false,
                        glyphSelector: this.selectedGlyphId
                    })
                    // this in arrow function is the same as in surrounding function
                    setTimeout(() => this.setGlyphVisibility({value: true, glyphSelector: this.selectedGlyphId}), 1000)
                }
                const canvasRect = document.getElementById('glyph-canvas').getBoundingClientRect()
                const glyphBoxRect = this.$refs.glyphBox.getBoundingClientRect()
                this.glyphBoundingRect = rectInARect({
                    left: glyphBoxRect.left - canvasRect.left,
                    top: glyphBoxRect.top - canvasRect.top,
                    x: glyphBoxRect.left - canvasRect.left,
                    y: glyphBoxRect.top - canvasRect.top,
                    width: glyphBoxRect.width,
                    height: glyphBoxRect.height
                }, 0.7)
                // update box in state, so that glyph can be visualised inside its box
                this.setEditorBox({
                    index: this.glyphs.findIndex(glyph => glyph.id === this.selectedGlyphId),
                    boundingRect: this.glyphBoundingRect
                })
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
            },
            // method that triggers creation of a new glyph
            addNewGlyph () {
                this.addDataBoundGlyphs({
                    newGlyphName: this.newGlyphName,
                    glyphTypeName: this.selectedGlyphName // FIXME confusion between type and type name
                })
                console.log(`Adding new glyph: ${this.newGlyphName}`)
            },
            // functions called on change of selectors
            glyphTypeSetter (glyphName) {
                if (this.selectedGlyphName !== 'None') {
                    this.setGlyphType({glyphTypeName: glyphName, glyphSetting: this.selectedGlyphSetting})
                }
            },
            glyphSettingsSetter (glyphSetting) {
                // same as above, to update setting when needed
                if (this.selectedGlyphName !== 'None') {
                    this.setGlyphType({glyphTypeName: this.selectedGlyphName, glyphSetting: glyphSetting})
                }
                // activate drawing dialog if option is
                if (this.glyphSettings.name === 'shapeType' && glyphSetting === 'custom') {
                    this.setStudioDrawerState(true)
                    this.setShapeCanvasState(true)
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

    .canvas-box{ /* class to make divs into boxes where graphics are visualised */
        background-color: white;
        border: 1px solid black;
        min-height: 250px;
        min-width: 200px;
        margin: auto
    }

    #glyph-box{
        grid-column: 2 / 4;
        grid-row: 1 / 4;
        min-height: 400px;
        min-width: 400px;
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
        grid-row: 2 / 4;
        margin: auto;
        max-width: 300px
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
