// Google BSD license http://code.google.com/google_bsd_license.html
// Copyright 2011 Google Inc. johnjbarton@google.com

/*globals define console*/

define(['crx2app/lib/q/q'], function (Q) {
  
  // A left paren ( followed by any not-right paren ) followed by right paren
  var reParamList = /\(([^\)]*)\)/; 
  var reParameters = /\(([^\)]*)\)/;
  
  // parse the function source to get the parameter name
  function getParamsFromAPI(fnc) {
    var paramList = [];
    var src = fnc.toString();
    var m = reParamList.exec(src);
    if (m && m[1]) {
      var spacyParamList = m[1].split(',');
      spacyParamList.forEach(function(spacy) {
        var paramName = spacy.trim();
        if (paramName) {
          paramList.push(spacy.trim());
        }
      });
    }
    return paramList;
  }
  
  // build a JSON object for Remote Debugging 
  
  function bindParams(paramNames, argValues) {
    var params = {};
    var max = Math.min(paramNames.length, argValues.length);
    for(var i = 0; i < max; i++) {
      var name = paramNames[i];
      params[name] = argValues[i];
    }
    return params;
  }
 
 
  // global monotonic 
  var serialCounter = 1; // every serial must be truthy
  // promises made and not kept by serial
  var deferredBySerial = {};

  function makeSendRemoteCommand(channel, target, method, preArgs) {
    // we close over the argumentes
    return function sendRemoteCommand() {  // arguments here will depend upon method
      var args = Array.prototype.slice.apply(arguments, [0]);
      
      // Our sequence number for RPC
      var serial =  serialCounter++;
      
      // store the deferred for recvResponseData
      var deferred = deferredBySerial[serial] = Q.defer();
      var promise = deferred.promise;
      
      // Check for a callback function
      if (typeof args[args.length - 1] === 'function') {
        // remove the callback, otherwise we get a DOM error on serialization
        var callback = args.pop();
        // once we get an answer, send it to the callback
        promise = Q.when(promise, function(promise){
          console.log("callback now "+promise);
          callback(promise);
        }, function() {
          var errMsg = arguments[0];
          if (errMsg && errMsg.method && (errMsg.method === 'onError') && errMsg.args && errMsg.args.length ) {
            console.error("Error "+errMsg.args[0], errMsg.args[1]);
          } else {
            console.error("JSONMarshall sendRemoteCommand ERROR ", arguments);
          }
        });
        promise.end();
      }
      
      // Similar to bind(), we set some args at build time
      if (preArgs && (preArgs instanceof Array) ) {
        args = preArgs.concat(args);
      }
      
      var message = {target: target, method: method,  params: args, serial: serial};
      
      channel.postMessage(message);
      // callers can wait on the promise to be resolved by recvResponseData
      return promise; 
    };
  }
  
  function marshallForHandler(impl, handler) {
    return function (paramsFromJSON, p_id) {
      var args = [];
      for (var i = 0; i < handler.parameters.length; i++) {
        args[i] = paramsFromJSON[i];
      }
      args.push(p_id);  // purple specific clock tick postpended
      handler.apply(impl, args);
    };
  }
  
  //---------------------------------------------------------------------------------------------
  // Beware: this object will be extended with methods from the chrome.* API. So any of the 
  // functions can be shadowed. TODO: fix this fragile issue
  
  var JSONMarshall = {};

  JSONMarshall.applyToparsedJSON = function(p_id, data, method) {
    try {
      var objFromJSON = data.params;
      if (typeof(objFromJSON) === 'string') {
        objFromJSON = JSON.parse(data.params);
      }
      return method.apply(null, [objFromJSON, p_id]);
    } catch(exc) {
      console.error("JSONMarshall ERROR "+exc, exc.stack, data.params);
    }
  };
  
  JSONMarshall.recvResponse = function(data) {
    console.log("JSONMarshal.recvResponse "+data.source, data);
    if (data && data.serial) {
      this.recvResponseData(data);
    } else { // not a response
      var method = data.method;
      if (method === 'onError') {
        console.error("JSONMarshal.recvResponse ERROR "+data.source+':'+data.params[0]);
      } else {
        if (method) {
          var objectKey = data.source;
          if ( this.jsonHandlers.hasOwnProperty(objectKey) ) {
            var object = this.jsonHandlers[objectKey];
            var handler = object.hasOwnProperty(method) && object[method];
            if (handler) {
              handler.apply(this, [data.params, data.p_id]);
            } else {
              console.warn("JSONMarshal.recvResponse dropped data, no handler for "+method, data);
            }
          } else {
            console.warn("JSONMarshal.recvResponse dropped data, no object "+objectKey, data);
          }
        } else {
          console.error("JSONMarshal.recvResponse dropped data, no .serial and  .method ", data);
        }
      }
    }
  };
  
  
  JSONMarshall.recvResponseData = function(data) {
    var serial = data.serial; // set by sendRemoteCommand
    var deferred = deferredBySerial[serial];
    if (deferred) {
      try {
        if (data.method && (data.method !== 'onError') ) {
          deferred.resolve(data.params[0]);
        } else {
          if (data.method && data.method === 'onError') {
            deferred.reject({
              toString: function() {
                return data.params[0];
              },
              request: data.params[1]
            });
          } else {
            deferred.reject(data);
          }
        }
      } finally {
        console.log("recvResponseData completed "+serial, data);
        delete deferredBySerial[serial];
      }
    } // else another remote may have created the request
  };
  
  // The chrome.debugger API has 'domains' like Console, Debugger. 
  // Each domain has functions as properties.
  // 
  JSONMarshall.flattenDomains = function(obj) {
    var flatObj = {};
    Object.keys(obj).forEach(function flattenDomain(domainName) {
      var domain = obj[domainName];
      Object.keys(domain).forEach(function buildProperty(name) {
        flatObj[domainName+'.'+name] = domain[name];
      });
    });
    return flatObj;
  };
  
  JSONMarshall.addHandlerParameters = function(handler, handlerSpec) {
    var m = reParameters.exec(handlerSpec.toString());
    var params = m[1].split(',');
    handler.parameters = [];
    for (var i = 0; i < params.length; i++) {
      var param = params[i].trim();
      if (param) {
        handler.parameters[i] = param;
      }
    }
  };
  
  // return: dictionary of functions accepting json objects, calling impl handlers
  // iface: empty functions for each possible method name coming over JSON
  // objectKey: name, eg chrome.debugger, chrome.windows,...
  // impl: defn for some of the iface entries becomes |this| for handlers
  // eventHandlers: {Debugger: {functions}, Console: {functions}}
  JSONMarshall.buildEventHandlers = function(iface, objectKey, impl) {
    this.jsonHandlers = this.jsonHandlers || {};
    var object = this.jsonHandlers[objectKey] = {};
    var handlerNames = Object.keys(iface);
    handlerNames.forEach(function buildHandler(handlerName) {
      var handlerSpec = iface[handlerName]; // an empty function
      var handler = impl[handlerName];  // implementation function of
      if (handler) {
        this.addHandlerParameters(handler, handlerSpec);
        object[handlerName] = marshallForHandler(impl, handler);
      }
    }.bind(this));
  };
   
  // Walk the API and implement each function to send over channel.
  JSONMarshall.buildPromisingCalls = function(iface, impl, channel, preArgs) {
    var methods = Object.keys(iface.api);
    methods.forEach(function buildMethod(method) {
      // each RHS is a function returning a promise
      impl[method] = makeSendRemoteCommand(channel, iface.name, method, preArgs);
    });
    this._attach(channel);
  };
  
  // chrome.debugger remote methods have domain.method names
  JSONMarshall.build2LevelPromisingCalls = function(iface, impl, channel, preArgs) {
    var api = iface.api;
    var domains = Object.keys(api);
    domains.forEach(function buildSend(domain) {
      impl[domain] = {};
      var methods = Object.keys(api[domain]);
      methods.forEach(function buildMethod(method) {
        // each RHS is a function returning a promise
        impl[domain][method] = makeSendRemoteCommand(channel, iface.name, domain+'.'+method, preArgs);
      });
    });
    this._attach(channel);
  };
  
  
  // This is called during buildPromisingCalls
  
  JSONMarshall._attach = function(channel) {
    // bind promise resolution to the recv 
    if (!this.boundRecv) {
      this.boundRecv = this.recvResponse.bind(this);
    }
    channel.addListener(this.boundRecv);
  };
  
  JSONMarshall._detach = function(channel) {
    channel.removeListener(this.boundRecv);
  };

  return JSONMarshall;

});
