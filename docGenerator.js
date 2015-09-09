'use strict';

var fs = require('fs'),
    _ = require('lodash'),
    jade = require('jade');
var defaultConfigs = require('./defaultConfigurations');
var configObj = '';

var blockRegEx = /\'(.*)\', function \(\) {.*\n((.|\s)*)\n\s*}(\)\);|\);)/;

module.exports = function (fileName, configSettings, callBack) {
    configObj = configSettings.concat(defaultConfigs);
    console.log(configObj);
    fs.readFile(fileName, "UTF-8", function (err, fileContent) {
        var docObject = processInputFile(fileContent);
        var docHTML = generateDoc(docObject);
        callBack(docHTML);
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
    return jade.compileFile('./templates/docTemplate.jade')({"docTitle": title, "docText": docText});
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
    return jade.compileFile('./templates/codeBlock.jade')({"code": transformStr});
}