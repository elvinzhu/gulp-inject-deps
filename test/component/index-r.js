define( 'blalba', [ 'otherModule1', 
                   'text!./component/tpl.html',
                   'text!./component/style.css',
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