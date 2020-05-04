<template>
    <v-card id='content' class="light elevation-5" v-resize="updateBoxRects">
        <!-- Box where glyph is displayed -->
        <div id="glyph-box" class="canvas-box" ref="glyphBox">
            <!--<v-select-->
                    <!--class="btn"-->
                    <!--:items="glyphs.map(glyph => glyph.id)"-->
                    <!--label="Select glyph to visualize"-->
                    <!--outlined-->
                    <!--v-model="selectedGlyphId"-->
                    <!--@change="viewGlyph"-->
            <!--/>-->
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
        name: "LegendViewer",
        data () {
            return {
                selectedGlyphId: '',
                glyphBoundingRect: {top: 0, bottom:0, left: 0, right: 0, width: 0, height: 0}
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
                setEditorBox: 'app/setEditorBox',
                updateGlyphArrangement: 'app/updateGlyphArrangement',
                setGlyphVisibility: 'glyph/setGlyphVisibility'
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
                // this.setEditorBox({
                //     index: this.glyphs.findIndex(glyph => glyph.id === this.selectedGlyphId),
                //     boundingRect: this.glyphBoundingRect
                // })
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
        }
    }
</script>

<style scoped>
    #content{
        width: 90%;
        height: 90%;
        margin: auto;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(4, 1fr);
        align-items: center;
    }

    .btn{
        z-index: 4
        /* canvas is used. For input fields, need to put above canvas in z-stack
        btn class gives z-index value of 4 > 3, the canvas' value */
    }

    .canvas-box{ /* class to make divs into boxes where graphics are visualised */
        background-color: white;
        border: 1px solid black;
        min-height: 250px;
        min-width: 200px;
        margin: auto
    }

    #glyph-box{
        grid-column: 1 / 2;
        grid-row: 1 / 3;
        min-height: 400px;
        min-width: 400px;
    }
</style>
