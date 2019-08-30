<template>
  <div class="lists-outer">
    <!--Scrolling selector for elements-->
    <div class="title" style="margin-left: 10%">
      {{title}}
    </div>
    <v-list class="lists" avatar dense>
      <!--https://github.com/Akryum/vue-virtual-scroller#recyclescroller-->
      <!--author changed item-height attribute to item-size without posting it in read-me ...-->
      <recycle-scroller class="scroller"
                        :items="items"
                        :item-size="40"
                        key-field="id"
                        #default="{ item }">
        <v-list-tile class="tile"
                     :class="{secondary: item.selected}"
                     @click="selectItem(item)">
          <v-list-tile-content class="tile-content">
              {{item.value}}
          </v-list-tile-content>
          <v-list-tile-content>
            <v-list-tile-action>
              <v-btn icon
                     v-if="item.button"
                     @click="onButtonClick(item)"
              >
                <v-icon>close</v-icon>
              </v-btn>
            </v-list-tile-action>
          </v-list-tile-content>
        </v-list-tile>
        <!-- TODO check: An attempt was made to use v-list-item (vuetify>2.0) but this did not work-->
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
  data () {
    return {
      lastItem: '',
    }
  },
  props: {
    title: String,
    titleFontClass: {
      type: String,
      default: 'title'
    },
    items: Array, // item: {id, value, selected}
    selected: Object
  },
  methods: {
    ...mapActions({selectGlyphEl: 'glyph/selectGlyphEl'}),
    selectItem (item) {
      this.selectedItem = item
      this.items.forEach(item => { item.selected = false })
      item.selected = true
      if (this.lastItem !== item.key) {
        this.$emit('update:select', item.key) // follow guidelines https://vuejs.org/v2/guide/components-custom-events.html
        this.$emit('change', item.key)
        this.lastItem = item.key
      }
    },
    onButtonClick (item) {
      this.$emit('buttonClick', item.key)
      setTimeout(function () { // avoids triggering cycle of events in parent component
        this.lastItem = ''
      }.bind(this), 150)
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
  .tile{
    padding: 0 12px;
  }
  .tile-content {
    width: 100%;
    z-index: 3
  }
</style>
