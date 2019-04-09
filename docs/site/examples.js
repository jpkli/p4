
import site from './site.yaml';

import template from './examples.html';
import Menu from './menu'

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
    console.log(this.examples)

  },
  mounted() {

  },
  methods: {

  }
}