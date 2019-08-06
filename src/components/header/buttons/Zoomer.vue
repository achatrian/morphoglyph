<template>
    <div>
        <v-tooltip
                open-delay="700"
                bottom
        >
            <v-btn
                    icon
                    @click="zoomIn"
                    id="zoom-in"
                    slot="activator"
            >
                <v-icon color="primary">
                    zoom_in
                </v-icon>
            </v-btn>
            <span>Zoom in on glyphs</span>
        </v-tooltip>
        <v-tooltip
                open-delay="700"
                bottom
        >
            <v-btn
                    icon
                    @click="zoomOut"
                    id="zoom-out"
                    slot="activator"
            >
                <v-icon color="primary">
                    zoom_out
                </v-icon>
            </v-btn>
            <span>Zoom out from glyphs</span>
        </v-tooltip>

    </div>
</template>

<script>
import {mapState, mapActions} from 'vuex'

export default {
  name: 'Zoomer',
  data () {
    return {
      step: 0.1
    }
  },
  computed: {
    ...mapState({
      boundingRectSizeFactor: state => state.app.boundingRectSizeFactor
    })
  },
  methods: {
    ...mapActions({
      setBoundingRectSizeFactor: 'app/setBoundingRectSizeFactor',
      updateGlyphArrangement: 'app/updateGlyphArrangement'
    }),
    zoomIn () {
      const newFactor = this.boundingRectSizeFactor + this.step
      if (newFactor <= 1.0) {
        this.setBoundingRectSizeFactor(newFactor)
        this.updateGlyphArrangement()
      }
    },
    zoomOut () {
      const newFactor = this.boundingRectSizeFactor - this.step
      if (newFactor >= 0.0) {
        this.setBoundingRectSizeFactor(newFactor)
        this.updateGlyphArrangement()
      }
    }
  }
}
</script>

<style scoped>
#zoom-in{
    margin-left: 20px;
}
#zoom-out{
    margin-right: 20px;
}
</style>
2
