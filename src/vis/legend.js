import Svg from './svg';
import Axis from './axis';
import printformat from './format';

const defaultColors = ['white', 'steelblue'];
const defaultSize = 20;
var gradID = 0;

export default function color(arg){
  var gradientID = gradID++;

  var option = arg || {},
    container = option.container || null,
    width = option.width || null,
    height = option.height || null,
    pos = option.pos ||[0, 0],
    dim = option.dim || 'x',
    padding = option.padding || {left: 0, right: 0, top: 0, bottom: 0},
    label = option.label || false,
    colors = option.colors || defaultColors,
    domain = option.domain || ['min', 'max'],
    format = option.format || printformat('.3s');


  if(colors.length < 2) colors = defaultColors;
  width -= padding.left + padding.right;
  height -= padding.top + padding.bottom;

  var legend = (container === null)
    ? new Svg({width: width, height: height, padding: padding})
    : container.append('g');

  var gradDirection;
  if(dim == 'x') {
    gradDirection = {x1: 0, x2: 1, y1: 0, y2: 0};
    if(height === null) height = defaultSize;
  } else {
    gradDirection = {x1: 0, x2: 0, y1: 0, y2: 1};
    if(width === null) width = defaultSize;
  }

  function linearGradient(colors) {
    var gradient = legend.append('defs')
      .append('linearGradient')
        .attr('id', 'gradlegend'+gradientID)
        .attr(gradDirection);

    colors.forEach(function(c, i){
      gradient.append('stop')
        .attr('offset', i / (colors.length-1))
        .attr('stop-color', colors[colors.length-i-1]);
    });
    return gradient;
  }

  var grad = linearGradient(colors);

  var rect = legend.append('g');

  var colorScale = rect.append('rect')
    .attr('width', width-padding.left)
    .attr('height', height)
    .style('fill','url(#gradlegend' + gradientID + ')');

  var domainLabel = legend.append('text');
  if(label) {
    label.append('text')
      .attr('x', pos[0] - 5)
      .attr('y', pos[1] + height/2 + 5)
      .style('fill', '#222')
      .style('text-anchor', 'end')
      .text(printformat('2s')(domain[0]));

    legend.append('text')
      .attr('x', pos[0] + width - padding.left + 5)
      .attr('y', pos[1] + height/2 + 5)
      .style('fill', '#222')
      .style('text-anchor', 'begin')
      // .style('font-size', '.9em')
      .text(printformat('2s')(domain[1]));
  }

  if(option.title) {
    legend.append('g')
      .append('text')
      .attr('y', pos[1] - padding.top)
      .attr('x', pos[0] + width/2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text(option.title);
  }

  if(dim == 'x') {
    new Axis({
      dim: 'x',
      domain: domain,
      container: legend,
      align: 'bottom',
      ticks: Math.floor(width / 30),
      height: height,
      width: width,
      labelPos: {x: 0, y: -20},
      format: format,
    });
  } else {
    new Axis({
      dim: 'y',
      domain: domain,
      container: legend,
      align: 'right',
      ticks: Math.floor(height / 30),
      height: height,
      width: width,
      labelPos: {x: 10, y: -5},
      tickPosition: [5, 0],
      format: format,
    });
  }


  // legend.appendChild(xAxis);

  legend.translate(pos[0]+padding.left, pos[1]+padding.top);

  // legend.update = function(newDomain, newColors) {
  //
  //     legend.removeChild(xAxis);
  //     xAxis = new Axis({
  //         dim: 'x',
  //         domain: newDomain,
  //         container: legend,
  //         align: 'bottom',
  //         ticks: 4,
  //         // tickInterval: 10000000,
  //         labelPos: {x: -5, y: -20},
  //          padding: padding,
  //         width: width-padding.left,
  //         format: format,
  //     }).show();
  //
  //     if(typeof(newColors) != 'undefined') {
  //         grad.remove();
  //         grad = linearGradient(newColors);
  //         colorScale.css('fill','url(#gradlegend' + gradientID + ')');
  //
  //     }
  //     // legend.appendChild(xAxis);
  //
  //     return legend;
  // }

  return legend;
}
