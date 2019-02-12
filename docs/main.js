import axios from 'axios';
import showdown from 'showdown';
import hljs from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import 'highlight.js/styles/googlecode.css';
import site from './site.yaml'

console.log(site)
site.tabs.forEach(tab => tab.active = false);
site.tabs[0].active = true;
site.docs.forEach(doc => doc.active = false);
site.docs[0].active = true;

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
showdown.setFlavor('github');
let converter = new showdown.Converter();
let app = new Vue({
  el: '#site',
  data:  {
      tabs: site.tabs,
      docs: site.docs
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
    fetchPage (path) {
      this.tabs.forEach(tab => tab.active = false)
      this.tabs.filter(tab => tab.file == path)[0].active = true; 
      axios.get(path).then((res) => {
        document.getElementById('docs').innerHTML = converter.makeHtml(res.data);;
        this.highlightCode();
      })
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
})
