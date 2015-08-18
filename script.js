'use strict';

var del = require('del'),
    rename = require('gulp-rename'),
    karma = require('node-karma-wrapper'),
    portfinder = require('portfinder'),
    protractor = require('gulp-protractor'),
    connect = require('gulp-connect'),
    _ = require('lodash');

function applyGulpTestingTasks(gulp, getFiles, prereqs) {
    var self = {};

    prereqs = (prereqs || []).concat('test:clean');
    gulp.task('test:clean', function(callback) {
        del([ 'coverage/*' ], callback);
    });

    gulp.task('test:unit', prereqs, function(callback) {
        var karmaTest = karma({ configFile: 'test/karma.conf.js', files: getFiles() });

        karmaTest.simpleRun(function () {
            return gulp.src('./test/PhantomJS*.xml')
                .pipe(rename('test-results.xml'))
                .pipe(gulp.dest('./'))
                .on('end', callback);
        });
    });

    gulp.task('watch:test:unit', prereqs, function () {
        var karmaTest = karma({ configFile: 'test/karma.conf.js', files: getFiles() });
        karmaTest.inBackground();
        karmaTest.start();
    });

    gulp.task('webdriver_update', protractor.webdriver_update);

    var integrationServerOptions = _.identity;
    gulp.task('test:integration', ['webdriver_update'], function(callback) {
        return portfinder.getPort(function(__, port) {
            connect.server(integrationServerOptions({
                root: 'app',
                port: port
            }));
            return gulp.src(['test/e2e/**/*-spec.js'])
                .pipe(protractor.protractor({
                    configFile: 'test/protractor.conf.js',
                    args: ['--baseUrl', 'http://localhost:' + port]
                }))
                .on('end', function() {
                    connect.serverClose();
                    callback();
                });
        });
    });

    self.integrationServerOptions = function(isOpts) {
        integrationServerOptions = isOpts;
        return self;
    };
    return self;
}

module.exports = applyGulpTestingTasks;
