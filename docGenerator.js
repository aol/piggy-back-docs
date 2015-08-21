'use strict';

var fs = require('fs'),
    _ = require('lodash'),
    jade = require('jade');

var blockRegEx = /\'(.*)\', function \(\) {\n((.|\s)*)\n\s*}(\)\);|\);)/;

var generateCodeBlock = jade.compileFile('./codeBlock.jade');
var generateDocHTML = jade.compileFile('./docTemplate.jade');

module.exports = function (fileName, callBack) {
    fs.readFile(fileName, "UTF-8", function (err, fileContent) {
        var docObject = processInputFile(fileContent);
        var docHTML = generateDoc(docObject);
        var fileHTML = '<html><head><style>.functionBlock{border: 1px solid #000; margin-top: 10px;}.titleText{font-size: 20px; font-weight: 600; width: 100%; height: 25px; background-color: grey; color: white; padding: 2px;}.itText{font-size: 15px; margin: 10px 2px; color: black;}.codeBlock{background-color: #f5f2f0;}.setup{color: #888; font-size: 15px;}.example{color: #000; font-size: 16px;}.expect{color: #333; font-size: 14px; padding-left: 15px;}</style></head><body>' + docHTML + '</body></html>';
        callBack(fileHTML);
    });
};

function processInputFile(fileText) {
    var newDescribeBlocks = splitIntoBlocks(fileText, 'describe');
    return  _.map(newDescribeBlocks, function (block) {
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
    var docText =_.map(docObject, function (block) {
        return {
            "title": titleTextTemplate(block.text),
            "description": itTextTemplate(block.contents.text),
            "code": transformCodeArray(formatCodeBlock(block.contents.code))
        }
    });
    return generateDocHTML({"docTitle":title, "docText": docText});
}

function titleTextTemplate(titleText) {
    return jade.compile('div.titleText #{titleText}')({"titleText": titleText});
}

function itTextTemplate(itText) {
    return jade.compile('div.itText #{itText}')({"itText": itText});
}

function formatExpect(textBlock) {
    var expectExtraction = /(\s*)expect\((.*)\)\.(.*)\((.*)\)/.exec(textBlock);
    var text = '';
    if (expectExtraction[3].indexOf('toBe') > -1 || expectExtraction[3].indexOf('toEqual') > -1) {
        if (expectExtraction[3].indexOf('not') > -1) {
            text = expectExtraction[1] + expectExtraction[2] + ' !=== ' + expectExtraction[4] + '\n';
        } else {
            text = expectExtraction[1] + expectExtraction[2] + ' === ' + expectExtraction[4] + '\n';
        }
    } else if (expectExtraction[3].indexOf('toHaveBeenCalled') > -1) {
        text = expectExtraction[1] + expectExtraction[2] + '()' + '\n';
    }
    return text;
}

function transformCodeArray(codeList) {
    var type = '';
    var text = '';
    var codeSections = [];
    _.forEach(codeList, function (line) {
        if (type === line[0]) {
            if (type === 'expect') {
                line[1] = formatExpect(line[1]);
            }
            text += line[1];
        } else {
            codeSections.push({className:type, text:text});
            type = line[0];
            if (type === 'expect') {
                line[1] = formatExpect(line[1]);
            }
            text = line[1];
        }
    });
    return generateCodeBlock({"code": codeSections});
}

function formatCodeBlock(codeBlock) {
    return _(codeBlock).
        split('\n').
        filter(function(l) { return l && !_.includes(l, '//@ignore'); }).
        map(function(line) { return line.replace(/    /g, ' '); }).
        reduce(function(unitExtracted, line) {
            var tagMatch = this.tagRegex.exec(line);
            if (tagMatch) {
                switch(tagMatch[1]) {
                    case 'space':
                        unitExtracted.push(['space', '']);
                        break;
                    default:
                        this.lastLineType = tagMatch[1];
                }
            } else if (this.lastLineType !== 'ignore') {
                if (this.expectRegex.exec(line)) {
                    this.lastLineType = 'expect';
                    unitExtracted.push([ this.lastLineType, line + '\n' ]);
                } else if (this.lastLineType !== 'expect') {
                    unitExtracted.push([ this.lastLineType, line + '\n' ]);
                } else {
                    this.lastLineType = 'ignore';
                }
            } else {
                this.lastLineType = 'ignore';
            }
            return unitExtracted;
        }, [ ], { lastLineType: 'ignore',
            tagRegex: /^\s*\/\/@(\w+)/,
            expectRegex: /^\s*expect\b/ });
}