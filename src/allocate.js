define(function(require){
    var ctypes = require('./ctypes'),
        cstore = require('./cstore');

    return function allocate(options) {
        var alloc = {},
            indexes = options.indexes || [],
            data = options.data || options.buffer || [],
            attributes = options.attributes || {},
            keys = options.keys || data.keys || [],
            types = options.types || data.types || [],
            intervals = options.intervals || data.intervals || {},
            stats = options.stats || data.stats || null,
            size = options.size,
            semantics = options.semantics || [];

        var db = cstore({
            size: size,
            struct: attributes,
        });

        db.addRows(data);

        return db;
    }
});
