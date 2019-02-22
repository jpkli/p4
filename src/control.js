export default function ($p) {

    let registers = {};
    let control = {};

    let serializeArray = function(arrayOfArray) {
        return [].concat.apply([], arrayOfArray);
    }

    control.register = function(tag) {
        registers[tag] = {
            indexes: $p.indexes.slice(),
            dataSize: $p.dataSize,
            fields: $p.fields.slice(),
            fieldCount: $p.fieldCount,
            dataDim: $p.uniform.uDataDim.data.slice(),
            fieldWidths: $p.fieldWidths.slice(),
            fieldDomains: $p.fieldDomains.slice(),
            deriveCount: $p.deriveCount,
            filterFlag: $p.uniform.uFilterFlag.data,
            filterControls: $p.uniform.uFilterControls.data.slice(),
            dataInput: $p.uniform.uDataInput.data,
            attribute: {
                aDataIdx: {
                    ids: $p.attribute.aDataIdx.data,
                    value: $p.attribute.aDataValx.data
                },
                aDataIdy: {
                    ids: $p.attribute.aDataIdy.data,
                    value: $p.attribute.aDataValy.data
                },
                aDataFieldId: $p.attribute.aDataFieldId.data,
                aDataItemId: $p.attribute.aDataItemId.data
            }
        }
        return control;
    }

    control.updateRegister = function(tag, props) {
        if(registers.hasOwnProperty(tag)) {
            Object.keys(props).forEach(k => {
                registers[tag][k] = props[k];
            })
        }
        return control;
    }
    
    control.resume = function(tag) {
        if (!registers.hasOwnProperty(tag))
            throw new Error('"' + tag + '" is not found in regesters.');
    
        var reg = registers[tag];
        //resume CPU registers
        $p.indexes = reg.indexes;
        $p.dataSize = reg.dataSize;
        $p.deriveCount = reg.deriveCount;
        $p.fieldCount = reg.fieldCount;
        $p.fields = reg.fields.slice();
        $p.fieldWidths = reg.fieldWidths.slice();
        $p.fieldDomains = reg.fieldDomains.slice();
        $p.dataDimension = reg.dataDim.slice();
    
        //resume GPU Uniforms
        $p.uniform.uFieldCount.data = $p.fieldCount;
        $p.uniform.uDataSize.data = $p.dataSize;
        $p.uniform.uDataDim.data = reg.dataDim;
        $p.uniform.uIndexCount.data = reg.indexes.length;
        $p.uniform.uFieldDomains.data = serializeArray(reg.fieldDomains);
        $p.uniform.uFieldWidths.data = reg.fieldWidths;
        $p.uniform.uFilterFlag.data = reg.filterFlag;
        // $p.uniform.uFilterControls.data = reg.filterControls;
        $p.uniform.uDataInput.data = reg.dataInput;
    
        //resume GPU Attribute Buffers
        $p.attribute['aDataIdx'] = reg.attribute['aDataIdx'].ids;
        $p.attribute['aDataIdy'] = reg.attribute['aDataIdy'].ids;
        $p.attribute['aDataValx'] = reg.attribute['aDataIdx'].value;
        $p.attribute['aDataValy'] = reg.attribute['aDataIdy'].value;
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataIdx'].location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataIdy'].location, 1);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataValx'].location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataValy'].location, 1);
    
        $p.attribute['aDataFieldId'] = reg.attribute['aDataFieldId'];
        $p.attribute['aDataItemId'] = reg.attribute['aDataItemId'];
    
        return control;
    }

    // control.head = function() {
    //     control.resume('__init__');
    //     return control;
    // }

    var branchID = 0;
    control.branch = function(branches) {
        branches.forEach(function(b){
            var operations = Object.keys(b).map(function(o) {
                var obj = {};
                obj[o] = b[o];
                return obj;
            });
            control.run(operations);
            control.resume('_branch' + branchID);
        })
        branchID++;

        return control;
    }

    return control;
}
