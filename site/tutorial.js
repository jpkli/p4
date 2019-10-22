import showdown from 'showdown';
import hljs from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import html from 'highlight.js/lib/languages/xml';
import Menu from './menu';
import Footer from './footer';
import quickStart from '../tutorials/quickstart';
import axios from 'axios';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('html', html);
showdown.setFlavor('github');

let converter = new showdown.Converter();
let template  = `
<div>
  <Menu></Menu>
  <div class="container p-3">
    <div id="tutorials" ref="tutorialDiv"></div>
  </div>
  <Footer></Footer>
</div>
`;

export default {
  name: 'Tutorial',
  components: {Menu, Footer},
  template,
  created() {
  },
  mounted() {
    axios.get('docs/tutorials.md').then((res) => {
      this.$refs.tutorialDiv.innerHTML = converter.makeHtml(res.data);
      this.$refs.tutorialDiv.querySelectorAll('pre code').forEach((block, i) => {
        if (i === 0) block.className = 'xml';
        hljs.highlightBlock(block);
      });
      quickStart()
    })
  }
}
