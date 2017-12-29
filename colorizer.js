
var loader = require("monaco-loader");
var registerLanguage = require("toothrot-monarch").register;

loader().then(function (monaco) {
    
    var codeElements = Array.prototype.slice.call(document.querySelectorAll("code.lang-toothrot"));
    
    registerLanguage(monaco);
    
    codeElements.forEach(function (element) {
        
        element.innerHTML = element.textContent;
        
        element.setAttribute("data-lang", "toothrot");
        
        monaco.editor.colorizeElement(element, {
            theme: "toothrot",
            tabSize: 4
        });
    });
    
});