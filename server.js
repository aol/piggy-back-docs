var docGen = require('./docGenerator.js');
var jade = require('jade');
var fs = require('fs');

docGen(process.argv[2], function (result) {
    fs.writeFile(process.argv[3], result);
});

