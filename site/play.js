import template from './html/play.html';
import Menu from './menu';
import Footer from './footer';
import site from './site.yaml';
import Split from 'split.js';
import Editor from './Editor';

const defaultViews = [{
  id: 'chart',
  width: 640,
  height: 420,
  padding: {left: 70, right: 10, top: 50, bottom: 60}
}];

export default {
  name: 'Examples',
  components: {Menu, Footer},
  template,
  data() {
    return {
      examples: site.examples,
      layout: null,
      editor: null,
      toolkit: null,
      inputData: null,
      dataAttributes: null,
      dataSize: 100000,
      spec: null
    }
  },
  watch: {
    $route () {
      this.example = this.$route.params.example || 'bar-chart';
      this.getSpec()
    }
  },
  created() {
    let data = this.generateSimData(this.dataSize);
    this.dataAttributes= Object.entries(data.schema);
    this.inputData = data.data;
  },
  mounted() {
    this.layout = Split(['#P4-Editor', '#P4-Results'], {
      sizes: [40, 60],
      minSize: 280,
      gutterSize: 3,
      onDrag: () => {
        this.editor.resize()
      }
    })

    this.editor = Editor({containerId: 'P4-Editor', dataAttributes: this.dataAttributes.map(a => a[0])});
    this.example = this.$route.params.example || 'bar-chart';
    this.getSpec();

    // p4 is loaded externally
    this.toolkit = p4({
      container: this.$refs.visContainer,
      viewport: [800, 650],
      padding: {left: 70, right: 10, top: 50, bottom: 60}
    })
    .data(this.inputData)

  },
  methods: {
    generateSimData (dataSize) {
      let babies = new p4.datasets.Babies(dataSize);
      let db = p4.cstore();
      db.import({
        data: babies.data,
        schema: babies.schema
      });
      return {
        schema: babies.schema,
        data: db.data()
      };
    },

    getSpec () {
      if (this.example) {
        p4.ajax.get({
          url: 'examples/' + this.example + '.json',
          dataType: 'text'
        }).then(text => {
          this.editor.setValue('');
          this.editor.setValue(text)
          this.spec = JSON.parse(text);
          this.editor.getSession().selection.clearSelection();
          this.processData()
        })
      }
    },

    processData () {
      if (this.spec.hasOwnProperty('views')) {
        this.toolkit.view(this.spec.views);
      } else {
        this.toolkit.view(defaultViews);
      }
      this.toolkit.runSpec(this.spec.operations);
    },

    updateSpec () {
      this.spec = JSON.parse(this.editor.getValue());
      this.processData();
    }
  }
}