import template from './html/examples.html';
import Menu from './menu';
import site from './site.yaml';

export default {
  name: 'Examples',
  components: {Menu},
  template,
  data() {
    return {
      examples: site.examples
    }
  },
  created() {

  },
  mounted() {
  }
}