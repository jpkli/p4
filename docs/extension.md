### Extension
P4 allows extensions for both data transformation and visualization to be added.

#### Draw on P4 Views

To create customized visualization or visual marks on top of P4 charts, users append or draw on the SVG layers of the views in a P4 *pipeline*. 

```javascript
// use p4 to visualize some plots
let pv = p4.pipeline().visualize({ ... });

// return all the views in an array
let views = pv.getViews(); 

// get the SVG DOM node in the first view
let svg = views[0].svg.node();

// use d3 to append visual marks on p4's svg layer
d3.select(svg).append(...);

```