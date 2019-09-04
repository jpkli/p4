import site from './site.yaml'
import template from './home.html'
import Menu from './menu'

export default {
  name: 'Home',
  components: {Menu},
  template,
  data() {
    return {
      tabs: site.tabs
    }
  },
  created() {

  },
  mounted() {
    var words = [
      {text: "Data Processing", weight: 12},
      {text: "Big Data", weight: 10},
      {text: "GPU", weight: 7},
      {text: "Portable", weight: 6},
      {text: "Parallel", weight: 7},
      {text: "Processing", weight: 6},
      {text: "Pipelines", weight: 6},
      {text: "Projection", weight: 6},
      {text: "Performance", weight: 7},
      {text: "Productivity", weight: 5},
      {text: "WebGL", weight: 8},
      {text: "JavaScript", weight: 7},
      {text: "Transformation", weight: 6},
      {text: "Match", weight: 7},
      {text: "Aggregate", weight: 7},
      {text: "Group By", weight: 6},
      {text: "Binning", weight: 6},
      {text: "Histogram", weight: 5},
      {text: "Visualization", weight: 8},
      {text: "Rendering", weight: 7},
      {text: "Output", weight: 6.2},
      {text: "Derive", weight: 6},
      {text: "Filter", weight: 5},
      {text: "Sort", weight: 5},
      {text: "Fetch", weight: 5},
      {text: "Input", weight: 6},
      {text: "HTML5", weight: 8},
      {text: "JSON", weight: 8},
      {text: "Shader", weight: 6},
      {text: "GLSL", weight: 8},
      {text: "sum", weight: 4},
      {text: "count", weight: 4},
      {text: "count", weight: 4},
      {text: "average", weight: 4},
      {text: "declarative", weight: 4},
      {text: "TypedArray", weight: 7},
    ];
    
    $('#word-clouds').jQCloud(words, {
      // shape: 'rectangular',
      fontSize: [32, 30, 28, 24, 20, 16, 12]
    })
  },
  methods: {

  }
}