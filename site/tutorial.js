import showdown from 'showdown';
import hljs from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import html from 'highlight.js/lib/languages/xml';
import Menu from './menu';
import tutorialText from '../docs/tutorials.md';
import tutorialGetStarted from '../tutorials/getStarted';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('html', html);
showdown.setFlavor('github');

let converter = new showdown.Converter();
let template  = `
<div>
  <Menu />
  <div class="container p-3">
    <div id="tutorials" ref="tutorialDiv"></div>
  </div>
</div>
`;

export default {
  name: 'Tutorial',
  components: {Menu},
  template,
  created() {
  },
  mounted() {
    this.$refs.tutorialDiv.innerHTML = converter.makeHtml(tutorialText);
    this.$refs.tutorialDiv.querySelectorAll('pre code').forEach((block, i) => {
      if (i === 0) block.className = 'xml';
      hljs.highlightBlock(block);
    });
    tutorialGetStarted()
  }
}
