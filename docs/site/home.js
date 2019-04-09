
import site from './site.yaml';

import template from './home.html';
import Menu from './menu'

export default {
  name: 'Home',
  components: {Menu},
  template,
  data() {
    return {
      tabs: site.tabs
    }
  },
  created() {


  },
  mounted() {

  },
  methods: {

  }
}