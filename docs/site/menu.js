import template from './menu.html';
import site from './site.yaml';
export default {
  name: 'Menu',
  template,
  data() {
    return {
      tabs: site.menu
    }
  },
  created() {
    this.tabs.forEach(tab => tab.active = false);
    this.tabs.filter(tab => this.$route.path.includes(tab.path)).reverse()[0].active = true;

  },
  mounted() {

  },
  methods: {

  }
}