## Interaction

P4 also allows declarative specifications of common interactions for selecting data on visualizations.
<!-- A declarative interaction specify a pair of *action event* and *response*. An *action event* can be: hover, click, brush, zoom, and pan. A *response*  -->

```javascript
interact({event, from, response})
```

* event (String)
  An action event can be: hover, click, brush, zoom, and pan.

* from (String)
  The ID of the view that the *event* is from.

* response (Object)
  Specifications of how to update the views with the selected data from the *event*.


#### Example

```json
{
  "$interact": {
    "event": "brush",
    "from": "c1",
    "response": {
      "c1": {
        "unselected": {"color": "gray"}
      },
      "c2": {
        "selected": {"color": "orange"}
      }
    }
  }
}
```
See the example in [Online Editor](#/play/brush-link).