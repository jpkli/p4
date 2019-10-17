import template from './html/examples.html';
import Menu from './menu';
import site from './site.yaml';
import Footer from './footer';

export default {
  name: 'Examples',
  components: {Menu, Footer},
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