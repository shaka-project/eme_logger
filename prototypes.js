/**
 * Copyright 2015 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
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
 * @param {Object} data The EME data to be parsed from the Event/Call.
 * @param {string} keySystem The keySystem used for this Event/Call.
 * @constructor
 */
emePrototypes.EmeMethodCall = function(
    name, args, labels, result, target, data, keySystem) {
  this.name = name;
  this.argValues = args;
  this.argLabels = labels.slice(0, args.length);
  this.returned = result;
  this.target = new emePrototypes.TargetElement(target);
  this.formattedMessage =
      emePrototypes.getFormattedMessage(this.name, data, keySystem);
};


/**
 * Provides a simple representation of this instance to be used for messaging.
 * @return {!emePrototypes.LogItemData} A message object representing
 *    this prototype.
 */
emePrototypes.EmeMethodCall.prototype.getMessageObject = function() {
  var names = [].concat(this.argLabels);
  var values = this.argValues.map(emePrototypes.getMessagePassableObject);
  names.push('target');
  values.push(this.target.name);
  if (this.returned) {
    names.push('returned');
    values.push(emePrototypes.getMessagePassableObject(this.returned));
  }
  if (this.formattedMessage) {
    names.push('formatted message');
    values.push(this.formattedMessage);
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
  this.formattedMessage = emePrototypes.getFormattedMessage(
      this.event.type, this.event.message, this.event.keySystem);
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
             this.target.name]
  };
  if (this.formattedMessage) {
    data.names.push('formatted message');
    data.values.push(this.formattedMessage);
  }
  return data;
};


/**
 * Gets a formatted message from the EME Formatters.
 * @param {string} name The name of the Event or Call being logged.
 * @param {Object} data The EME data to be parsed from the Event/Call.
 * @param {string} keySystem The keySystem used for this Event/Call.
 * @return {string|undefined} The formatted message.
 */
emePrototypes.getFormattedMessage = function(name, data, keySystem) {
  if (!document.emeFormatters) {
    return;
  }

  var formattedMessage = '';
  for (var i = 0; i < document.emeFormatters.length; i++) {
    var formatter = document.emeFormatters[i];
    var formatFunctionName = 'format' + name;
    if (!formatter[formatFunctionName]) {
      continue;
    }
    // Only use formatters that support the |keySystem|, if specified.
    // (|keySystem| is not specified for some events.)
    if (keySystem && !formatter.isKeySystemSupported(keySystem)) {
      continue;
    }
    try {
      formattedMessage += formatter[formatFunctionName](data);
      if (i > 0) {
        formattedMessage += '\n';
      }
    } catch (e) {
      console.warn('Formatter', formatter, 'failed:', e);
    }
  }

  if (formattedMessage == '') {
    return;
  }

  return formattedMessage;
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
  this.name = element.constructor.name;
  this.id = element.id;
  if (element.classList) {
    this.classes = element.classList.toString();
  }
  this.element = element;
};


/**
 * PromiseResult contains the information resulting from a
 * resolved/rejected Promise.
 * @param {string} description A description of the Promise.
 * @param {string} status Status of the Promise.
 * @param {Object} result The result of the Promise.
 * @constructor
 */
emePrototypes.PromiseResult = function(description, status, result) {
  this.description = description;
  this.status = status;
  this.result = result;
};


/**
 * Provides a simple representation of this instance to be used for messaging.
 * @return {!emePrototypes.LogItemData} A message object representing
 *    this prototype.
 */
emePrototypes.PromiseResult.prototype.getMessageObject = function() {
  var data = {
    title: this.description,
    names: ['status', 'result'],
    values: [this.status, emePrototypes.getMessagePassableObject(this.result)]
  };
  return data;
};


/**
 * Utility method that creates a simplified version of an object to be used
 * for messaging.
 * @param {Object} item
 * @return {Object}
 */
emePrototypes.getMessagePassableObject = function(item) {
  var messageItem = item;
  if (typeof item == 'object' && item != null) {
    messageItem = { 'type': item.constructor.name };
    for (var prop in item) {
      if (item.hasOwnProperty(prop)) {
        messageItem[prop] = item[prop];
      }
    }
  }
  return messageItem;
};

