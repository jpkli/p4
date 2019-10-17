### Annotation
Annotations on visualizations can be added using the *annotate* function.
The example below adds a vertical line to a visualization. 

```javascript
let plot = p4(config).data()
  .view({id: 'chart1', ... })
  .visualize({ ... })

plot.annotate({
  id: 'chart1',
  mark: 'vline',
  size: 3,
  color: 'red',
  position: {values: [...]} // this set the positions of the vlines
})
```