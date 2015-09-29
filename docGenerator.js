'use strict';

var fs = require('fs'),
    debug = require('./debug.js'),
    _ = require('lodash'),
    jade = require('jade'),
    defaultConfigs = require('./defaultConfigurations'),
    Promise = require('promise'),
    configObj = '',
    blockRegEx = /\'(.*)\', function \(\) {.*\n((.|\s)*)\n\s*}(\)\);|\);)/;


module.exports = function (fileName, configSettings) {
    return new Promise(function (resolve) {
        configObj = configSettings.concat(defaultConfigs);
        fs.readFile(fileName, "UTF-8", function (err, fileContent) {
            var docObject = processInputFile(fileContent);
            var docHTML = generateDoc(docObject);
            resolve(docHTML);
        });
    });

};

function extractTitle (blockStr) {
    debug.log('extractTitle', 'test');
    var match  = /\'(.*)\', function \(\)/.exec(blockStr);
    return match[1];
}

function processInputFile(fileText) {
    debug.log('processInputFile', 'thing');
    var newDescribeBlocks = splitIntoBlocks(fileText, 'describe');
    var moduleTitle = extractTitle(newDescribeBlocks.shift());
    var titleBlock = [{ text: moduleTitle, contents: { text: '', code: '' } }];
    var processedBlocks = _.map(newDescribeBlocks, function (block) {
        var processedBlock = processBlock(block);
        var describeContents = processedBlock.contents;
        var itBlocks = splitIntoBlocks(describeContents, /\sit\(/);
        processedBlock.contents = {text: '', code: ''};
        _.each(itBlocks, function (itBlock) {
            var result = processBlock(itBlock);
            processedBlock.contents.text += result.text;
            processedBlock.contents.code += (result.contents + '\n');
        });
        return processedBlock
    });
    return titleBlock.concat(processedBlocks);
}

function splitIntoBlocks(text, key) {
    debug.log('splitIntoBlocks');
    var blocks = text.split(key);
    blocks.shift();
    return blocks;
}

function processBlock(block) {
    debug.log('processBlock');
    var match = blockRegEx.exec(block);
    if(!match) {
        throw block +' did not match the block regex '+ blockRegEx.toString();
    }
    return {text: match[1], contents: match[2]};
}

function generateDoc(docObject) {
    debug.log('docObject');
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
    debug.log('titleTextTemplate');
    return jade.compile('div.titleText #{titleText}')({"titleText": titleText});
}

function itTextTemplate(itText) {
    debug.log('itTextTemplate');
    return jade.compile('div.itText #{itText}')({"itText": itText});
}

function formatCodeBlock(codeBlock) {
    debug.log('formatCodeBlock');
    var codeArray = codeBlock.split('\n');
    var restring = {transform: '', string: ''};
    var transformStr = '';
    _.each(codeArray, function (line) {
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