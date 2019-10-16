import template from './html/menu.html';
import site from './site.yaml';
export default {
  name: 'Menu',
  template,
  props: {
    fullWidth: Boolean
  },
  data() {
    return {
      tabs: site.menu
    }
  },
  computed: {
    menuClass () {
      return (this.fullWidth) ? 'container-fullwidth' : 'container';
    },
    leftTabs () {
      return this.tabs.filter(tab => tab.position === 'left');
    },
    rightTabs () {
      return this.tabs.filter(tab => tab.position === 'right');
    }
  },
  created() {
    this.tabs.forEach(tab => tab.active = false);
    this.tabs.filter(tab => this.$route.path.includes(tab.path)).reverse()[0].active = true;

  }
}