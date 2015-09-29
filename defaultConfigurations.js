var jade = require('jade'),
    _ = require('lodash');

var debug = require('./debug.js');

var configObj = [
    {
        tag: /\/\/@setup/,
        transform: function (text) {
            debug.log("---setup", ['config', 'test']);
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
            return jade.compile('code.expect #{spacing} #{actual} #{equality} #{expected}')({'spacing': parts[1], 'actual': parts[2], 'equality': parts[3], 'expected': parts[4] + '\n'});
        }
    }, {
        tag: /all/
    }
];

module.exports = configObj;