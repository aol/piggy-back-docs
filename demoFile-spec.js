describe('demo test file', function () {
    'use strict';
    var x;
    beforeEach(function () {
        x = 1;
    });
    describe('function name', function () {
        it('function documentation', function () {
            //@setup
            var json = {
                labelA: 'a',
                labelB: 2
            };
            //@censor
            var x = 123;
            //@example
            var result = testFunction(json);
            expect(result).toEqual('result');
            var result = testFunction(json);
            $rootScope.something = $rootScope.somehting.else;
        });
    });
    describe('another function', function () {
        it('If there are no labels there will not be any example code.', function () {
            var json = {
                labelA: 'a',
                labelB: 2
            };
            var result = testFunction(json);
        });
    });
});
