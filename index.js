'use strict';

var fs          = require('fs');
var path        = require('path');
var esprima     = require('esprima');
var escodegen   = require('escodegen');
var htmlclean   = require('htmlclean');
var through     = require('through2');
var gutil       = require('gulp-util');

var PluginError = gutil.PluginError;

// Consts
var PLUGIN_NAME = 'gulp-inject-deps';
    
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

function logError ( msg ){
    
    gutil.log( gutil.colors.red( PLUGIN_NAME + ':' ), msg );
}

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
        lookupMode: 'cwd', // 'cwd', 'relative'
        baseUrl: options.baseUrl || '/'
    };
    
    log( 'Starting ' + gutil.colors.magenta( "'inject text dependences'") + ' ...' );
    log( 'using lookupMode: ' + defaultOptions.lookupMode );
    log( 'using baseUrl: ' + defaultOptions.baseUrl );
    
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
        var ast      = esprima.parse( code );
        
        log( 'injecting ' + relativePath );

        if( ast.body[0].type != 'ExpressionStatement'  ){
            logError( 'module must begin with define call ' +  logName );
            return;
        }
        
        // 找到define 函数调用
        var defineExp = ast.body[0].expression;
        if( !isCallExp( defineExp , 'define' ) ){
            logError( 'cannot find define call in ' +  logName );
            return;
        }
        
        var defineArgs = defineExp.arguments;
        var depArr = [], func;
        var depsArr_index, func_index;

        for( var j=0; j < defineArgs.length; j++ ){

            var arg_temp = defineArgs[j];

            // 找到依赖数组
            if( arg_temp.type == 'ArrayExpression' ){

                depsArr_index = j;
                depArr = arg_temp;
            }

            // 找出函数
            if( arg_temp.type == 'FunctionExpression' ){

                func_index = j;
                func = arg_temp;
            }
        }
        
        if( !depArr || !depArr.elements.length ){
            
            logInfo( 'no dependences found in ' + logName );
            return callback( null, file );
        }

        var deps_elements = depArr.elements;
        var func_params   = func.params;
        var inject_codes  = [];

        // 找到 html 依赖, 并移除
        for( var k=0; k < deps_elements.length; k++ ){

            var templateName = '', 
                dep_temp = deps_elements[k];
            
            if( dep_temp.type == 'Literal' && /^text!(.*)/i.test( dep_temp.value) ) {
                templateName = RegExp.$1;
            }
            else{
                continue;
            }
            
             // 移除 html 依赖
            deps_elements = deps_elements.filter(function(v,idx){
                return idx != k;
            })

            defineExp.arguments[depsArr_index].elements = deps_elements;

            // 获取回调参数名称
            var param_name = func_params[ k ].name;

            // console.log( func_params );
            // 移除回调参数名称
            func_params = func_params.filter(function(v,idx){
                return idx != k;
            });

            defineExp.arguments[ func_index ].params = func_params;
            
            var html_text = fs.readFileSync( path.join( (mode == 0 ? tplDir : defaultOptions.baseUrl), templateName ) ) || '';			
			html_text = htmlclean( html_text.toString(), defaultOptions.htmlClean );
            
            var inject_code = buildDecExp( param_name, html_text );

            inject_codes.push( inject_code );
        }

        if( inject_codes.length > 0 ){
            
            var func_body = func.body.body;
            if( /use strict/i.test( func_body[0].expression.value ) ){

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