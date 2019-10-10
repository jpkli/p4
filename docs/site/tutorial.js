import axios from 'axios'
import showdown from 'showdown'
import hljs from 'highlight.js/lib/highlight'
import javascript from 'highlight.js/lib/languages/javascript'

import json from 'highlight.js/lib/languages/json'



hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
showdown.setFlavor('github');
let converter = new showdown.Converter();

import template from './documentation.html';
import Menu from './menu'

export default {
  name: 'Documentation',
  components: {Menu},
  template,
  data() {
    return {
      tabs: site.tabs,
      docs: site.docs
    }
  },
  created() {

  },

  mounted() {
    // let doc = window.location.href.split('#').pop() || 'overview'
    // if (doc === '/documentation') {
    //   doc = 'overview'
    // }

    axios.get('usage.md').then((text) => {
      let html = converter.makeHtml(text.data)
      this.$refs.docContainer.innerHTML = html
      this.highlightCode();
    });
  },
  methods: {
    highlightCode () {
      document.querySelectorAll('#docs pre code').forEach((block) => {
        hljs.highlightBlock(block);
      });
    },
    fetchDoc (docFile) {
      this.docs.forEach(doc => doc.active = false)
      console.log(docFile, this.docs.map(doc => doc.file))
      this.docs.filter(doc => doc.file == docFile)[0].active = true
      axios.get('/docs/' + docFile).then((res) => {
        this.$refs.docContainer.innerHTML = converter.makeHtml(res.data)
        this.highlightCode();
      })
    }
  }
}
