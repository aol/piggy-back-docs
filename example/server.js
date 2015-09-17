var docGen = require('../docGenerator.js');
var jade = require('jade');
var fs = require('fs');
var configObj = require('./exampleConfigurations');
var debug = require('../debug.js');

debug.runDebugger();
//debug.setGroup('thing');

docGen(process.argv[2], configObj).then(function (result) {
    var fileHTML = '<html><head><style>.functionBlock{border: 1px solid #000; margin-top: 10px;}.titleText{font-size: 20px; font-weight: 600; width: 100%; height: 25px; background-color: grey; color: white; padding: 2px;}.itText{font-size: 15px; margin: 10px 2px; color: black;}.codeBlock{background-color: #f5f2f0;}.setup{color: #888; font-size: 15px;}.censor{color: red}.example{color: #000; font-size: 16px;}.expect{color: #333; font-size: 14px; padding-left: 15px;}</style></head><body>' + result + '</body></html>';
    fs.writeFile(process.argv[3], fileHTML);
});