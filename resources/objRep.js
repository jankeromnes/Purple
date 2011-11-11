// See Purple/license.txt for Google BSD license
// Copyright 2011 Google, Inc. johnjbarton@johnjbarton.com

define(['../lib/domplate/lib/domplate', '../resources/Resources', 'lib/element', 'lib/reps', 'lib/Rep'], 
function (                   domplate,                Resources,       Element,        reps,      Rep) {
  
  var thePurple = window.purple;
  
  with(domplate.tags) {
    var PrimitiveRep = domplate.domplate(Rep, {
      tag: SPAN({"class": 'PrimitiveRep StringRep'}, "$object|getString"),
      getString: function(object) {
        return object ? "'"+object+"'" : "";
      }
    });
    
    var StringRep = domplate.domplate(Rep, {
      tag: SPAN({"class": 'StringRep'}, "$object|getString"),
      getString: function(object) {
        return object ? "'"+object+"'" : "";
      }
    });
    
    var FoldedRep = domplate.domplate(Rep, {
      foldedTag: SPAN({'class':'objectMore vCentering', _repObject:'$object', 'onclick': '$toggleMore','onmouseover':'$over', 'onmouseout':'$out' },   
        SPAN({"class": "objectLeftBrace", role: "presentation"}, "{"),
        IMG({'class':'closedTwisty', 'src':"../ui/icons/from-firebug/twistyClosed.png"}),
        IMG({'class':'openedTwisty', 'src':"../ui/icons/from-firebug/twistyOpen.png"}),
        SPAN({"class": "objectRightBrace"}, "}")   
      ),
      toggleMore: function(event) {
        console.log("FoldedRep click "+(event.timeStamp - this.mouseOverEvent.timeStamp), {clickEvent: event, overEvent: this.mouseOverEvent}); 
      },
      over: function(event) {
        var objectMoreElt = event.currentTarget; /* objectMore has the onclick and the repObject */
        var enteredFrom = event.relatedTarget;
        // Mimic mouseenter http://www.ruby-forum.com/topic/112071
        if (enteredFrom === objectMoreElt || Element.isAncestorOf(objectMoreElt, enteredFrom)) {  // then we are still within the poppedOver
          return;
        }
        objectMoreElt.classList.add('poppedOver');
        if (objectMoreElt.popOver) {
          return;
        }
        //this.debugEvent(event);
        var object = objectMoreElt.repObject;
        var rep = reps.getRepByObject(object);
        objectMoreElt.popOver = this.getPopOverElement(objectMoreElt);
        rep.tag.replace({object:object}, objectMoreElt.popOver);
        
        event.stopPropagation(); // support for nesting popOvers
        event.preventDefault();
      },
      out: function(event) {
        var objectMoreElt = event.currentTarget; /* objectMore has the onclick and the repObject */
        var exitedTo = event.relatedTarget;
        if (exitedTo === objectMoreElt || Element.isAncestorOf(objectMoreElt, exitedTo)) {  // then we did not exit the poppedOver
          return;
        }
        //this.debugEvent(event);
        objectMoreElt.classList.remove('poppedOver');  // hide the popOver via CSS
        event.stopPropagation();  // support for nesting popOvers
        event.preventDefault();
      },
      getPopOverElement: function(elt) {
        if (!elt.popOver) { // cached, is it a good idea?
          elt.popOver = elt.ownerDocument.createElement('div');
          elt.popOver.classList.add('popOver');
          var popOverEnlarger = elt.ownerDocument.createElement('div');
          popOverEnlarger.classList.add('popOverEnlarger');
          popOverEnlarger.appendChild(elt.popOver);
          elt.appendChild(popOverEnlarger);
        }
        return elt.popOver;
      },
      debugEvent: function(event) {
        console.log(event.type+' '+event.eventPhase+": "+event.currentTarget.localName+event.currentTarget.textContent+'\n('+event.target.localName+event.target.textContent+" <- \n"+event.relatedTarget.localName+event.relatedTarget.textContent+')\n');
      }
    });
    
    var objRepShortTag = SPAN({
             "class":"objectRep",
             _repObject: '$object', 
            },    
            SPAN({"class": "objectTitle"}, "$object|getTitle "),
            SPAN({"class": "objectLeftBrace", role: "presentation"}, "{"),
            FOR("prop", "$object|shortPropIterator",
              SPAN({'class':'objectProperties'},
                " $prop.name",
                SPAN({"class": "objectEqual", role: "presentation"}, "$prop.equal"),
                TAG("$prop.tag", {object: "$prop.value"}),
                SPAN({"class": "objectComma", role: "presentation"}, "$prop.delim")
              )
            ),
            SPAN({"class": "objectRightBrace"}, "}") 
          );
    
    var ObjRep = domplate.domplate(FoldedRep, {
      shortTag: objRepShortTag,
      tag: DIV({}, objRepShortTag),
      getTitle: function(object) {
        var protolink = Object.getPrototypeOf(object);
        if (protolink.hasOwnProperty('constructor')) { // then the prototype<->constructor match is probably intact
          var className = protolink.constructor.name;
          return  (className !== 'Object' ? className : '') || ''; // || use Nonymous naming to get the function name
        }
        // else the object was constructed from a function whose prototype has been walked on.
        return "";
      },
      showValuesOfTheseNames: ['id', 'name'],
      shortPropIterator: function(object) {
        var idProps = [];
        var stringProps = [];
        var otherProps = [];
        for (var p in object) {
          if (ObjRep.showValuesOfTheseNames.indexOf(p) !== -1) {
            idProps.push(this.idProp(object, p));
          } else if (typeof object[p] === 'string') {
            stringProps.push(this.stringProp(object,p));
          } else {
            otherProps.push(this.otherProp(object,p));
          }
        }
        return idProps.concat(stringProps, otherProps);
      },
      idProp: function(object, p) {
        return {
          name: '', // let the string speak for itself
          equal: '',
          tag: StringRep.tag,
          value: object[p]+'',
          delim: ',',
        };
      },
      stringProp: function(object, p) {
        return {
          name: p,
          equal: ':',
          tag: StringRep.tag,
          value: object[p],
          delim: ','
        };
      },
      otherProp: function(object, p) {
        var value = object[p];
        var rep = reps.getRepByObject(value);
        return {
          name: p,
          equal: ':',
          value: value,
          tag: rep.foldedTag || rep.shortTag || rep.tag,
          delim: ',',
        };
      },
      // Implements Rep
      name: "ObjRep",
      getRequiredPropertyNames: function() {
        return [];
      },
      getOptionalPropertyNames: function() {
        return []; 
      }
    });
    
  
  }
  
   
  reps.registerPart(ObjRep);
  reps.primitiveRep = PrimitiveRep;
  
  return ObjRep;
});