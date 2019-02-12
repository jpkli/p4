### Annotation
To annotate visualizations, P4 provides a set of annotation functions. 

The example below adds a vertical line to a visualization. 

```javascript

let plot = p4.pipeline().data()
  .view({id: 'chart1', ... })
  .visualize({ ... })

plot.annotate({
  id: 'chart1',
  mark: 'vline',
  size: 3,
  color: 'red'
})

```