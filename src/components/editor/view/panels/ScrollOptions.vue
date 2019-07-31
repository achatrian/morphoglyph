<template>
  <div class="lists-outer">
    <!--Scrolling selector for elements-->
    <div class="title" style="margin-left: 30px">
      {{title}}
    </div>
    <v-list class="lists" avatar>
      <!--https://github.com/Akryum/vue-virtual-scroller#recyclescroller-->
      <!--author changed item-height attribute to item-size without posting it in read-me ...-->
      <recycle-scroller class="scroller" :items="items"
                        :item-size="30" key-field="id" v-slot:default="{ item }">
        <v-list-tile class="tile" :class="{secondary: item.selected}"
                     @click="selectItem(item)">
          <v-list-tile-content class="tile-content">{{item.value}}</v-list-tile-content>
        </v-list-tile>
      </recycle-scroller>
    </v-list>
  </div>
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
    z-index: 3;
  }
  .lists{
    height: 90%;
    width: 80%;
    margin: auto
  }
  .scroller {
    height: 100%;
  }
  .tile-content {
    width: 100%;
    z-index: 3
  }
</style>
