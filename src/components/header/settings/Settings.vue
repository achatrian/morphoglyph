<template>
  <div>
    <v-btn
      icon
      @click.native.stop="toggleSettings">
      <v-icon >
        settings
      </v-icon>
    </v-btn>

    <v-btn
      icon
      @click.native.stop="toggleSettings">
      <v-icon >
        load
      </v-icon>
    </v-btn>
  </div>
</template>

<script>
export default {
  name: 'Settings.vue'
}
</script>

<style scoped>

</style>
