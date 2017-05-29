
/**
 *
 */

var path = require('path')
  , _ = require('underscore')
  , rendrDir = 'node_modules/rendr'
  , stylesheetsDir = 'assets/stylesheets'
  , rendrModulesDir = rendrDir + '/node_modules'
  , rendrHandlebarsDir = 'node_modules/rendr-handlebars';
/**
 * for push
 */

module.exports = function(grunt) {

  var pkg = grunt.file.readJSON('package.json');

  // Project configuration.

  grunt.initConfig({

    pkg: pkg,

    env: {
      development: { NODE_ENV: 'development' },
      staging: { NODE_ENV: 'staging' },
      production: { NODE_ENV: 'production' }
    },
    concat: {
      vendor: {
        src: [
          'public/js/libs/*.js'
        ],
        dest: 'public/js/vendor.js',
      },
      styles: {
        src: [
          'public/css/bootstrap.min.css',
          'public/css/jquery.growl.css',
          'public/css/style.css'
        ],
        dest: 'public/css/site.css'
      }
    },

    browserify: {
      options: {
        external: [ 'jquery' ]
      },
      app: {
        src: [
          'public/js/script.js'
        ],
        dest: 'public/js/site.js'
      }
    },
    uglify: {
      options : {
        compress: {
          drop_console: true // <-
        },
        sourceMap: function(path) { return path.replace(/.js$/,".js.map")}
      },
      my_target: {
        files:{
          'public/vendor.min.js': ['public/js/vendor.js'],
          'public/site.min.js': ['public/js/site.js']
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');


  // default task - builds the app and exits
   grunt.registerTask('default', ['concat:vendor','concat:styles', 'browserify','uglify']);
};
