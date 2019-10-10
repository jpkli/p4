import Home from './site/home'
import Examples from './site/examples'
import Documentation from './site/documentation'
import 'highlight.js/styles/googlecode.css'
const routes = [
  { path: '/', component: Home },
  { path: '/examples', component: Examples },
  { path: '/documentation', component: Documentation },
  { path: '/documentation/:doc', component: Documentation }
]

const router = new VueRouter({
  // mode: 'history',
  base: '/docs/',
  routes,
})

let app = new Vue({
  router,
}).$mount('#site')
