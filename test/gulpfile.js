
'use strict'

var gulp = require('gulp');
var path = require( 'path' );
var replace = require('gulp-replace');
var injectDeps = require('../index');


gulp.task('default', function(){
	
//    console.log( path.extname('/foo/bar/baz/asdf/quux.HTML') );
    
//    var CleanCSS = require('clean-css');
//    var source = 'a{   font-weight:bold;..;; opacity:0.2; transition:all .2s; }b{d}';
//    var minified = new CleanCSS().minify(source).styles;
//    
//    console.log( source);
//    console.log( minified);
//    
//    return;
    
	return gulp.src('./component/**/*.js')
		.pipe( injectDeps() )
		.pipe(gulp.dest('./result'));
});