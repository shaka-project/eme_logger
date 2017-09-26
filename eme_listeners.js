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
 * @fileoverview Adds listeners to EME elements.
 */

console.info('eme_logger.js loaded.');
console.info('Some identifiable information may be in the log. Be careful ' +
    'about posting the log on bug reports.');


/** Set up the EME listeners. */
function setUp_() {
  var listener = new EmeListeners();
  listener.setUpListeners();
}


/**
 * Manager for EME event and method listeners.
 * @constructor
 */
function EmeListeners() {
  this.unprefixedEmeEnabled =
      Navigator.prototype.requestMediaKeySystemAccess ? true : false;
  this.prefixedEmeEnabled =
      HTMLMediaElement.prototype.webkitGenerateKeyRequest ? true : false;
}


/**
 * The number of types of HTML Media Elements to track.
 * @const {number}
 */
EmeListeners.NUM_MEDIA_ELEMENT_TYPES = 3;


/**
 * Sets up EME listeners for whichever type of EME is enabled.
 */
EmeListeners.prototype.setUpListeners = function() {
  if (!this.unprefixedEmeEnabled && !this.prefixedEmeEnabled) {
    console.log('EME not available.');
    return;
  }
  if (this.unprefixedEmeEnabled) {
    console.log('Unprefixed EME is enabled.');
    this.addListenersToNavigator_();
  }
  if (this.prefixedEmeEnabled) {
    console.log('Prefixed EME is enabled.');
  }
  this.addListenersToAllEmeElements_();
};


/**
 * Adds listeners to the EME methods on the Navigator object.
 * @private
 */
EmeListeners.prototype.addListenersToNavigator_ = function() {
  if (navigator.listenersAdded_) {
    return;
  }
  var originalRequestMediaKeySystemAccessFn = EmeListeners.extendEmeMethod(
      navigator,
      navigator.requestMediaKeySystemAccess,
      emeLogger.RequestMediaKeySystemAccessCall);
  navigator.requestMediaKeySystemAccess = function() {
    var result = originalRequestMediaKeySystemAccessFn.apply(null, arguments);
    // Attach listeners to returned MediaKeySystemAccess object
    return result.then(function(mediaKeySystemAccess) {
      this.addListenersToMediaKeySystemAccess_(mediaKeySystemAccess);
      return Promise.resolve(mediaKeySystemAccess);
    }.bind(this));
  }.bind(this);

  navigator.listenersAdded_ = true;
};


/**
 * Adds listeners to the EME methods on a MediaKeySystemAccess object.
 * @param {MediaKeySystemAccess} mediaKeySystemAccess A MediaKeySystemAccess
 *     object to add listeners to.
 * @private
 */
EmeListeners.prototype.addListenersToMediaKeySystemAccess_ =
    function(mediaKeySystemAccess) {
  if (mediaKeySystemAccess.listenersAdded_) {
    return;
  }
  mediaKeySystemAccess.originalGetConfiguration =
      mediaKeySystemAccess.getConfiguration;
  mediaKeySystemAccess.getConfiguration = EmeListeners.extendEmeMethod(
      mediaKeySystemAccess,
      mediaKeySystemAccess.getConfiguration,
      emeLogger.GetConfigurationCall);

  var originalCreateMediaKeysFn = EmeListeners.extendEmeMethod(
      mediaKeySystemAccess,
      mediaKeySystemAccess.createMediaKeys,
      emeLogger.CreateMediaKeysCall);
  mediaKeySystemAccess.createMediaKeys = function() {
    var result = originalCreateMediaKeysFn.apply(null, arguments);
    // Attach listeners to returned MediaKeys object
    return result.then(function(mediaKeys) {
      mediaKeys.keySystem_ = mediaKeySystemAccess.keySystem;
      this.addListenersToMediaKeys_(mediaKeys);
      return Promise.resolve(mediaKeys);
    }.bind(this));
  }.bind(this);

  mediaKeySystemAccess.listenersAdded_ = true;
};


/**
 * Adds listeners to the EME methods on a MediaKeys object.
 * @param {MediaKeys} mediaKeys A MediaKeys object to add listeners to.
 * @private
 */
EmeListeners.prototype.addListenersToMediaKeys_ = function(mediaKeys) {
  if (mediaKeys.listenersAdded_) {
    return;
  }
  var originalCreateSessionFn = EmeListeners.extendEmeMethod(
      mediaKeys, mediaKeys.createSession, emeLogger.CreateSessionCall);
  mediaKeys.createSession = function() {
    var result = originalCreateSessionFn.apply(null, arguments);
    result.keySystem_ = mediaKeys.keySystem_;
    // Attach listeners to returned MediaKeySession object
    this.addListenersToMediaKeySession_(result);
    return result;
  }.bind(this);

  mediaKeys.setServerCertificate = EmeListeners.extendEmeMethod(
      mediaKeys,
      mediaKeys.setServerCertificate,
      emeLogger.SetServerCertificateCall);
  mediaKeys.listenersAdded_ = true;
};


/** Adds listeners to the EME methods and events on a MediaKeySession object.
 * @param {MediaKeySession} session A MediaKeySession object to add
 *     listeners to.
 * @private
 */
EmeListeners.prototype.addListenersToMediaKeySession_ = function(session) {
  if (session.listenersAdded_) {
    return;
  }
  session.generateRequest = EmeListeners.extendEmeMethod(
      session,
      session.generateRequest,
      emeLogger.GenerateRequestCall);

  session.load = EmeListeners.extendEmeMethod(
      session, session.load, emeLogger.LoadCall);

  session.update = EmeListeners.extendEmeMethod(
      session,
      session.update,
      emeLogger.UpdateCall);

  session.close = EmeListeners.extendEmeMethod(
      session, session.close, emeLogger.CloseCall);

  session.remove = EmeListeners.extendEmeMethod(
      session, session.remove, emeLogger.RemoveCall);

  session.addEventListener('message', function(e) {
    e.keySystem = session.keySystem_;
    EmeListeners.logEvent(emeLogger.MessageEvent, e);
  });

  session.addEventListener('keystatuseschange',
      EmeListeners.logEvent.bind(null, emeLogger.KeyStatusesChangeEvent));

  session.listenersAdded_ = true;
};


/**
 * Adds listeners to all currently created media elements and sets up a
 * mutation-summary observer to add listeners to any newly created media
 * elements.
 * @private
 */
EmeListeners.prototype.addListenersToAllEmeElements_ = function() {
  this.addEmeListenersToInitialMediaElements_();
  var observer = new MutationSummary({
    callback: function(summaries) {
      applyListeners(summaries);
    },
    queries: [{element: 'video'}, {element: 'audio'}, {element: 'media'}]
  });

  var applyListeners = function(summaries) {
    for (var i = 0; i < EmeListeners.NUM_MEDIA_ELEMENT_TYPES; i++) {
      var elements = summaries[i];
      elements.added.forEach(function(element) {
        this.addListenersToEmeElement_(element, true);
      }.bind(this));
    }
  }.bind(this);
};


/**
 * Adds listeners to the EME elements currently in the document.
 * @private
 */
EmeListeners.prototype.addEmeListenersToInitialMediaElements_ = function() {
  var audioElements = document.getElementsByTagName('audio');
  for (var i = 0; i < audioElements.length; ++i) {
    this.addListenersToEmeElement_(audioElements[i], false);
  }
  var videoElements = document.getElementsByTagName('video');
  for (var i = 0; i < videoElements.length; ++i) {
    this.addListenersToEmeElement_(videoElements[i], false);
  }
  var mediaElements = document.getElementsByTagName('media');
  for (var i = 0; i < mediaElements.length; ++i) {
    this.addListenersToEmeElement_(mediaElements[i], false);
  }
};


/**
 * Adds method and event listeners to media element.
 * @param {HTMLMediaElement} element A HTMLMedia element to add listeners to.
 * @private
 */
EmeListeners.prototype.addListenersToEmeElement_ = function(element) {
  this.addEmeEventListeners_(element);
  this.addEmeMethodListeners_(element);
  console.info('EME listeners successfully added to:', element);
};


/**
 * Adds event listeners to a media element.
 * @param {HTMLMediaElement} element A HTMLMedia element to add listeners to.
 * @private
 */
EmeListeners.prototype.addEmeEventListeners_ = function(element) {
  if (element.eventListenersAdded_) {
    return;
  }
  if (this.prefixedEmeEnabled) {
    element.addEventListener('webkitneedkey',
        EmeListeners.logEvent.bind(null, emeLogger.NeedKeyEvent));

    element.addEventListener('webkitkeymessage',
        EmeListeners.logEvent.bind(null, emeLogger.KeyMessageEvent));

    element.addEventListener('webkitkeyadded',
        EmeListeners.logEvent.bind(null, emeLogger.KeyAddedEvent));

    element.addEventListener('webkitkeyerror',
        EmeListeners.logEvent.bind(null, emeLogger.KeyErrorEvent));
  }

  element.addEventListener('encrypted',
      EmeListeners.logEvent.bind(null, emeLogger.EncryptedEvent));

  element.addEventListener('play',
      EmeListeners.logEvent.bind(null, emeLogger.PlayEvent));

  element.addEventListener('error', function(e) {
    console.error('Error Event');
    EmeListeners.logEvent(emeLogger.ErrorEvent, e);
  });

  element.eventListenersAdded_ = true;
};


/**
 * Adds method listeners to a media element.
 * @param {HTMLMediaElement} element A HTMLMedia element to add listeners to.
 * @private
 */
EmeListeners.prototype.addEmeMethodListeners_ = function(element) {
  if (element.methodListenersAdded_) {
    return;
  }
  element.play = EmeListeners.extendEmeMethod(
      element, element.play, emeLogger.PlayCall);

  if (this.prefixedEmeEnabled) {
    element.canPlayType = EmeListeners.extendEmeMethod(
        element, element.canPlayType, emeLogger.CanPlayTypeCall);

    element.webkitGenerateKeyRequest = EmeListeners.extendEmeMethod(
        element,
        element.webkitGenerateKeyRequest,
        emeLogger.GenerateKeyRequestCall);

    element.webkitAddKey = EmeListeners.extendEmeMethod(
        element,
        element.webkitAddKey,
        emeLogger.AddKeyCall);

    element.webkitCancelKeyRequest = EmeListeners.extendEmeMethod(
        element,
        element.webkitCancelKeyRequest,
        emeLogger.CancelKeyRequestCall);

  }

  if (this.unprefixedEmeEnabled) {
    element.setMediaKeys = EmeListeners.extendEmeMethod(
        element, element.setMediaKeys, emeLogger.SetMediaKeysCall);
  }

  element.methodListenersAdded_ = true;
};


/**
 * Creates a wrapper function that logs calls to the given method.
 * @param {!Object} element An element or object whose function
 *    call will be logged.
 * @param {!Function} originalFn The function to log.
 * @param {!Function} constructor The constructor for a logger class that will
 *    be instantiated to log the originalFn call.
 * @return {!Function} The new version, with logging, of orginalFn.
 */
EmeListeners.extendEmeMethod = function(element, originalFn, constructor) {
  return function() {
    var result = originalFn.apply(element, arguments);
    var args = [].slice.call(arguments);
    var logObject = EmeListeners.logCall(constructor, args, result, element);
    if (result && result.constructor.name == 'Promise') {
      var description = logObject.title + ' Promise Result';
      result = result.then(function(resultObject) {
        EmeListeners.logPromiseResult(description, 'resolved', resultObject, args);
        return Promise.resolve(resultObject);
      }).catch(function(error) {
        EmeListeners.logPromiseResult(description, 'rejected', error, args);
        return Promise.reject(error);
      });
    }
    return result;
  };
};


/**
 * Logs a method call to the console and a separate frame.
 * @param {!Function} constructor The constructor for a logger class that will
 *    be instantiated to log this call.
 * @param {Array} args The arguments this call was made with.
 * @param {Object} result The result of this method call.
 * @param {!Object} target The element this method was called on.
 * @return {!emeLogger.EmeMethodCall} The data that has been logged.
 */
EmeListeners.logCall = function(constructor, args, result, target) {
  var logObject = new constructor(args, target, result);
  EmeListeners.logAndPostMessage_(logObject);
  return logObject;
};


/**
 * Logs an event to the console and a separate frame.
 * @param {!Function} constructor The constructor for a logger class that will
 *    be instantiated to log this event.
 * @param {!Event} event An EME event.
 * @return {!emeLogger.EmeEvent} The data that has been logged.
 */
EmeListeners.logEvent = function(constructor, event) {
  var logObject = new constructor(event);
  EmeListeners.logAndPostMessage_(logObject);
  return logObject;
};


/**
 * Logs the result of a Promise to the console and a separate frame.
 * @param {string} title A short description of this Promise.
 * @param {string} status The status of this Promise.
 * @param {Object} result The result of this Promise.
 * @param {Array} args The arguments that were passed.
 * @return {!emeLogger.PromiseResult} The data that has been logged.
 */
EmeListeners.logPromiseResult = function(title, status, result, args) {
  var logObject = new emeLogger.PromiseResult(title, status, result, args);
  EmeListeners.logAndPostMessage_(logObject);
  return logObject;
};


/**
 * Logs the object to the console and posts it in a message.
 * @param {emeLogger.EmeEvent|emeLogger.EmeMethodCall|emeLogger.PromiseResult}
 *    logObject The object to log.
 * @private
 */
EmeListeners.logAndPostMessage_ = function(logObject) {
  var message = emeLogger.getMessagePassableObject(logObject);
  window.postMessage({data: message, type: 'emeLogMessage'}, '*');
  console.log(logObject);
};

setUp_();
