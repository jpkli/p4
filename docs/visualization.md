## Visualization

P4 can effectively visualize the data stored or processed in GPU using different visual marks and plots.

### Visual Channels

```javascript
visualize({id, mark, channels})
```

* id (optional)
  id of the view for this visualization.

* mark
  A visual mark can be: circle, rect, bar, line.

* channels (x, y, width, height, color, opacity)
  A channel can be mapped to any original or derived data attributes for visualization. A numeric or string value can be assigned (e.g., {color: 'blue', opacity: 0.5})

#### Example

```javascript
p4(config)
  .data({ ... })
  .visualize({
    mark: 'circle',
    x: 'MotherWeight',
    y: 'BabyWeight',
    color: 'teal',
    opacity: 0.5,
    size: 8
  })
```

### View Composition

To generate more than one views, any array of visual encodings can be specified.

```json
{
  "$visualize": [
    {
      "mark": "bar",
      "color": "steelblue",
      "x": "MotherEdu",
      "height": "Babies"
    },
    {
      "mark": "line",
      "color": "steelblue",
      "x": "MotherEdu",
      "y": "AvgWeight",
      "size": 5
    }
  ]
}
```
This will generate two bar charts in a column stack ([see example here](#/play/bar-charts2)).

### Custom View Arrangement

The *view* function can be used to compose different view arrangements.

```javascript
view({id, width, height, padding, offset})
```

#### Example
```javascript
p4(config).views([
    {
      "id": "c1",
      "width": 360,
      "height": 360,
      "padding": {"left": 120, "right": 10, "top": 10, "bottom": 50},
      "offset": [380, 0]
    },
    {
      "id": "c2",
      "width": 360,
      "height": 360,
      "padding": {"left": 120, "right": 10, "top": 10, "bottom": 50},
      "offset": [0, 0]
    }
  ],
);
```
See this example in [Online Editor](#/play/brush-link).