import Vue from 'vue'
import Router from 'vue-router'
// import Dashboard from '../components/Dashboard'
import Editor from '../components/editor/Editor'

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            name: 'Dashboard',
            component: Editor
        }
    ]
})
