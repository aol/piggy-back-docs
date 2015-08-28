var jade = require('jade'),
    _ = require('lodash');
var configObj = [
    {
        tag: /(\s*)\$rootScope/,
        transform: function (text) {
            text = text.replace(/rootScope/g, 'scope') + '\n';
            return jade.compile('code.example !{text}')({'text': text});
        }
    }, {
        tag: /\/\/@censor/,
        transform: function (text) {
            text = text.split(" ");
            var newChars = ['~', '!', '!', '!', '@', '#',  '#', '#', '$', '%', '%', '^', '&', '*'];
            var newStr = ' ';
            _.each(text, function (elm) {
                if(elm.match(/([a-z1-9]+)/)) {
                    newStr += _.sample(newChars, elm.length) + '  ';
                } else {
                    newStr += elm + "  "
                }
            });
            newStr = newStr.replace(/,/g, '').replace(/  /g, ' ') + '\n';
            return jade.compile('code.censor !{text}')({'text': newStr});
        }
    }, {
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
            return jade.compile('code.expect #{spacing} #{actual} #{equality} #{expected}')({'spacing': parts[1], 'actual': parts[2], 'equality': parts[3], 'expected': parts[4] + '\n'});
        }
    }, {
        tag: /all/
    }
];

module.exports = configObj;