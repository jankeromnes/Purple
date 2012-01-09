// Google BSD license http://code.google.com/google_bsd_license.html
// Copyright 2011 Google Inc. johnjbarton@google.com

/*globals document window */

// used by options.html and crxEnd.js 
// options.origins is array of origin strings

function saveOptions() {
  var options = {origins: []};
  var originsTable = document.getElementById('origins');
  var originElts = originsTable.getElementsByClassName('origin');
  for(var i = 0; i < originElts.length; i++) {
    var originElt = originElts[i];
    var origin = originElt.value;
    if (origin) {
      options.origins.push(origin);
    }
  }
  
  var dropInfobarElt = document.getElementById('dropInfobar');
  options.dropInfobar = dropInfobarElt.checked;
  
  var debugConnection = document.getElementById('debugConnection');
  options.debugConnection = debugConnection.checked;

  var debugMessages = document.getElementById('debugMessages');
  options.debugMessages = debugMessages.checked;

  var debugWarnings = document.getElementById('debugWarnings');
  options.debugWarnings = debugWarnings.checked;
  
  var stringified = JSON.stringify(options);
  window.localStorage.setItem('options', stringified);
}

function restoreOptions() {
  var stringified = window.localStorage.getItem('options');
  try {
    var options = JSON.parse(stringified);
    return options;
  } catch (exc) {
    // ignore corrupt data
  }
}