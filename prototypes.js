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
  this.title = title;
  this.target = new emeLogger.TargetObject(target);
  this.returned = result;
};


/**
 * EME Event prototype.
 * @param {string} title The title used to describe this event.
 * @param {Event} e An EME event.
 * @constructor
 */
emeLogger.EmeEvent = function(title, e) {
  this.title = title;
  this.event = e;
  this.timeStamp = new Date(e.timeStamp).toString();
  this.target = new emeLogger.TargetObject(e.target);
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
 * TargetObject pulls out the useful information from the object.
 * @param {Object} obj The target object.
 * @constructor
 */
emeLogger.TargetObject = function(obj) {
  if (!obj) {
    return;
  }
  this.title = obj.constructor.name;
  this.id = obj.id;
  if (obj.classList) {
    this.classes = obj.classList.toString();
  }
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
  this.title = title;
  this.status = status;
  this.result = result;
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
    if (prop == 'title') continue;
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
  return data;
};


/** Typed Event Prototypes **/

/**
 * Message event prototype.
 * @param {Event} e
 * @extends {emeLogger.EmeEvent}
 * @constructor
 */
emeLogger.MessageEvent = function(e) {
  emeLogger.EmeEvent.apply(this, ['MessageEvent', e]);
  // If a formatter extension is available, message will be formatted.
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
  emeLogger.EmeEvent.apply(this, ['KeyStatusesChangeEvent', e]);
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
  emeLogger.EmeEvent.apply(this, ['NeedKeyEvent', e]);
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
  emeLogger.EmeEvent.apply(this, ['KeyMessageEvent', e]);
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
  emeLogger.EmeEvent.apply(this, ['KeyAddedEvent', e]);
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
  emeLogger.EmeEvent.apply(this, ['KeyErrorEvent', e]);
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
  emeLogger.EmeEvent.apply(this, ['EncryptedEvent', e]);
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
  emeLogger.EmeEvent.apply(this, ['PlayEvent', e]);
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
  emeLogger.EmeEvent.apply(this, ['ErrorEvent', e]);
};
emeLogger.ErrorEvent.prototype = Object.create(emeLogger.EmeEvent.prototype);
/** @constructor */
emeLogger.ErrorEvent.prototype.constructor = emeLogger.ErrorEvent;


/** Typed Method Call Prototypes **/

/**
 * RequestMediaKeySystemAccess call prototype.
 * @param {Array} args
 * @param {Element} target
 * @param {Object} result
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
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.GetConfigurationCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['GetConfigurationCall', target, result]);
};
emeLogger.GetConfigurationCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.GetConfigurationCall.prototype.constructor =
    emeLogger.GetConfigurationCall;


/**
 * CreateMediaKeys call prototype.
 * @param {Array} args
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.CreateMediaKeysCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['CreateMediaKeysCall', target, result]);
};
emeLogger.CreateMediaKeysCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.CreateMediaKeysCall.prototype.constructor =
    emeLogger.CreateMediaKeysCall;


/**
 * CreateSession call prototype.
 * @param {Array} args
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.CreateSessionCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['CreateSessionCall', target, result]);
  this.sessionType = args[0];
};
emeLogger.CreateSessionCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.CreateSessionCall.prototype.constructor = emeLogger.CreateSessionCall;


/**
 * SetServerCertificate call prototype.
 * @param {Array} args
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.SetServerCertificateCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(
      this, ['SetServerCertificateCall', target, result]);
  this.serverCertificate = args[0];
};
emeLogger.SetServerCertificateCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.SetServerCertificateCall.prototype.constructor =
    emeLogger.SetServerCertificateCall;


/**
 * GenerateRequest call prototype.
 * @param {Array} args
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.GenerateRequestCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['GenerateRequestCall', target, result]);
  this.initDataType = args[0];
  this.initData = args[1];
};
emeLogger.GenerateRequestCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.GenerateRequestCall.prototype.constructor =
    emeLogger.GenerateRequestCall;


/**
 * Play call prototype.
 * @param {Array} args
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.PlayCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['PlayCall', target, result]);
};
emeLogger.PlayCall.prototype = Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.PlayCall.prototype.constructor = emeLogger.PlayCall;


/**
 * Load call prototype.
 * @param {Array} args
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.LoadCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['LoadCall', target, result]);
  this.sessionId = args[0];
};
emeLogger.LoadCall.prototype = Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.LoadCall.prototype.constructor = emeLogger.LoadCall;


/**
 * Update call prototype.
 * @param {Array} args
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.UpdateCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['UpdateCall', target, result]);
  this.response = args[0];
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
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.CloseCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['CloseCall', target, result]);
};
emeLogger.CloseCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.CloseCall.prototype.constructor = emeLogger.CloseCall;


/**
 * Remove call prototype.
 * @param {Array} args
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.RemoveCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['RemoveCall', target, result]);
};
emeLogger.RemoveCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.RemoveCall.prototype.constructor = emeLogger.RemoveCall;


/**
 * CanPlayType call prototype.
 * @param {Array} args
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.CanPlayTypeCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['CanPlayTypeCall', target, result]);
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
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.GenerateKeyRequestCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(
      this, ['GenerateKeyRequestCall', target, result]);
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
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.AddKeyCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['AddKeyCall', target, result]);
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
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.CancelKeyRequestCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['CancelKeyRequestCall', target, result]);
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
 * @param {Element} target
 * @param {Object} result
 * @extends {emeLogger.EmeMethodCall}
 * @constructor
 */
emeLogger.SetMediaKeysCall = function(args, target, result) {
  emeLogger.EmeMethodCall.apply(this, ['SetMediaKeysCall', target, result]);
  this.mediaKeys = args[0];
};
emeLogger.SetMediaKeysCall.prototype =
    Object.create(emeLogger.EmeMethodCall.prototype);
/** @constructor */
emeLogger.SetMediaKeysCall.prototype.constructor = emeLogger.SetMediaKeysCall;


