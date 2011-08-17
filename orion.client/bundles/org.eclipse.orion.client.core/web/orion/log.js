/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define window */

define(["dojo"], function(dojo){

var exports = {};

/**
 * Creates an instance of the log service using the provided service registry.
 * @class The log service provides services for logging information messages
 * @name orion.log.LogService
 */
exports.LogService = function(serviceRegistry) {
	this._serviceRegistry = serviceRegistry;
	this._serviceRegistration = serviceRegistry.registerService("orion.core.log", this);
};
 
exports.LogService.prototype = /** @lends orion.log.LogService.prototype */ {
	/**
	 * Prints an information message to the log.
	 * @param {String} msg The message to be logged
	 */
	info : function(message) {
		// TODO temporary implementation uses status line
		// obviously not the real answer
		this._serviceRegistry.getService("orion.page.message").then(function(service) {
			service.setMessage("LOG: " + message);
		});
	}
};

return exports;
});