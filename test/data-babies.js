import { randomJSONs, randomArrays } from './utils';

let educations = ['High School', 'Some College', 'AA/AS', 'Bachelor', 'Master', 'Doctorate']
let races = ['White', 'Asian', 'Black', 'Mixed'];

let dataProps = [
    {name: 'BabyMonth', dtype: 'int', dist: 'uniform', min: 1, max: 12},
    {name: 'BabyGender', dtype: 'string', values: ['F', 'M']},
    {name: 'BabyWeight', dtype: 'float', dist: 'normal', min: 2, max: 20, mean: 7, std: 2},
    {name: 'MotherAge', dtype: 'int', dist: 'normal', min: 16, max: 70, mean: 30, std: 10},
    {name: 'MotherRace', dtype: 'string', values: races},
    {name: 'MotherStatus', dtype: 'string', values: ['Married', 'Unmarried']},
    {name: 'MotherEdu', dtype: 'string', values: educations},
    {name: 'MotherHeight', dtype: 'float', dist: 'normal', min: 120, max: 220, mean: 168, std: 20},
    {name: 'MotherWeight', dtype: 'float', dist: 'normal', min: 50, max: 290, mean: 100, std: 50},
    {name: 'MotherWgtGain', dtype: 'float', dist: 'normal', min: 0, max: 100, mean: 30, std: 10},
    {name: 'FatherAge', dtype: 'int', dist: 'normal', min: 16, max: 90, mean: 32, std: 10},
    {name: 'FatherRace', dtype: 'string', values: races},
    {name: 'FatherEdu', dtype: 'string', values: educations}
];

let schema = {};
for(let prop of dataProps) {
    schema[prop.name] = prop.dtype;
}

function Babies(arg) {
    let dataSize = (Number.isInteger(arg)) ? arg : arg.size;
    let props = arg.props || dataProps;
    let type = arg.type || 'json';
    let data = (type === 'json') ? randomJSONs({props: props, size: dataSize}): randomArrays({props: props, size: dataSize});
    return { data, schema };
}

Babies.schema = schema;

export default Babies;