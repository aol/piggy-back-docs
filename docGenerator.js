'use strict';

var fs = require('fs'),
    _ = require('lodash'),
    jade = require('jade'),
    configObj = require('./configurations');

var blockRegEx = /\'(.*)\', function \(\) {\n((.|\s)*)\n\s*}(\)\);|\);)/;

module.exports = function (fileName, callBack) {
    fs.readFile(fileName, "UTF-8", function (err, fileContent) {
        var docObject = processInputFile(fileContent);
        var docHTML = generateDoc(docObject);
        var fileHTML = '<html><head><style>.functionBlock{border: 1px solid #000; margin-top: 10px;}.titleText{font-size: 20px; font-weight: 600; width: 100%; height: 25px; background-color: grey; color: white; padding: 2px;}.itText{font-size: 15px; margin: 10px 2px; color: black;}.codeBlock{background-color: #f5f2f0;}.setup{color: #888; font-size: 15px;}.censor{color: red}.example{color: #000; font-size: 16px;}.expect{color: #333; font-size: 14px; padding-left: 15px;}</style></head><body>' + docHTML + '</body></html>';
        callBack(fileHTML);
    });
};

function processInputFile(fileText) {
    var newDescribeBlocks = splitIntoBlocks(fileText, 'describe');
    return _.map(newDescribeBlocks, function (block) {
        var processedBlock = processBlock(block);
        var describeContents = processedBlock.contents;
        var itBlocks = splitIntoBlocks(describeContents, /\sit\(/);
        processedBlock.contents = {text: '', code: ''};
        _.each(itBlocks, function (itBlock) {
            var result = processBlock(itBlock);
            processedBlock.contents.text += result.text;
            processedBlock.contents.code += (result.contents + '\n //@space');
        });
        return processedBlock
    });
}

function splitIntoBlocks(text, key) {
    var blocks = text.split(key);
    blocks.shift();
    return blocks;
}

function processBlock(block) {
    var match = blockRegEx.exec(block);
    return {text: match[1], contents: match[2]};
}

function generateDoc(docObject) {
    var title = docObject.shift().text;
    var docText = _.map(docObject, function (block) {
        return {
            "title": titleTextTemplate(block.text),
            "description": itTextTemplate(block.contents.text),
            "code": formatCodeBlock(block.contents.code)
        }
    });
    return jade.compileFile('./docTemplate.jade')({"docTitle": title, "docText": docText});
}

function titleTextTemplate(titleText) {
    return jade.compile('div.titleText #{titleText}')({"titleText": titleText});
}

function itTextTemplate(itText) {
    return jade.compile('div.itText #{itText}')({"itText": itText});
}

function formatCodeBlock(codeBlock) {
    var codeArray = codeBlock.split('\n');
    var formattedArray = _.filter(codeArray, function (l) {
        return l && !_.includes(l, '//@space');
    });
    var restring = {transform: '', string: ''};
    var transformStr = '';
    _.each(formattedArray, function (line) {
        if (line.indexOf('//@ignore') === -1) {
            line = line.replace(/    /g, '  ');
            _.each(configObj, function (option) {
                if (option.tag.exec(line)) {
                    if(restring.string && restring.transform) {
                        transformStr += restring.transform(restring.string);
                    }
                    restring.string = '';
                    if (line.indexOf('//') < 0 || option.inLine) {
                        transformStr += option.transform(line);
                    } else {
                        restring.transform = option.transform;
                    }
                    return false;
                } else if (option.tag.exec('all')) {
                    restring.string += line + '\n';
                }
            });
        }
    });
    if(restring.string && restring.transform) {
        transformStr += restring.transform(restring.string);
    }
    return jade.compileFile('./codeBlock.jade')({"code": transformStr});
}