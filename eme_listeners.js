/**
 * @fileoverview Adds listeners to EME elements.
 */

console.info('eme_logger.js loaded.');


/** After content is loaded, set up the EME listeners. */
function onDOMContentLoaded_() {
  var listener = new EmeListeners();
  listener.setUpListeners();
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded_);


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
  if (this.unprefixedEmeEnabled) {
    console.log('Unprefixed EME is enabled.');
    this.addListenersToNavigator_();
    this.addListenersToAllEmeElements_();
  } else if (this.prefixedEmeEnabled) {
    console.log('Prefixed EME is enabled.');
    this.addListenersToAllEmeElements_();
  } else {
    console.log('EME not available.');
  }
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
      'RequestMediaKeySystemAccessCall',
      ['keySystem', 'supportedConfigurations']);
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
  mediaKeySystemAccess.getConfiguration = EmeListeners.extendEmeMethod(
      mediaKeySystemAccess,
      mediaKeySystemAccess.getConfiguration,
      'GetConfigurationCall',
      []);

  var originalCreateMediaKeysFn = EmeListeners.extendEmeMethod(
      mediaKeySystemAccess,
      mediaKeySystemAccess.createMediaKeys,
      'CreateMediaKeysCall',
      []);
  mediaKeySystemAccess.createMediaKeys = function() {
    var result = originalCreateMediaKeysFn.apply(null, arguments);
    // Attach listeners to returned MediaKeys object
    return result.then(function(mediaKeys) {
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
      mediaKeys, mediaKeys.createSession, 'CreateSessionCall', ['sessionType']);
  mediaKeys.createSession = function() {
    var result = originalCreateSessionFn.apply(null, arguments);
    // Attach listeners to returned MediaKeySession object
    this.addListenersToMediaKeySession_(result);
    return result;
  }.bind(this);

  mediaKeys.setServerCertificate = EmeListeners.extendEmeMethod(
      mediaKeys,
      mediaKeys.setServerCertificate,
      'SetServerCertificateCall',
      ['serverCertificate']);
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
      'GenerateRequestCall',
      ['initDataType', 'initData']);

  session.load = EmeListeners.extendEmeMethod(
      session, session.load, 'LoadCall', ['sessionId']);

  session.update = EmeListeners.extendEmeMethod(
        session, session.update, 'UpdateCall', ['response']);

  session.close = EmeListeners.extendEmeMethod(
      session, session.close, 'CloseCall', []);

  session.remove = EmeListeners.extendEmeMethod(
      session, session.remove, 'RemoveCall', []);

  session.addEventListener('message', EmeListeners.logEvent);

  session.addEventListener('keystatuseschange', EmeListeners.logEvent);

  session.listenersAdded_ = true;
};


// TODO(natalieharris): Provide an option to enable tracking from
// document.createElement with warning that it will break sites using NodeBind
// and Polymer
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
    for (var i = 0; i < this.NUM_MEDIA_ELEMENT_TYPES; i++) {
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
  if (audioElements.length + videoElements.length + mediaElements.length == 0) {
    console.warn('No media elements found in document.');
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
    element.addEventListener('webkitneedkey', EmeListeners.logEvent);

    element.addEventListener('webkitkeymessage', EmeListeners.logEvent);

    element.addEventListener('webkitkeyadded', EmeListeners.logEvent);

    element.addEventListener('webkitkeyerror', EmeListeners.logEvent);
  }

  element.addEventListener('encrypted', EmeListeners.logEvent);

  element.addEventListener('play', EmeListeners.logEvent);

  element.addEventListener('error', function(e) {
    console.error('Error Event');
    EmeListeners.logEvent(e);
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
    element, element.play, 'PlayCall', []);

  if (this.prefixedEmeEnabled) {
    element.canPlayType = EmeListeners.extendEmeMethod(
      element, element.canPlayType, 'CanPlayTypeCall', ['type', 'keySystem']);

    element.webkitGenerateKeyRequest = EmeListeners.extendEmeMethod(
        element,
        element.webkitGenerateKeyRequest,
        'GenerateKeyRequestCall',
        ['keySystem', 'initData']);

    element.webkitAddKey = EmeListeners.extendEmeMethod(
        element,
        element.webkitAddKey,
        'AddKeyCall',
        ['keySystem', 'key', 'initData', 'sessionId']);

    element.webkitCancelKeyRequest = EmeListeners.extendEmeMethod(
        element,
        element.webkitCancelKeyRequest,
        'CancelKeyRequestCall',
        ['keySystem', 'sessionId']);

  } else if (this.unprefixedEmeEnabled) {
    element.setMediaKeys = EmeListeners.extendEmeMethod(
      element, element.setMediaKeys, 'SetMediaKeysCall', ['MediaKeys']);
  }

  element.methodListenersAdded_ = true;
};


/**
 * Creates a wrapper function that logs calls to the given method.
 * @param {Object} element An element or object whose function
 *    will be extended.
 * @param {Function} originalFn The function to add logging to.
 * @param {string} title The title used to refer to this function.
 * @param {Array.<string>} argumentLabels An array of labels used to identify
 *    each of this functions arguments.
 * @return {Function} The extended version of orginalFn.
 */
EmeListeners.extendEmeMethod = function(element,
                                        originalFn,
                                        title,
                                        argumentLabels) {
  return function() {
    var result = originalFn.apply(element, arguments);
    EmeListeners.logCall(
      title, [].slice.call(arguments), argumentLabels, result, element);
    if (result.constructor.name == 'Promise') {
      var description = title + ' Promise Result';
      result = result.then(function(resultObject) {
        EmeListeners.logPromiseResult(description, 'resolved', resultObject);
        return Promise.resolve(resultObject);
      }).catch(function(error) {
        EmeListeners.logPromiseResult(description, 'rejected', error);
        return Promise.reject(error);
      });
    }
    return result;
  };
};


// TODO(natalieharris): Add option of logging to a file.
/**
 * Logs a method call to the console and a separate frame.
 * @param {string} name The name of the method.
 * @param {Array} args The arguments this call was made with.
 * @param {Array.<string>} labels A list of the types of arguments. Should
 *    correspond in length to |args| and be in same order as |args|. If |labels|
 *    is longer than |args| extra labels will be ignored.
 * @param {Object} result The result of this method call.
 * @param {Object} target The element this method was called on.
 */
EmeListeners.logCall = function(name, args, labels, result, target) {
  var logOutput = new emePrototypes.EmeMethodCall(
      name, args, labels, result, target);
  window.postMessage({data:
                      JSON.parse(JSON.stringify(logOutput.getMessageObject())),
                      type: 'emeLogMessage'}, '*');
  console.log(logOutput);
};


/**
 * Logs an event to the console and a separate frame.
 * @param {Event} event An EME event.
 */
EmeListeners.logEvent = function(event) {
  var logOutput = new emePrototypes.EmeEvent(event);
  window.postMessage({data:
                      JSON.parse(JSON.stringify(logOutput.getMessageObject())),
                      type: 'emeLogMessage'}, '*');
  console.log(logOutput);
};


/**
 * Logs the result of a Promise to the console and a separate frame.
 * @param {string} description A short description of this Promise.
 * @param {string} status The status of this Promise.
 * @param {Object} result The result of this Promise.
 */
EmeListeners.logPromiseResult = function(description, status, result) {
  var logOutput = new emePrototypes.PromiseResult(description, status, result);
  window.postMessage({data:
                      JSON.parse(JSON.stringify(logOutput.getMessageObject())),
                      type: 'emeLogMessage'}, '*');
  console.log(logOutput);
};
