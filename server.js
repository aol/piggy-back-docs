var docGen = require('./docGenerator.js');
var jade = require('jade');
var fs = require('fs');

//var fn = jade.compile('div(class="#{className}") example text #{name} #{className}');
//console.log(fn({"className": "someclass", "name": "bob"}))
docGen(process.argv[2], function (result) {
    //console.log(process.argv[3], result);
    fs.writeFile(process.argv[3], result);
});

