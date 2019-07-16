<template>
  <v-flex xs12 sm6 class="lists-outer">
    <!--Scrolling selector for elements-->
    <span class="body-2"> {{title}} </span>
    <v-list class="lists" avatar>
      <!--https://github.com/Akryum/vue-virtual-scroller#recyclescroller-->
      <!--author changed item-height attribute to item-size without posting it in read-me ...-->
      <recycle-scroller class="scroller" :items="items"
                        :item-size="35" key-field="id" v-slot:default="{ item }">
        <v-list-tile class="tile" :class="{secondary: item.selected}"
                     @click="selectItem(item)">
          <v-list-tile-content class="tile-content">{{item.value}}</v-list-tile-content>
        </v-list-tile>
      </recycle-scroller>
    </v-list>
  </v-flex>
</template>

<script>
import {mapActions} from 'vuex'
import RecycleScroller from 'vue-virtual-scroller/src/components/RecycleScroller'

export default {
  name: 'ScrollOptions',
  components: {
    'recycle-scroller': RecycleScroller
  },
  props: {
    title: String,
    items: Array, // item: {id, value, selected}
    selected: Object
  },
  methods: {
    ...mapActions({selectGlyphEl: 'glyph/selectGlyphEl'}),
    selectItem (item) {
      this.selectedItem = item
      this.items.forEach(item => { item.selected = false })
      item.selected = true
      this.$emit('update:select', item.value) // follow guidelines https://vuejs.org/v2/guide/components-custom-events.html
    }
  }
}
</script>

<style scoped>
  .lists-outer {
    position: relative;
    height: 350px;
    z-index: 3
  }

  .lists{
    height: 100%;
    width: 80%;
  }

  .scroller {
    height: 100%;
  }

  .tile {
    height: 32%;
    padding: 0 12px;
    display: flex;
    align-items: center;
  }

  .tile-content {
    width: 100%;
    z-index: 3
  }
</style>
