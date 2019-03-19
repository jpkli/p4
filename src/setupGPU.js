import {getData, getNonIndexedData} from './gljs/Fetch.gl';

export default function($p) {
  $p.attribute("aDataItemVal0", "float", null);
  $p.attribute("aDataItemVal1", "float", null);
  $p.attribute("aDataItemId", "float", new Float32Array($p.dataSize).map((d,i)=>i));
  $p.attribute("aDataFieldId", "vec2", new Float32Array($p.fields.length * 2).map((d,i)=>i));
  $p.attribute("aVertexId", "float", [0, 1, 2, 3, 4, 5]);
  $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aVertexId.location, 0);
  $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataFieldId.location, 0);
  $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);

  $p.attribute("_square", "vec2",
      new Float32Array([
          -1.0, -1.0, 1.0, -1.0, 
          -1.0, 1.0, -1.0, 1.0,
          1.0, -1.0, 1.0, 1.0
      ])
  );
  $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute._square.location, 1);

  let filterControls = new Array($p.fieldCount).fill(0);
  //setup all attribute, uniform, texture, varying needed by all the shaders
  $p.uniform("uDataSize",    "float", $p.dataSize);
  $p.uniform("uDataDim",     "vec2",  $p.dataDimension);
  $p.uniform("uResultDim",   "vec2",  $p.dataDimension);
  $p.uniform("uIndexCount",  "int",   $p.indexes.length);
  $p.uniform("uFieldWidths", "float", $p.fieldWidths);
  $p.uniform("uFieldCount",  "int",   $p.fieldCount);
  $p.uniform("uFieldDomains", "vec2",  $p.fieldDomains);
  $p.uniform("uFieldId",     "int",   0);
  $p.uniform("uFilterFlag",  "int",   0);
  $p.uniform("uFilterControls","int", filterControls)
  $p.uniform("uVisControls","int", filterControls);
  $p.uniform("uFilterRanges","vec2", $p.fieldDomains);
  $p.uniform("uVisRanges","vec2", $p.fieldDomains);
  // $p.uniform("uGroupFields", "int",   [0, -1]);
  $p.uniform("uDataInput",   "sampler2D");
  $p.uniform("uDeriveCount", "int", $p.deriveMax);
  // $p.uniform("uDeriveDomains", "vec2", $p.deriveDomains);
  // $p.uniform("uDeriveWidths", "float", $p.deriveWidths);
  $p.uniform("uFilterLevel", "float", 0.1)
  $p.uniform('uVisLevel',    "float", 0.1)

  $p.varying("vResult", "float");
  $p.varying("vDiscardData", "float");
  $p.texture(
      "tData",
      "float",
      new Float32Array($p.dataDimension[0] * $p.dataDimension[1] * $p.fieldCount), [$p.dataDimension[0], $p.dataDimension[1] * $p.fieldCount],
      "alpha"
  );
  $p.framebuffer("fFilterResults", "unsigned_byte", $p.dataDimension);
  $p.framebuffer("fGroupResults", "float", [1024, 1]);
  $p.framebuffer("fDerivedValues", "float", [$p.dataDimension[0], $p.dataDimension[1] * $p.deriveMax]);
  $p.framebuffer("fStats", "float", [2, $p.fieldCount]);
  $p.parameter({
      fieldCount: $p.fields.length - $p.indexes.length,
      indexCount: $p.indexes.length
  });

  $p.subroutine("getData", "float", getData);
  $p.subroutine("getNonIndexedData", "float", getNonIndexedData);
}