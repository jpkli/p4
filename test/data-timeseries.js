import {boundedRandom} from './utils';

export default function ({
  timesteps = 128,
  series = 8,
  interval = 1,
  props,
  label = {time: 'timestamp', series: 'sid'}
}) {
  let dsize = timesteps * series;
  let data = new Array(dsize);
  for(let i = 0; i < timesteps; i++) {
    for(let j = 0; j < series; j++) {
      let record = {};
      record[label.time] = i * interval;
      record[label.series] = j;
      for(let prop of props) {
          if(prop.hasOwnProperty('values')){
              let vid = parseInt( Math.round( Math.random() * (prop.values.length - 1) ) );
              record[prop.name] = prop.values[vid];
          } else {
              let value = boundedRandom(prop);
              record[prop.name] = (prop.dtype == 'float') ? parseFloat(value) : Math.round(value);
          }
      }
      data[i * series + j] = record;
    }
  }

  let schema = {};
  schema[label.time] = 'int';
  schema[label.series] = 'float';
  for(let prop of props) {
      schema[prop.name] = prop.dtype;
  }

  return {
    data,
    schema
  }
}