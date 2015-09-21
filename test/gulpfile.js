
'use strict'

var gulp = require('gulp');
var path = require( 'path' );
var replace = require('gulp-replace');
var injectDeps = require('../index');


gulp.task('default', function(){
	
    console.log( path.dirname('/foo/bar/baz/asdf/quux.html') );
    
    
    return;
	return gulp.src('./test/**/*.js')
		.piple( injectDeps() )
		.piple(gulp.dest('./test/result'));
});