define('blalba', [
    'otherModule1',
    'otherModule2'
], function (OtherModule1, OtherModule2) {
    'use strict';
    var Template = '<button>I\'m here!</button> <button>I\'m here!</button> <button>I\'m here!</button>';
    var Style = 'body{margin:0;padding:0}button{border-radius:5px;box-shadow:0 0 3px 1px rgba(0,0,0,.5);transition:transform .2s}button:active{transform:scale(.98)}';
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = Style;
    document.head.appendChild(style);
    document.body.innerHTML = Template;
    return {};
});