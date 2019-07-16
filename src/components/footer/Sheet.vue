<template>
  <v-bottom-sheet v-model="sheet">
    <template v-slot:activator>
      <v-btn
        color="primary"
        dark
        small
      >
        View Data
      </v-btn>
    </template>
    <app-table/>
  </v-bottom-sheet>
</template>

<script>
import Table from './Table'

export default {
  name: 'Sheet',
  components: {
    'app-table': Table
  },
  data () {
    return {
      sheet: false
    }
  }
}
</script>

<style scoped>

</style>
