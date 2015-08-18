'use strict';

var glob = require('glob'),
    fs = require('fs'),
    $ = require('jquery')(require("jsdom").jsdom().parentWindow),
    _ = require('lodash');

module.exports = function (fileName, path) {
    fs.readFile(fileName, "UTF-8", function (err, fileContent) {
        console.log(fileContent)
        var docObject = processInputFile(fileContent);
        var docHTML = generateDoc(docObject);
        var fileHTML = "<html><head><style>.functionBlock{border: 1px solid #000; margin-top: 10px;}.titleText{font-size: 20px; font-weight: 600; width: 100%; height: 25px; background-color: grey; color: white; padding: 2px;}.itText{font-size: 15px; margin: 10px 2px;}.codeBlock{background-color: #f5f2f0;}.setup{color: #888; font-size: 15px;}.example{color: #000; font-size: 16px;}.expect{color: #333; font-size: 14px; padding-left: 15px;}</style></head><body>" + docHTML + "</body></html>";
        console.log(fileHTML);
        fs.writeFile(path, fileHTML);
    });
};

function processInputFile(fileText) {
    var doc = [];
    var newDescribeBlocks = splitIntoBlocks(fileText, 'describe');
    _.each(newDescribeBlocks, function (block) {
        var processedBlock = processBlock(block);
        //var describeText = processedBlock.text;
        var describeContents = processedBlock.contents;
        var itBlocks = splitIntoBlocks(describeContents, /\sit\(/);
        processedBlock.contents = {text: '', code: ''};
        _.each(itBlocks, function (itBlock) {
            var result = processBlock(itBlock);
            processedBlock.contents.text += result.text;
            processedBlock.contents.code += (result.contents + '\n //@space');
        });
        doc.push(processedBlock);
    });
    return doc;
}

function splitIntoBlocks(text, key) {
    var blocks = text.split(key);
    blocks.shift();
    return blocks;
}

function processBlock(block) {
    var match = /\'(.*)\', function \(\) {\n((.|\s)*)\n\s*}(\)\);|\);)/.exec(block);
    return {text: match[1], contents: match[2]};
}

function generateDoc(docObject) {
    var doc = $('<div />', {class: 'doc'});
    var title = docObject.shift();
    doc.append(titleTextTemplate(title.text));
    _.each(docObject, function (block) {
        var functionBlock = functionBlockTemplate()
            .append(titleTextTemplate(block.text))
            .append(itTextTemplate(block.contents.text))
            .append(transformCodeArray(formatCodeBlock(block.contents.code)));
        functionBlock.appendTo(doc);
    });
    return doc.html()
}

function functionBlockTemplate() {
    return $('<div />', {
        class: 'functionBlock'
    });
}

function titleTextTemplate(titleText) {
    return $('<div />', {
        class: 'titleText',
        text: titleText
    });
}

function itTextTemplate(itText) {
    return $('<div />', {
        class: 'itText',
        text: itText
    });
}

function codeBlockTemplate() {
    return $('<pre />', {
        class: 'codeBlock language-javascript'
    });
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
    var testBlock = codeBlockTemplate();
    var elm = $('<div />');
    var type = '';
    _.forEach(codeList, function (line) {
        if (type === line[0]) {
            if (type === 'expect') {
                line[1] = formatExpect(line[1]);
            }
            elm.text(elm.text() + line[1]);
        } else {
            testBlock.append(elm);
            type = line[0];
            elm = $('<div />').addClass(type);
            if (type === 'expect') {
                line[1] = formatExpect(line[1]);
            }
            elm.text(line[1]);
        }
    });
    return testBlock;
}

function formatCodeBlock(codeBlock) {
    var unit = codeBlock.split('\n');
    unit = _.map(unit, function (line) {
        return line.replace(/    /g, ' ');
    });
    var lastLineType = 'ignore';
    var unitExtracted = [];
    _.forEach(unit, function (line) {
        if (line && line.indexOf('//@ignore') < 0) {
            line += '\n';
            if (/^\s*\/\/@setup/.exec(line)) {
                lastLineType = 'setup';
            } else if (/^\s*\/\/@example/.exec(line)) {
                lastLineType = 'example';
            } else if (/^\s*expect/.exec(line) && lastLineType !== 'ignore') {
                lastLineType = 'expect';
                unitExtracted.push([lastLineType, line]);
            } else if (/^\s*\/\/@space/.exec(line)) {
                unitExtracted.push(['space', '']);
            }
            else {
                if (lastLineType !== 'expect' && lastLineType !== 'ignore') {
                    unitExtracted.push([lastLineType, line]);
                } else {
                    lastLineType = 'ignore';
                }
            }
        }
    });
    return unitExtracted
}