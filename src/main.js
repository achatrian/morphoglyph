// The Vue build version to buttons with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueVirtualScroller from 'vue-virtual-scroller'

// app elements
import App from './App'
import router from './router'
import store from './store'

// Vuetify content
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
// import colors from 'vuetify/es5/util/colors'

// Icons used by vuetify components
import 'material-design-icons-iconfont/dist/material-design-icons.css' // Ensure you are using css-loader

Vue.use(Vuetify, {
  theme: {
    light: '#EEEEEE',
    dark: '#424242',
    primary: '#673AB7',
    secondary: '#D1C4E9',
    accent: '#651FFF'
  }
})
Vue.use(VueVirtualScroller)
Vue.config.productionTip = false // change when ready for production

// array iterator becoming undefined ?
window.arrayIter = Array.prototype[Symbol.iterator]



/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
