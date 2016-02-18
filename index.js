'use strict';

var fs          = require('fs');
var path        = require('path');
var esprima     = require('esprima');
var escodegen   = require('escodegen');
var htmlclean   = require('htmlclean');
var minifyCss   = require('clean-css');
var through     = require('through2');
var gutil       = require('gulp-util');

var PluginError = gutil.PluginError;

// Consts
var PLUGIN_NAME = 'gulp-inject-deps';


// expression type Enum
var EXP_ENUM = {
    Expression:'ExpressionStatement',
    ArrayExp: 'ArrayExpression',
    FunExp:'FunctionExpression'
};
    
function isCallExp( exp , methodName ){

    if( exp.type == 'CallExpression' ){

        var callee = exp.callee;
        if( typeof methodName == 'undefined' ){

            return callee.type == 'Identifier';
        }
        else{

            var match = false;
            if( methodName instanceof Array ){
                
                match = methodName.indexOf( callee.name ) != -1;
            }
            else{
                
                match = methodName == callee.name;
            }
            
            return callee.type == 'Identifier' && match;
        }
    }

    return false;
};

function buildDecExp ( name, value ){
        
    return {
        "type": "VariableDeclaration",
        "declarations": [
            {
                "type": "VariableDeclarator",
                "id": {
                    "type": "Identifier",
                    "name": name
                },
                "init": {
                    "type": "Literal",
                    "value": "$1".replace('$1', value),
                    "raw": "\"$1\"".replace( value )
                }
            }
        ],
        "kind": "var"
    }
};

function logInfo ( msg ){
	
    gutil.log( gutil.colors.yellow( PLUGIN_NAME + ':' ) , msg);
}

function log( msg ){
	
	gutil.log(  PLUGIN_NAME + ':' , msg );
}

// Plugin level function(dealing with files)
function gulpInjectDependences( options ) {
    
    var options = options || {},
        cwd = process.cwd();
    
    var defaultOptions = {
        
        htmlClean: options.htmlClean || {},
        cssClean: options.cssClean || {},
        lookupMode: options.lookupMode || 'cwd', // 'cwd', 'relative'
        baseUrl: options.baseUrl || './'
    };
    
    var cssclern = new minifyCss( defaultOptions.cssClean );
    
    log( 'Starting ' + gutil.colors.magenta( "'injecting dependences'") + ' ...' );
    
    return through.obj(function( file, encoding, callback ) {
    
        if ( file.isNull() || file.isDirectory() ) {
            
            return callback( null, file );
        }

        if ( file.isStream() ) {

            return callback(new gutil.PluginError( PLUGIN_NAME, 'Streaming not supported') );
        }
        
        // use replace to handle the case that there is subfolder under viewsDir.
        var fileDir      = path.dirname( file.path );
        var relativePath = file.path.replace( cwd, '' );
        var logName      = gutil.colors.magenta( relativePath );
        
        var code     = file.contents.toString();
        var ast;
		
		try{
			ast = esprima.parse( code );
		}catch(err){	
            return callback(new gutil.PluginError( PLUGIN_NAME, err, {
                fileName: file.path, 
            }));
		}
        
        log( 'injecting ' + relativePath );

        // 找到define 函数调用
        var defineExp = ast.body[0].expression;
        if( ast.body[0].type != EXP_ENUM.Expression || !isCallExp( defineExp , 'define' ) ){
            logInfo( 'Ignored, no "define" call：' +  logName );
            return callback( null, file );
        }
        
        var defineArgs = defineExp.arguments;
        var depArr = [], func;
        var depsArr_index, func_index;

        for( var j=0; j < defineArgs.length; j++ ){

            var arg_temp = defineArgs[j];

            // 找到依赖数组
            if( arg_temp.type == EXP_ENUM.ArrayExp ){

                depsArr_index = j;
                depArr = arg_temp;
            }

            // 找出函数
            if( arg_temp.type == EXP_ENUM.FunExp ){

                func_index = j;
                func = arg_temp;
            }
        }
        if( !depArr || !depArr.elements.length ){
            
            logInfo( 'Ignored, no dependences：' + logName );
            return callback( null, file );
        }

        var deps_elements = depArr.elements;
        var func_params   = func.params;
        var inject_codes  = [];
        
        var new_deps_element = [], new_func_aprams = [];
        // 找到依赖, 并移除
        for( var k=0; k < deps_elements.length; k++ ){

            var templateName = '', 
                dep_temp = deps_elements[k];
            
            if( dep_temp.type == 'Literal' && /^text!(.*)/i.test( dep_temp.value) ) {
                templateName = RegExp.$1;
            }
            else{
                new_deps_element.push( dep_temp );
                new_func_aprams.push( func_params[ k ] );
                continue;
            }

            // 获取回调参数名称
            var param_name = func_params[ k ].name, depPath;
            
            if( defaultOptions.lookupMode == 'cwd' ){
                depPath = path.join( fileDir, path.basename( templateName ) );
            }
            else{
                depPath = path.join( defaultOptions.baseUrl, templateName );
            }
            
            var text    = fs.readFileSync( depPath ) || '';
            var extName = path.extname( templateName );
            
            if( /html$/i.test( extName ) ){
                text = htmlclean( text.toString(), defaultOptions.htmlClean );
            }
            else if( /css$/i.test( extName ) ){
                text = cssclern.minify( text ).styles;
            }
            
            var inject_code = buildDecExp( param_name, text );
            inject_codes.push( inject_code );
        }
        
        defineExp.arguments[ depsArr_index].elements = new_deps_element;
        defineExp.arguments[ func_index   ].params   = new_func_aprams;

        if( inject_codes.length > 0 ){
            
            var func_body = func.body.body;
            
            if( func_body[0].type == EXP_ENUM.Expression
               && /use strict/i.test( func_body[0].expression.value ) ){

                var tempArr = [];

                tempArr.push( func_body[0] );
                tempArr = tempArr.concat( inject_codes );
                func.body.body = tempArr.concat( func_body.slice(1) );

            }
            else{

                func.body.body = inject_codes.concat( func_body );
            }

            file.contents =  new Buffer( escodegen.generate( ast , {
                format: {
                    escapeless: true,
                }
            }));
        }
        
        callback( null, file );
        
    });
}

// Exporting the plugin main function
module.exports = gulpInjectDependences;