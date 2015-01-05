/**
 * @fileoverview Defines prototypes for EME method calls and events.
 */

var emePrototypes = {};


/**
 * @typedef {{
 *   title: string,
 *   names: !Array.<string>,
 *   values: !Array.<string|Object>
 * }}
 */
emePrototypes.LogItemData;


/**
 * Method call prototype.
 * @param {string} name The name of the method.
 * @param {!Array} args The arguments this call was made with.
 * @param {!Array.<string>} labels A list of the types of arguments. Should
 *    correspond in length to the args array. Need to be in order with the args.
 * @param {Object} result The result of this method call.
 * @param {Element} target The element this method was called on.
 * @constructor
 */
emePrototypes.EmeMethodCall = function(name, args, labels, result, target) {
  this.name = name;
  this.argValues = args;
  this.argLabels = labels.slice(0, args.length);
  this.returned = result;
  this.target = new emePrototypes.TargetElement(target);
};


/**
 * Provides a simple representation of this instance to be used for messaging.
 * @return {!emePrototypes.LogItemData} A message object representing
 *    this prototype.
 */
emePrototypes.EmeMethodCall.prototype.getMessageObject = function() {
  var names = [].concat(this.argLabels);
  var values = [].concat(this.argValues);
  names.push('target');
  values.push(this.target.element.constructor.name);
  if (this.returned) {
    names.push('returned');
    values.push(this.returned.constructor.name);
  }
  var data = {
    title: this.name,
    names: names,
    values: values
  };
  return data;
};


/**
 * EME Event prototype.
 * @param {Event} e An EME event.
 * @constructor
 */
emePrototypes.EmeEvent = function(e) {
  this.type = e.type;
  this.event = e;
  this.timeStamp = new Date(e.timeStamp).toString();
  this.target = new emePrototypes.TargetElement(e.target);
};


/**
 * Provides a simple representation of this instance to be used for messaging.
 * @return {!emePrototypes.LogItemData} A message object representing
 *    this prototype.
 */
emePrototypes.EmeEvent.prototype.getMessageObject = function() {
  var data = {
    title: this.type + 'Event',
    names: ['type', 'time', 'event', 'target element'],
    values: [this.type, this.timeStamp, this.event.constructor.name,
             this.target.element.constructor.name]
  };
  return data;
};


/**
 * TargetElement pulls out the useful information from the element for easy
 * access while also providing access to the entire element.
 * @param {Element} element An HTML element.
 * @constructor
 */
emePrototypes.TargetElement = function(element) {
  if (!element) {
    return;
  }
  this.id = element.id;
  if (element.classList) {
    this.classes = element.classList.toString();
  }
  this.element = element;
};

