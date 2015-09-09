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
    }
];

module.exports = configObj;