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
    this.tabs.find(tab => tab.path === this.$route.path).active = true;

  },
  mounted() {

  },
  methods: {

  }
}