import template from './html/play.html';
import Menu from './menu';
import site from './site.yaml';
import Split from 'split.js';
import Editor from './Editor';
// import p4 from '../';

const defaultViews = [{
  id: 'chart',
  width: 640,
  height: 420,
  padding: {left: 70, right: 10, top: 50, bottom: 60}
}];

export default {
  name: 'Examples',
  components: {Menu},
  template,
  data() {
    return {
      examples: site.examples,
      layout: null,
      editor: null,
      toolkit: null,
      inputData: null,
      dataAttributes: null,
      spec: null
    }
  },
  watch: {
    $route () {
      console.log(this.$route.params.example)
      this.example = this.$route.params.example || 'bar-chart';
      this.getSpec()
    }
  },
  created() {
    let data = this.generateSimData(80000);
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
    this.editor = Editor({containerId: 'P4-Editor'})
    this.example = this.$route.params.example || 'bar-chart';
    this.getSpec();

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