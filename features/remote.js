// See Purple/licence.txt for Google BSD license
// Copyright 2011 Google, Inc. johnjbarton@johnjbarton.com

(function () {
  var thePurple = window.purple;
  
  thePurple._features.remote = {
    name: "remote",
    api: {
      Console: {
        enable: function(){},
        disable: function(){}
      },
      Debugger: {
        continueToLocation: function(location) {},
        disable: function() {},
        enable: function() {},
        evaluateOnCallFrame: function(callFrameId, expression, includeCommandLineAPI, objectGroup, returnByValue) {},
        getScriptSource: function(scriptId) {},
        pause: function() {},
        removeBreakpoint: function(breakpointId) {},
        resume: function() {},
        setBreakpoint: function(condition, location) {},
        setBreakpointByUrl: function(columnNumber, condition, lineNumber, url, urlRegex) {},
        setBreakpointsActive: function(active) {},
        setPauseOnExceptions: function(state) {},
        setScriptSource: function(preview, scritpId, scriptSource) {},
        stepInto: function() {},
        stepOut: function() {},
        stepOver: function() {}
      }
    },
    events: {
      Debugger: {
        breakpointResolved: function(breakpointId, location) {},
        paused: function(details) {},
        resumed: function() {},
        scriptFailedToParse: function(data, errorLine, errorMessage, firstLine, url) {},
        scriptParsed: function(endColumn, endLine, isContentScript, scriptId, startColumn, startLine, url) {}
      }
    },
    types: {
      CallFrame: {
        functionName: 'string',
        id: 'string',
        location: 'Location',
        scopeChain: '[Scope]',
        'this': 'Runtime.RemoteObject'
      },
      Location: {
        columnNumber: 'integer',
        lineNumber: 'integer',
        scriptId: 'string'
      },
      Scope: {
        object: 'Runtime.RemoteObject',
        'type': 'string'
      }
    }
  };
  
}());