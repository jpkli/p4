import axios from 'axios';
import showdown from 'showdown';
import hljs from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';
import site from './site.yaml';
import json from 'highlight.js/lib/languages/json';

site.docs.forEach(doc => doc.active = false);
site.docs[0].active = true;

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
showdown.setFlavor('github');
let converter = new showdown.Converter();

import template from './html/documentation.html';
import Menu from './menu';

export default {
  name: 'Documentation',
  components: {Menu},
  template,
  data() {
    return {
      docs: site.docs
    }
  },
  created() {
  },
  watch: {
    $route (to, from) {
      // react to route changes...
      let doc = to.path.split('/').pop();
      this.fetchDoc(doc + '.md');
    }
  },
  mounted() {
    let doc = this.$route.params.doc || 'overview';
    this.fetchDoc(doc + '.md');
  },
  methods: {
    highlightCode () {
      document.querySelectorAll('#docs pre code').forEach((block) => {
        hljs.highlightBlock(block);
      });
    },
    fetchDoc (docFile) {
      this.docs.forEach(doc => doc.active = false)
      this.docs.filter(doc => doc.file == docFile)[0].active = true; 
      axios.get('/docs/' + docFile).then((res) => {
        this.$refs.docContainer.innerHTML = converter.makeHtml(res.data);;
        this.highlightCode();
      })
    }
  }
}
