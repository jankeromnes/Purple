// See licence.txt for Google BSD license
// Copyright 2011 Google, Inc. johnjbarton@johnjbarton.com

/*
 * Purple: parse, re-run, breakpoint, loop environment.
 * Parts connector
 */ 
 
 window.purple = window.purple || {};
 
(function purpleFrameworkEnclosure() {
 
  var thePurple = window.purple;
  var Assembly = thePurple.Assembly;
  
  //-------------------------------------------------------------------------
  // Reporting functions that can later be optioned-off 
  thePurple.error = function() {
    console.error.apply(console, arguments);
  };
  thePurple.warn = function() {
    console.warn.apply(console, arguments);
  };
  thePurple.log = function() {
    console.log.apply(console, arguments);
  };
 
  // Parts implement these functions
  // If any method returns a truthy value, the remainder are not notified.
  thePurple.PurplePart = function PurplePart() {};
  thePurple.PurplePart.prototype = {
    // Respond to new Features. Parts or Features depending on feature start work 
    featureImplemented: function(feature) {},
    // Respond to Feature unload. Parts or Features depending on feature start work 
    featureUnimplemented: function(feature) {},
  };

  Assembly.addPartContainer(thePurple);  
  
  thePurple.preInitialize = [];   // system-level init
  thePurple.postDestroy = [];
  
  thePurple.initialize = function() {
    thePurple.preInitialize.forEach(function callEm(fnc) {
      fnc.apply(null, [thePurple]);
    });
      // A 'fake' feature standing for the HTML, so we can have all the features use the same API
    thePurple.loadFeature = new thePurple.Feature({name: 'load'});

    thePurple.forEachPart('featureImplemented', [thePurple.loadFeature]);
  };
  
  thePurple.destroy = function() {
    thePurple.forEachPart('featureUnimplemented', [thePurple.loadFeature]);
    thePurple.postDestroy.forEach(function callEm(fnc) {
      fnc.apply(null, [thePurple]);
    });
  };
  
  function gcLoad() {
    thePurple.initialize();
    window.removeEventListener('load', gcLoad, false);
  }
  window.addEventListener('load', gcLoad, false);

  function gcUnLoad() {
    thePurple.destroy();
    window.removeEventListener('unload', gcLoad, false);
  }
  window.addEventListener('unload', gcUnLoad, false);
  
}());