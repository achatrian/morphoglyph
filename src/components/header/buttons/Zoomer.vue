<template>
    <div>
        <v-btn
                icon
                @click="zoomIn"
                id="zoom-in"
        >
            <v-icon color="primary">
                zoom_in
            </v-icon>
        </v-btn>
        <v-btn
                icon
                @click="zoomOut"
                id="zoom-out"
        >
            <v-icon color="primary">
                zoom_out
            </v-icon>
        </v-btn>
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
      updateGrid: 'app/updateGrid'
    }),
    zoomIn () {
      const newFactor = this.boundingRectSizeFactor + this.step
      if (newFactor <= 1.0) {
        this.setBoundingRectSizeFactor(newFactor)
        this.updateGrid()
      }
    },
    zoomOut () {
      const newFactor = this.boundingRectSizeFactor - this.step
      if (newFactor >= 0.0) {
        this.setBoundingRectSizeFactor(newFactor)
        this.updateGrid()
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
