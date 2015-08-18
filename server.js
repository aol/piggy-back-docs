var docGen = require('./docGenerator.js');

console.log(docGen, process.argv[2], process.argv[3]);
docGen(process.argv[2], process.argv[3]);

