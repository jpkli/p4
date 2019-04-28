import { assert } from 'chai';
import cstore from '../src/cstore';
import p4 from '../';

export default function({
    data,
    schema,
    precision
}) {
  let db = cstore();
  db.import({
      data: data,
      schema: schema
  });

  let config = {
      container: "p4",
      viewport: [800, 450]
  };

  let specBinning = [
    {
        $match: {
            MotherAge: [20, 23]
        }
    },
    {
        $aggregate: {
            $bin: [{'MotherAge': 15}],
            // $group: ['MotherAge', 'MotherRace'],
            // $group: 'MotherEdu',
            $reduce: {
                value: {$count: 'MotherWeight'},
            }
        }
    }, 
    {
        $visualize: {
            id: 'v1',
            mark: 'bar',
            x: 'MotherAge',
            // y: 'FatherAge',
            color: 'red',
            height: 'value',
            brush: {
                condition: {x: true},
                unselected: {
                    color: 'gray'
                }
            }
            // size: 5
            // zero: true
        }
    }
  ]

  let gpu = p4(config).data(db.data()).view(views);

  describe('Group-by categorical attribute', function() {
      let gpuResult = gpu.head().runSpec(specBinning).result('row');
      // console.log(gpuResult)
  });

}