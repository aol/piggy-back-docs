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
    return generateDocHTML({"docTitle": title, "docText": docText});
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
                    if(restring.string) {
                        transformStr += restring.transform(restring.string);
                    }
                    restring.transform = option.transform;
                    restring.string = '';
                    if (line.indexOf('//') < 0) {
                        transformStr += restring.transform(line);
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
    return generateCodeBlock({"code": transformStr});
}

var configObj = [
    {
        tag: /\/\/@setup/,
        transform: function (text) {
            return jade.compile('code.setup !{text}')({'text': text});
        }
    }, {
        tag: /\/\/@example/,
        transform: function (text) {
            return jade.compile('code.example !{text}')({'text': text});
        }
    }, {
        tag: /(\s*)expect/,
        transform: function (text) {
            var parts = /(\s*)expect\((.*)\)\.(.*)\((.*)\)/.exec(text);
            return jade.compile('code.expect #{actual} #{equality} #{expected}')({'actual': parts[2], 'equality': parts[3], 'expected': parts[4]});
        }
    }, {
        tag: /all/
    }

];