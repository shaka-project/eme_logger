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

var emeLogger = {};


/**
 * @typedef {{
 *   title: string,
 *   timestamp: string,
 *   names: !Array.<string>,
 *   values: !Array.<*>
 * }}
 */
emeLogger.LogItemData;


/**
 * Method call prototype.
 * @param {string} title The title used to describe this call.
 * @param {!Object} target The element this method was called on.
 * @param {Object} result The object returned from this call, if any.
 * @constructor
 */
emeLogger.EmeMethodCall = function(title, target, result) {
  this.timestamp = emeLogger.timeToString_(new Date().getTime());
  this.title = title;
  this.target = target;
  this.returned = result;
};


/**
 * EME Event prototype.
 * @param {string} title The title used to describe this event.
 * @param {Event} e An EME event.
 * @param {Object} target The element this event was fired on.
 * @constructor
 */
emeLogger.EmeEvent = function(title, e, target) {
  this.title = title;
  this.event = e;
  this.timestamp = emeLogger.timeToString_(e.timeStamp);
  this.target = target;
};


/**
 * Constructs a time string in the format hh:mm:ss:mil.
 * @param {number} time The time in milliseconds.
 * @return {string} A human readable string respresenting the time.
 * @private
 */
emeLogger.timeToString_ = function(time) {
  var date = new Date(time);
  var hours = emeLogger.padNumber_(date.getHours().toString());
  var minutes = emeLogger.padNumber_(date.getMinutes().toString());
  var seconds = emeLogger.padNumber_(date.getSeconds().toString());
  var milli = emeLogger.padNumber_(date.getMilliseconds().toString());
  return hours.concat(':', minutes, ':', seconds, ':', milli);
};


/**
 * Pads a number with leading zeros.
 * @param {string} num A string representing the number.
 * @param {number} length The desired length of the string.
 * @return {string} A string padded with zeros to the desired length.
 * @private
 */
emeLogger.padNumber_ = function(num, length) {
  while (num.length < length) {
    num = '0' + num;
  }
  return num;
};


/**
 * Gets a formatted message from the EME Formatters.
 * @param {string} name The name of the Event or Call being logged.
 * @param {Object} data The EME data to be parsed from the Event/Call.
 * @param {string} keySystem The keySystem used for this Event/Call.
 * @return {string|undefined} The formatted message.
 */
emeLogger.getFormattedMessage = function(name, data, keySystem) {
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
 * PromiseResult contains the information resulting from a
 * resolved/rejected Promise.
 * @param {string} title The title used to describe this Promise.
 * @param {string} status Status of the Promise.
 * @param {Object} result The result of the Promise.
 * @constructor
 */
emeLogger.PromiseResult = function(title, status, result) {
  this.timestamp = emeLogger.timeToString_(new Date().getTime());
  this.title = title;
  this.status = status;
  if (result) {
    this.result = result.constructor.name == 'MediaKeySystemAccess' ?
      new emeLogger.MediaKeySystemAccess(result) : result;
  }
};


/**
 * Provides a simple representation of obj to be used for messaging. The
 * names and values returned in emeLogger.LogItemData will only reflect the
 * object's direct properties.
 * @param {Object} obj An object to format into emeLogger.LogItemData.
 * @return {!emeLogger.LogItemData} A formatted object.
 */
emeLogger.getMessagePassableObject = function(obj) {
  var names = [];
  var values = [];
  for (var prop in obj) {
    if (prop == 'title' || prop == 'timestamp') continue;
    // We only care about direct properties of the object. Calling
    // hasOwnProperty will stop from checking down the object's prototype chain.
    if (obj.hasOwnProperty(prop)) {
      if (typeof(obj[prop]) == 'function') continue;
      names.push(prop);
      if (typeof(obj[prop]) == 'object' && obj[prop] != null) {
        // Give ArrayBuffers a view so they can be properly logged.
        var value = obj[prop].constructor.name == 'ArrayBuffer' ?
            new Uint8Array(obj[prop]) : obj[prop];
        values.push(emeLogger.getMessagePassableObject(value));
      } else {
        values.push(obj[prop]);
      }
    }
  }
  var data = {
    title: obj.title || obj.constructor.name,
    names: names,
    values: values
  };
  if (obj.timestamp) {
    data.timestamp = obj.timestamp;
  }
  return data;
};


/** Typed Object Prototypes **/

/**
 * MediaKeySystemAccess object prototype. Calls getConfiguration to include
 * the objects configuration.
 * @param {!MediaKeySystemAccess} mksa The MediaKeySystemAccess object
 * @constructor
 */
emeLogger.MediaKeySystemAccess = function(mksa) {
  this.title = 'MediaKeySystemAccess';
  this.keySystem = mksa.keySystem;
  this.configuration = mksa.listenersAdded_ ?
      mksa.originalGetConfiguration() : mksa.getConfiguration();
};


/**
 * MediaKeySession object prototype.
 * @param {!MediaKeySession} mks The MediaKeySession object.
 * @constructor
 */
emeLogger.MediaKeySession = function(mks) {
  this.title = 'MediaKeySession';
  this.sessionId = mks.sessionId;
  this.expiration = mks.expiration;
  this.keyStatuses = [];
  mks.keyStatuses.forEach(function(status, keyId) {
    this.keyStatuses.push({'keyId' : new Uint8Array(keyId), 'status' : status});
  }.bind(this));
};


/**
 * HTMLMediaElement object prototype.
 * @param {!HTMLMediaElement} element The HTMLMediaElement.
 * @constructor
 */
emeLogger.HTMLMediaElement = function(element) {
  this.title = element.constructor.name;
  this.id = element.id;
  if (element.classList) {
    this.classes = element.classList.toString();
  }
};

/** Typed Event Prototypes **/

/**
 * Message event prototype.
 * @param {Event} e
 * @extends {emeLogger.EmeEvent}
 * @constructor
 */
emeLogger.MessageEvent = function(e) {
  var mks = new emeLogger.MediaKeySession(e.target);
  emeLogger.EmeEvent.apply(this, ['MessageEvent', e, mks]);
  // If a formatter extension is available, message will be formatted.
  this.message = new Uint8Array(e.message);
  this.formattedMessage = emeLogger.getFormattedMessage(
      'message', e.message, e.keySystem);
};
emeLogger.MessageEvent.prototype = Object.create(emeLogger.EmeEvent.prototype);
/** @constructor */
emeLogger.MessageEvent.prototype.constructor = emeLogger.MessageEvent;


/**
 * KeyStatusesChange event prototype.
 * @param {Event} e
 * @extends {emeLogger.EmeEvent}
 * @constructor
 */
emeLogger.KeyStatusesChangeEvent = function(e) {
  var mks = new emeLogger.MediaKeySession(e.target);
  emeLogger.EmeEvent.apply(this, ['KeyStatusesChangeEvent', e, mks]);
};
emeLogger.KeyStatusesChangeEvent.prototype =
    Object.create(emeLogger.EmeEvent.prototype);
/** @constructor */
emeLogger.KeyStatusesChangeEvent.prototype.constructor =
    emeLogger.KeyStatusesChangeEvent;


/**
 * NeedKey event prototype.
 * @param {Event} e
 * @extends {emeLogger.EmeEvent}
 * @constructor
 */
emeLogger.NeedKeyEvent = function(e) {
  var element = new emeLogger.HTMLMediaElement(e.target);
  emeLogger.EmeEvent.apply(this, ['NeedKeyEvent', e, element]);
};
emeLogger.NeedKeyEvent.prototype = Object.create(emeLogger.EmeEvent.prototype);
/** @constructor */
emeLogger.NeedKeyEvent.prototype.constructor = emeLogger.NeedKeyEvent;


/**
 * KeyMessage event prototype.
 * @param {Event} e
 * @extends {emeLogger.EmeEvent}
 * @constructor
 */
emeLogger.KeyMessageEvent = function(e) {
  var element = new emeLogger.HTMLMediaElement(e.target);
  emeLogger.EmeEvent.apply(this, ['KeyMessageEvent', e, element]);
  // If a formatter extension is available, message will be formatted.
  this.formattedMessage = emeLogger.getFormattedMessage(
      'webkitkeymessage', e.message, e.keySystem);
};
emeLogger.KeyMessageEvent.prototype =
    Object.create(emeLogger.EmeEvent.prototype);
/** @constructor */
emeLogger.KeyMessageEvent.prototype.constructor = emeLogger.KeyMessageEvent;


/**
 * KeyAdded event prototype.
 * @param {Event} e
 * @extends {emeLogger.EmeEvent}
 * @constructor
 */
emeLogger.KeyAddedEvent = function(e) {
  var element = new emeLogger.HTMLMediaElement(e.target);
  emeLogger.EmeEvent.apply(this, ['KeyAddedEvent', e, element]);
};
emeLogger.KeyAddedEvent.prototype = Object.create(emeLogger.EmeEvent.prototype);
/** @constructor */
emeLogger.KeyAddedEvent.prototype.constructor = emeLogger.KeyAddedEvent;


/**
 * KeyError event prototype.
 * @param {Event} e
 * @extends {emeLogger.EmeEvent}
 * @constructor
 */
emeLogger.KeyErrorEvent = function(e) {
  var element = new emeLogger.HTMLMediaElement(e.target);
  emeLogger.EmeEvent.apply(this, ['KeyErrorEvent', e, element]);
};
emeLogger.KeyErrorEvent.prototype =
    Object.create(emeLogger.EmeEvent.prototype);
/** @constructor */
emeLogger.KeyErrorEvent.prototype.constructor = emeLogger.KeyErrorEvent;


/**
 * Encrypted event prototype.
 * @param {Event} e
 * @extends {emeLogger.EmeEvent}
 * @constructor
 */
emeLogger.EncryptedEvent = function(e) {
  var element = new emeLogger.HTMLMediaElement(e.target);
  emeLogger.EmeEvent.apply(this, ['EncryptedEvent', e, element]);
};
emeLogger.EncryptedEvent.prototype =
    Object.create(emeLogger.EmeEvent.prototype);
/** @constructor */
emeLogger.EncryptedEvent.prototype.constructor = emeLogger.EncryptedEvent;


/**
 * Play event prototype.
 * @param {Event} e
 * @extends {emeLogger.EmeEvent}
 * @constructor
 */
emeLogger.PlayEvent = function(e) {
  var element = new emeLogger.HTMLMediaElement(e.target);
  emeLogger.EmeEvent.apply(this, ['PlayEvent', e, element]);
};
emeLogger.PlayEvent.prototype = Object.create(emeLogger.EmeEvent.prototype);
/** @constructor */
emeLogger.PlayEvent.prototype.constructor = emeLogger.PlayEvent;


/**
 * Error event prototype.
 * @param {Event} e
 * @extends {emeLogger.EmeEvent}
 * @constructor
 */
emeLogger.ErrorEvent = function(e) {
  var element = new emeLogger.HTMLMediaElement(e.target);
  emeLogger.EmeEvent.apply(this, ['ErrorEvent', e, element]);
};
emeLogger.ErrorEvent.prototype = Object.create(emeLogger.EmeEvent.prototype);
/** @constructor */
emeLogger.ErrorEvent.prototype.constructor = emeLogger.ErrorEvent;


/** Typed Method Call Prototypes **/

/**
 * RequestMediaKeySystemAccess call prototype.
 * @param {Array} args
 * @param {Navigator} target
 * @param {Promise} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.RequestMediaKeySystemAccessCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(
      this, ['RequestMediaKeySystemAccessCall', target, result]);
  this.keySystem = args[0];
  this.supportedConfigurations = args[1];
};
emeLogger.RequestMediaKeySystemAccessCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.RequestMediaKeySystemAccessCall.prototype.constructor =
    emeLogger.RequestMediaKeySystemAccessCall;


/**
 * GetConfiguration call prototype.
 * @param {Array} args
 * @param {MediaKeySystemAccess} target
 * @param {MediaKeySystemConfiguration} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.GetConfigurationCall = function(args, target, result) {
  var mksa = new emeLogger.MediaKeySystemAccess(target);
  emeLogger.EmeMethodCall.apply(this, ['GetConfigurationCall', mksa, result]);
};
emeLogger.GetConfigurationCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.GetConfigurationCall.prototype.constructor =
    emeLogger.GetConfigurationCall;


/**
 * CreateMediaKeys call prototype.
 * @param {Array} args
 * @param {MediaKeySystemAccess} target
 * @param {Promise} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.CreateMediaKeysCall = function(args, target, result) {
  var mksa = new emeLogger.MediaKeySystemAccess(target);
  emeLogger.EmeMethodCall.apply(this, ['CreateMediaKeysCall', mksa, result]);
};
emeLogger.CreateMediaKeysCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.CreateMediaKeysCall.prototype.constructor =
    emeLogger.CreateMediaKeysCall;


/**
 * CreateSession call prototype.
 * @param {Array} args
 * @param {MediaKeys} target
 * @param {MediaKeySession} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.CreateSessionCall = function(args, target, result) {
  var mks = new emeLogger.MediaKeySession(result);
  emeLogger.EmeMethodCall.apply(this, ['CreateSessionCall', target, mks]);
  // Temporary is the default session type if none is provided.
  this.sessionType = args[0] ? args[0] : 'temporary';
};
emeLogger.CreateSessionCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.CreateSessionCall.prototype.constructor = emeLogger.CreateSessionCall;


/**
 * SetServerCertificate call prototype.
 * @param {Array} args
 * @param {MediaKeys} target
 * @param {Promise} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.SetServerCertificateCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(
      this, ['SetServerCertificateCall', target, result]);
  this.serverCertificate = new Uint8Array(args[0]);
};
emeLogger.SetServerCertificateCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.SetServerCertificateCall.prototype.constructor =
    emeLogger.SetServerCertificateCall;


/**
 * GenerateRequest call prototype.
 * @param {Array} args
 * @param {MediaKeySession} target
 * @param {Promise} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.GenerateRequestCall = function(args, target, result) {
  var mks = new emeLogger.MediaKeySession(target);
  emeLogger.EmeMethodCall.apply(this, ['GenerateRequestCall', mks, result]);
  this.initDataType = args[0];
  this.initData = new Uint8Array(args[1]);
};
emeLogger.GenerateRequestCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.GenerateRequestCall.prototype.constructor =
    emeLogger.GenerateRequestCall;


/**
 * Play call prototype.
 * @param {Array} args
 * @param {HTMLMediaElement} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.PlayCall = function(args, target, result) {
  var element = new emeLogger.HTMLMediaElement(target);
  emeLogger.EmeMethodCall.apply(this, ['PlayCall', element, result]);
};
emeLogger.PlayCall.prototype = Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.PlayCall.prototype.constructor = emeLogger.PlayCall;


/**
 * Load call prototype.
 * @param {Array} args
 * @param {MediaKeySession} target
 * @param {Promise} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.LoadCall = function(args, target, result) {
  var mks = new emeLogger.MediaKeySession(target);
  emeLogger.EmeMethodCall.apply(this, ['LoadCall', mks, result]);
  this.sessionId = args[0];
};
emeLogger.LoadCall.prototype = Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.LoadCall.prototype.constructor = emeLogger.LoadCall;


/**
 * Update call prototype.
 * @param {Array} args
 * @param {MediaKeySession} target
 * @param {Promise} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.UpdateCall = function(args, target, result) {
  var mks = new emeLogger.MediaKeySession(target);
  emeLogger.EmeMethodCall.apply(this, ['UpdateCall', mks, result]);
  this.response = new Uint8Array(args[0]);
  // If a formatter extension is available, response will be formatted.
  this.formattedMessage = emeLogger.getFormattedMessage(
      'UpdateCall', this.response, target.keySystem_);
};
emeLogger.UpdateCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.UpdateCall.prototype.constructor = emeLogger.UpdateCall;


/**
 * Close call prototype.
 * @param {Array} args
 * @param {MediaKeySession} target
 * @param {Promise} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.CloseCall = function(args, target, result) {
  var mks = new emeLogger.MediaKeySession(target);
  emeLogger.EmeMethodCall.apply(this, ['CloseCall', mks, result]);
};
emeLogger.CloseCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.CloseCall.prototype.constructor = emeLogger.CloseCall;


/**
 * Remove call prototype.
 * @param {Array} args
 * @param {MediaKeySession} target
 * @param {Promise} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.RemoveCall = function(args, target, result) {
  var mks = new emeLogger.MediaKeySession(target);
  emeLogger.EmeMethodCall.apply(this, ['RemoveCall', mks, result]);
};
emeLogger.RemoveCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.RemoveCall.prototype.constructor = emeLogger.RemoveCall;


/**
 * CanPlayType call prototype.
 * @param {Array} args
 * @param {HTMLMediaElement} target
 * @param {DOMString} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.CanPlayTypeCall = function(args, target, result) {
  var element = new emeLogger.HTMLMediaElement(target);
  emeLogger.EmeMethodCall.apply(this, ['CanPlayTypeCall', element, result]);
  this.type = args[0];
  this.keySystem = args[1];
};
emeLogger.CanPlayTypeCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.CanPlayTypeCall.prototype.constructor = emeLogger.CanPlayTypeCall;


/**
 * GenerateKeyRequest call prototype.
 * @param {Array} args
 * @param {HTMLMediaElement} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.GenerateKeyRequestCall = function(args, target, result) {
  var element = new emeLogger.HTMLMediaElement(target);
  emeLogger.EmeMethodCall.apply(
      this, ['GenerateKeyRequestCall', element, result]);
  this.keySystem = args[0];
  this.initData = args[1];
};
emeLogger.GenerateKeyRequestCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.GenerateKeyRequestCall.prototype.constructor =
    emeLogger.GenerateKeyRequestCall;


/**
 * AddKey call prototype.
 * @param {Array} args
 * @param {HTMLMediaElement} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.AddKeyCall = function(args, target, result) {
  var element = new emeLogger.HTMLMediaElement(target);
  emeLogger.EmeMethodCall.apply(this, ['AddKeyCall', element, result]);
  this.keySystem = args[0];
  this.key = args[1];
  this.initData = args[2];
  this.sessionId = args[3];
  // If a formatter extension is available, key will be formatted.
  this.formattedMessage = emeLogger.getFormattedMessage(
      'AddKeyCall', this.key, this.keySystem);
};
emeLogger.AddKeyCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.AddKeyCall.prototype.constructor = emeLogger.AddKeyCall;


/**
 * CancelKeyRequest call prototype.
 * @param {Array} args
 * @param {HTMLMediaElement} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.CancelKeyRequestCall = function(args, target, result) {
  var element = new emeLogger.HTMLMediaElement(target);
  emeLogger.EmeMethodCall.apply(
      this, ['CancelKeyRequestCall', element, result]);
  this.keySystem = args[0];
  this.sessionId = args[1];
};
emeLogger.CancelKeyRequestCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.CancelKeyRequestCall.prototype.constructor =
    emeLogger.CancelKeyRequestCall;


/**
 * SetMediaKeys call prototype.
 * @param {Array} args
 * @param {HTMLMediaElement} target
 * @param {Promise} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.SetMediaKeysCall = function(args, target, result) {
  var element = new emeLogger.HTMLMediaElement(target);
  emeLogger.EmeMethodCall.apply(this, ['SetMediaKeysCall', element, result]);
  this.mediaKeys = args[0];
};
emeLogger.SetMediaKeysCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.SetMediaKeysCall.prototype.constructor = emeLogger.SetMediaKeysCall;


