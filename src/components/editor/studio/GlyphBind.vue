<template>
<!--Space where to type name of new glyph-->
  <div>
    <v-toolbar color="dark"
               flat
               dense>
      <v-form>
        <v-layout>
          <v-flex>
            <v-text-field label="Glyph Name" v-model="inputName"/>
          </v-flex>
          <v-flex>
            <v-btn fab round small depressed light>
              <v-icon color="primary">done</v-icon>
            </v-btn>
          </v-flex>
        </v-layout>
      </v-form>
    </v-toolbar>
  </div>
</template>

<script>
export default {
  name: 'GlyphBind',
  data () {
    return {
      inputName: ''
    }
  }
}
</script>

<style scoped>

</style>
