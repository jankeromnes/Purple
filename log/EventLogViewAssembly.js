// Copyright 2011 Google Inc. 
// see Purple/license.txt for BSD license
// johnjbarton@google.com


define(['log/EventLog', 'log/EventLogFilter', 'log/EventLogViewport', 'log/ConsoleEventHandler', 'log/NetworkEventHandler', 'lib/q/q'], 
function(         log,               filter,               viewport,       consoleEventHandler,       networkEventHandler,         Q) {

  'use strict';
  var thePurple = window.purple;
  
  var eventLogViewAssembly = new thePurple.PurplePart('eventLogViewAssembly'); 
  
  eventLogViewAssembly.initialize = function () {
    this.channel.initialize();
    log.initialize();
    filter.initialize();
    viewport.initialize();
  };
  
  eventLogViewAssembly.connect = function() {
    var channel = this.channel;
    
    // Attach the output of the JSON pipe from the browser to the input of the message buffer
    var logReady = log.connect(this.channel);
    // connect the output of the log to the input of the viewport
    viewport.connect(log);
    // connect the input of the filter to the output of the log
    // TODO
    
    var connected = Q.when(logReady, function (logReady) {
      // connect the default indexes to the output of the channel and the input of the filter, enabling each remote category
      var jsPromise = eventLogViewAssembly.jsEventHandler.connect(channel, filter);
      var consolePromise = eventLogViewAssembly.consoleEventHandler.connect(channel, filter);
      var networkPromise = eventLogViewAssembly.networkEventHandler.connect(channel, filter);
      return Q.join(jsPromise, consolePromise, networkPromise, function (jsPromise, consolePromise, networkPromise) {
        console.log("js, console, net enabled");
        // release the page
        eventLogViewAssembly.channel.send({command: 'releasePage'});
        return "released page";
      });
    }, function rejected(val) {
      console.error("eventLogViewAssembly failed "+val, val);
    });
    
    Q.when(connected, function success(connected) {
      console.log("eventLogViewAssembly connected "+connected);
    }, function fail(connected){
      console.error("eventLogViewAssembly FAILED "+connected, thePurple.fixWI(connected));
    });
  };
  
  eventLogViewAssembly.disconnect = function() {
    this.networkEventHandler.disconnect(this.channel);
    this.consoleEventHandler.disconnect(this.channel);
    this.jsEventHandler.disconnect(this.channel);
    log.disconnect(this.channel);
    filter.disconnect(log);
    viewport.disconnect(filter);
  };
  
  eventLogViewAssembly.destroy = function() {
    viewport.destroy();
    log.destroy();
    filter.destroy();
  };

  eventLogViewAssembly.partAdded = function(part) {
    if (part.hasFeature('channel')) {
      this.channel = part;
    } else if (part.name === 'jsEventHandler') {  // TODO this needs to be dynamic some other way.
      this.jsEventHandler = part;
    } else if (part.name === 'consoleEventHandler') {
      this.consoleEventHandler = part;
    } else if (part.name === 'networkEventHandler') {
      this.networkEventHandler = part;
    } 
    if (this.channel && this.jsEventHandler && this.consoleEventHandler && this.networkEventHandler && !this.initialized) {
      this.initialized = true;
      eventLogViewAssembly.initialize();
      eventLogViewAssembly.connect();
    }
  };

  eventLogViewAssembly.partRemoved = function(part) {
    var stillAlive = this.channel;
    if (stillAlive) {
      var mineRemoved = (part === this.channel);
      if (mineRemoved) {
        eventLogViewAssembly.disconnect();
        eventLogViewAssembly.destroy();
      }
    }
  };

  thePurple.registerPart(eventLogViewAssembly);
  
  return eventLogViewAssembly;
});