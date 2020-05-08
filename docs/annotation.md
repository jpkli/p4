### Annotation
Annotations on visualizations can be added using the *annotate* function.
The example below adds a vertical line to a visualization. 

```javascript
let plot = p4(config).data()
  .view({id: 'chart1', ... })
  .visualize({ ... })

// create vertical lines
plot.annotate({
  id: 'chart1',
  mark: 'rule',
  size: 3,
  color: 'red',
  x: {field: 'attribute for x', values: [...]}
})
```