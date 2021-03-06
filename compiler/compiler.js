// See licence.txt for Google BSD license
// Copyright 2011 Google, Inc. johnjbarton@johnjbarton.com

define(['lib/Feature', 'lib/features'], function (Feature, Features) {
  
  var compiler = Feature.new({
    name: "compiler",
    api: {
      // EcmaScript 5: 7.5 Tokens
	  TokenTypes: [
	    'IdentifierName', 
	    'Punctuator', 
	    'NumericLiteral', 
	    'StringLiteral', 
	    'RegularExpressionLiteral',
	    'Comment', //  7.4 Comments
	    'ReservedWord', //  7.6.1 Keywords, FutureReservedWord, NullLiteral, BooleanLiteral
	    'Experimental', // valid token not in ES5
	    'Error'
	    ]
    }
  });

  Features.registerPart(compiler);
  
  return compiler;
  
});