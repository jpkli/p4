import axios from 'axios';
import showdown from 'showdown';
import hljs from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';
import site from './site.yaml';
import json from 'highlight.js/lib/languages/json';
import 'highlight.js/styles/googlecode.css';

site.docs.forEach(doc => doc.active = false);
site.docs[0].active = true;

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

    axios.get('docs.md').then((text) => {
      let html = converter.makeHtml(text.data);
      document.getElementById('docs').innerHTML = html;
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
      this.docs.filter(doc => doc.file == docFile)[0].active = true; 
      axios.get(docFile).then((res) => {
        document.getElementById('docs').innerHTML = converter.makeHtml(res.data);;
        this.highlightCode();
      })
    }
  }
}