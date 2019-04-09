import Home from './site/home'
import Examples from './site/examples'
import Documentation from './site/documentation'
const routes = [
  { path: '/', component: Home },
  { path: '/examples', component: Examples },
  { path: '/documentation', component: Documentation }
]

const router = new VueRouter({
  routes
})

let app = new Vue({
  router,
}).$mount('#site')
