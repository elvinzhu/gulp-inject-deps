var test = "not begin with define";

define( 'blalba', [ 'otherModule1', 
                   'text!./tpl.html',
                   'text!./style.css', 
                   'otherModule2' ], 
       function( OtherModule1, Template, Style, OtherModule2 ){
    
    'use strict';
    
    var style = document.createElement('style');
    
    style.type = 'text/css';
    style.innerHTML = Style;
    
    
    document.head.appendChild( style );
    
    document.body.innerHTML = Template;
    
    
    return {};
    
})