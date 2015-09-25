# gulp-inject-deps

Transfor all your AMD dependences( starts with 'text!' ) into inline variables.

Assume you has a AMD style component like below. 
```
define( 'blabla', [ 'text!./tpl.html', 'text!./style.css'], function( Html, Css ){
    // add the Css to document.head via style tag
    // render your Html
} )
```
After processed by `gulp-inject-deps`
```
define( 'blabla', [ ], function(  ){

    var Html = 'file content';
    var Css  = 'file content'
    
    // add the Css to document.head via style tag
    // render your Html
    
} )
```

## install

```
npm install --save-dev gulp-inject-deps
```
## usage
```
var injectDeps = require( 'gulp-inject-deps' );

gulp.task('default', function(){
	return gulp.src(['./components/**/*.js'])
		.pipe( injectDeps({
	    //htmlClean: {},
	    //cssClean: {},
	    lookupMode: 'cwd'    //default: 'cwd' (current directory of the js file)
	    // baseUrl: './component'     // relative to process.cwd()
	 }))
	.pipe(gulp.dest('./result'));
});

```
## options
* `htmlClean`

 `gulp-inject-deps` use [htmlclean](https://github.com/anseki/htmlclean) to minify your html file

* `cssClean`

  `gulp-inject-deps` use [clean-css](https://github.com/jakubpawlowicz/clean-css) to minify your css file
  
* `lookupMode`

  How to look up the depenpence file.

   * 'cwd': the same folder as the current module
   * 'relative': relative to `baseUrl`

* `baseUrl`

  used when  `lookupMode` is set to 'relative'. And relative to `process.cwd()`
  

## demo

  Refer to test folder
