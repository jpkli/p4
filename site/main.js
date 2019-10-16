import Home from './home';
import Examples from './examples';
import Tutorial from './tutorial';
import Play from './play';
import Documentation from './documentation';
import 'highlight.js/styles/googlecode.css';
import './style.css';
const routes = [
  { path: '/', component: Home },
  { path: '/examples', component: Examples },
  { path: '/tutorials', component: Tutorial },
  { path: '/play', component: Play },
  { path: '/play/:example', component: Play },
  { path: '/documentation', component: Documentation },
  { path: '/documentation/:doc', component: Documentation }
];

const router = new VueRouter({
  // mode: 'history',
  base: '/docs/',
  routes,
});

let app = new Vue({
  router,
}).$mount('#site');
