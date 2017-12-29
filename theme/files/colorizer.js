(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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
},{"monaco-loader":3,"toothrot-monarch":6}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (process,__dirname){
// We can't just require('monaco-editor'), so we need to find
// it by hand. Like in the stone ages.

const fs = require('fs')
const path = require('path')

/**
 * Tries to find monaco-editor
 *
 * @returns {Promise<string>} monaco-editor directory
 */
function findMonaco () {
  return new Promise((resolve, reject) => {
    let paths = process.mainModule ? process.mainModule.paths : []

    // We'll look far and wide
    paths.push(path.join(__dirname, 'node_modules'))
    paths.push(path.join(__dirname, '..', 'node_modules'))
    paths.push(path.join(__dirname, '..', '..', 'node_modules'))
    paths.push(path.join(process.cwd(), 'node_modules'))
    paths.push(path.join(process.cwd(), '..', 'node_modules'))
    paths.push(path.join(process.cwd(), '..', '..', 'node_modules'))

    paths = paths.map((p) => path.join(p, 'monaco-editor'))

    const foundPath = paths.find((p) => testMonaco(p))

    if (foundPath) {
      resolve(foundPath)
    } else {
      reject('Monaco-Editor not found')
    }
  })
}

/**
 * Tests if "monaco-editor" is available inside a node_modules
 * folder in the given directory
 *
 * @param {string} [dir='']
 * @returns {Promise<boolean>} True if found, false if not
 */
function testMonaco (dir = '') {
  try {
    const res = fs.readdirSync(dir);
    return !!res;
  } catch (e) {
    return false;
  }
}

/**
 * Loads monaco, resolving with the monaco object
 *
 * @typedef LoadMonacoOptions
 * @property {string} baseUrl - Passed to Monaco's require.config
 *
 * @returns {Promise<Object>}
 */
function loadMonaco (options = {}) {
  return new Promise((resolve, reject) => {
    findMonaco().then((monacoDir) => {
      const loader = require(path.join(monacoDir, '/min/vs/loader.js'))

      // If this failed, we're done
      if (!loader) {
        return reject(`Found monaco-editor in ${monacoDir}, but failed to require!`)
      }

      // Configure options
      options.baseUrl = options.baseUrl || `file:///${monacoDir}/min`

      loader.require.config({
        baseUrl: options.baseUrl
      })

      // Help Monaco understand how there's both Node and Browser stuff
      self.module = undefined
      self.process.browser = true

      loader.require(['vs/editor/editor.main'], () => {
        if (monaco) {
          resolve(monaco)
        } else {
          reject('Monaco loaded, but could not find global "monaco"')
        }
      })
    })
  })
}

module.exports = loadMonaco

}).call(this,require('_process'),"/node_modules/monaco-loader")
},{"_process":5,"fs":2,"path":4}],4:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":5}],5:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(require,module,exports){

var LANGUAGE_ID = "toothrot";

var TOKEN_STORY_TITLE = "story-title";
var TOKEN_SECTION_TITLE = "story-title";
var TOKEN_NODE_TITLE = "identifier.title";
var TOKEN_LINE_OPERATOR = "operators.line";
var TOKEN_RETURN = "operators.line";
var TOKEN_PROPERTY_NAME = "identifier.property";
var TOKEN_PROPERTY_VALUE = "string";
var TOKEN_TAG = "identifier.tags";
var TOKEN_LINK = "token-link";
var TOKEN_FLAG = "token-flag";
var TOKEN_NODE_NAME = "identifier.node";
var TOKEN_SCRIPT_NAME = "identifier.script";
var TOKEN_COMMENT = "comment.line";

var THEME = {
    base: "vs-dark",
    inherit: true,
    rules: [
        {token: TOKEN_RETURN, foreground: "808080"},
        {token: TOKEN_LINK, foreground: "FFA500"},
        {token: TOKEN_FLAG, foreground: "008B8B"},
        {token: TOKEN_STORY_TITLE, foreground: "FFA500", fontStyle: "bold underline"},
        {token: "comment.line", foreground: "505050", fontStyle: "italic"},
        {token: "operators.line", foreground: "BA55D3", fontStyle: "bold"},
        {token: "identifier.node", foreground: "569CD6", fontStyle: "bold"},
        {token: "identifier.title", foreground: "569CD6", fontStyle: "bold underline"},
        {token: "identifier.tags", foreground: "FFD700", fontStyle: "italic"},
        {token: "identifier.property", foreground: "808080", fontStyle: "italic"},
        {token: "identifier.script", foreground: "00FA9A", fontStyle: "bold"}
    ]
};

var TOKEN_DEFINITONS = {
    
    defaultToken: "",
    
    tokenizer: {
        root: [
            // Story title
            [/^#[^#]+/, TOKEN_STORY_TITLE],
            
            // Section title
            [/##\s*[^#]+/, TOKEN_SECTION_TITLE],
            
            // Text node title
            [/###[^#]+/, TOKEN_NODE_TITLE],
            
            // Comment
            [/^\(-\).*/, TOKEN_COMMENT],
            
            // Return marker
            [/(\(<\))(\s*)(.*)/, [TOKEN_RETURN, "white", TOKEN_TAG]],
            
            // Next marker
            [/(\(>\))(\s*)(.*)/, [TOKEN_LINE_OPERATOR, "white", TOKEN_NODE_NAME]],
            
            // Flags
            [/^(\(#\))(\s*)(flags:)(.*)/, [TOKEN_LINE_OPERATOR, "white", TOKEN_FLAG, "string"]],
            
            // Tags
            [/^(\(#\))(\s*)(tags:)(.*)/, [TOKEN_LINE_OPERATOR, "white", TOKEN_TAG, "string"]],
            
            // Contains property
            [
                /^(\(#\))(\s*)(contains:)(.*)/,
                [TOKEN_LINE_OPERATOR, "white", TOKEN_NODE_NAME, "string"]
            ],
            
            // Property
            [
                /(\(#\))(\s+)([a-zA-Z0-9_-]+:)(\s*)(.*)/,
                [TOKEN_LINE_OPERATOR, "white", TOKEN_PROPERTY_NAME, "white", TOKEN_PROPERTY_VALUE]
            ],
            
            // Option
            [
                /^(\(@\))(\s*)([^\s]+)(\s*)(\?\?\?)(\s+)([^=]+)(=>)(\s*)([^|]*)/,
                [
                    TOKEN_LINE_OPERATOR,
                    "white",
                    TOKEN_FLAG,
                    "white",
                    TOKEN_LINE_OPERATOR,
                    "white",
                    "white",
                    TOKEN_LINE_OPERATOR,
                    "white",
                    TOKEN_NODE_NAME
                ]
            ],
            [
                /^(\(@\))(\s+)([^=]+)(=>)(\s+)([^|]+)/,
                [
                    TOKEN_LINE_OPERATOR,
                    "white",
                    "white",
                    TOKEN_LINE_OPERATOR,
                    "white",
                    TOKEN_NODE_NAME
                ]
            ],
            [
                /(\|)(\s+)(.*)/,
                [
                    TOKEN_LINE_OPERATOR,
                    "white",
                    "string"
                ]
            ],
            
            // Anonymous node operator
            [/^\*\*\*/, TOKEN_LINE_OPERATOR],
            
            // Slot
            [/`(@[a-zA-Z0-9_]+)`/, TOKEN_SCRIPT_NAME],
            
            // Link
            [/(\[[^\]]+\]\()(#[^)]+)(\))/, [TOKEN_LINK, TOKEN_NODE_NAME, TOKEN_LINK]],
            
            // Scripts
            [
                /^```[^`]+/,
                {
                    token: TOKEN_SCRIPT_NAME,
                    bracket: "@open",
                    next: "script",
                    nextEmbedded: "text/javascript"
                }
            ],
            [/^```/, {token: TOKEN_SCRIPT_NAME, bracket: "@close"}]
            
        ],
        
        script: [
            [/^```([^`]+)(@[a-zA-Z0-9_]+)/, ["white", TOKEN_SCRIPT_NAME]],
            [/^```/, {token: "@rematch", next: "@pop", nextEmbedded: "@pop"}]
        ]
    }
};

function register(monaco) {
    monaco.languages.register({id: LANGUAGE_ID});
    monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, TOKEN_DEFINITONS);
    monaco.editor.defineTheme(LANGUAGE_ID, THEME);
}

module.exports = {
    register: register
};

},{}]},{},[1]);
