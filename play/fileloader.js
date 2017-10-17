define(function(require){
    return function fileLoader(arg) {
        var options = arg || {},
            file = options.file,
            ftype = options.type || options.ftype || 'csv',
            delimiter = options.delimiter || null,
            onLoadStart = options.onstart || function() {},
            onLoadComplete = options.oncomplete || function() {},
            onLoad = options.onload || function() {},
            chunk = options.bufferSize || 32 * 1024,
            skip = options.skip || 0,
            struct = options.struct || {};

        if(typeof(file) === 'undefined' ) return;

        var reader = new FileReader(),
            fileSize = file.size,
            header,
            firstRow,
            offset = 0,
            lineTotal = 0,
            counting = true,
            leftOver = '',
            rawText,
            lines;

        reader.onloadend = function(evt) {
            if (evt.target.readyState == FileReader.DONE) {
                rawText = leftOver + evt.target.result;
                lines = rawText.split('\n');
                leftOver = lines.pop();

                if(offset == 0 && counting) {
                    header = lines[0];
                    firstRow = lines[1];
                }

                if(offset == 0 && skip > 0) {
                    for(var j = 0; j<skip; j++)
                        lines.shift();
                }
                if(counting) {
                    lineTotal += lines.length;
                } else {
                    onLoad(lines);
                }

                if(offset < fileSize) {
                    var blob = file.slice(offset, offset+chunk);
                    reader.readAsBinaryString(blob);
                    offset += chunk;
                } else {
                    if(counting) {
                        offset = 0;
                        leftOver = '';
                        counting = false;
                        onLoadStart({
                            line: lineTotal,
                            size: fileSize,
                            header: header,
                            first: firstRow
                        });

                        console.log("openned file  ", file.name, "(lines:", lineTotal , ")");
                        var blob = file.slice(offset, offset+chunk);
                        reader.readAsBinaryString(blob);
                    } else {
                        counting = true;
                        onLoadComplete();
                        console.log("loaded file ", file.name);
                    }
                }
            }
        }

        function readFile() {
            if(offset < fileSize) {
                var blob = file.slice(offset, offset+chunk);
                reader.readAsBinaryString(blob);
            } else {
                if(counting) {
                    offset = 0;
                    leftOver = '';
                    counting = false;
                    onLoadStart({
                        line: lineTotal,
                        size: fileSize,
                        header: header,
                        first: firstRow
                    });

                    console.log("openned file  ", file.name, "(lines:", lineTotal , ")");
                    readFile();
                } else {
                    counting = true;
                    onLoadComplete();
                    console.log("loaded file ", file.name);
                }
            }
        }

        function errorHandler(evt) {
            switch(evt.target.error.code) {
                case evt.target.error.NOT_FOUND_ERR:
                    alert('File Not Found!');
                    break;
                case evt.target.error.NOT_READABLE_ERR:
                    alert('File is not readable');
                    break;
                case evt.target.error.ABORT_ERR:
                    break; // noop
                default:
                    alert('An error occurred reading this file.');
            };
        }
        reader.onerror = errorHandler;
        var blob = file.slice(0, chunk);
        reader.readAsBinaryString(blob);
    }

})
