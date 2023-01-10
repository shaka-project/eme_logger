/**
 * Copyright 2022 Google LLC.
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
 * @fileoverview Shim and trace calls to EME, and log them to the extension's
 * log window.
 */

/**
 * A custom logger to plug into TraceAnything.
 *
 * @param {TraceAnything.Log} log
 */
function emeLogger(log) {
  // Hook into the EME formatter interface for update calls and message events.
  if (log.type == TraceAnything.LogTypes.Method &&
      log.className == 'MediaKeySession' &&
      log.methodName == 'update' &&
      log.args.length >= 1) {
    log.args[0] = EmeLogHelper.formatEmeResponse(log.args[0]);
  } else if (log.type == TraceAnything.LogTypes.Event &&
      log.className == 'MediaKeySession' &&
      log.eventName == 'message') {
    // You can't (and shouldn't, to avoid breaking the app) modify the event
    // object here.  So clone it, and replace the message field of that.
    log.event = EmeLogHelper.cloneEvent(log.event, {
      // This overrides the message field with a new value from the formatter.
      message : EmeLogHelper.formatEmeRequest(log.event.message),
    });
  } else if (log.type == TraceAnything.LogTypes.Method &&
      log.className == 'MediaKeys' &&
      log.methodName == 'setServerCertificate' &&
      log.args.length >= 1) {
    log.args[0] = EmeLogHelper.formatEmeCertificate(log.args[0]);
  } else if (log.type == TraceAnything.LogTypes.Method &&
      log.className == 'MediaKeySession' &&
      log.methodName == 'generateRequest' &&
      log.args.length >= 2) {
    log.args[1] = EmeLogHelper.formatEmeInitData(log.args[0], log.args[1]);
  }

  // Log to the default logger in the JS console.
  TraceAnything.defaultLogger(log);

  // This is not needed and can't be easily serialized.
  delete log.instance;

  window.postMessage(
      {type : 'emeTraceLog', log : EmeLogHelper.prepLogForMessage(log)}, '*');
}

// Define functions in a single object to avoid polluting the global namespace.
const EmeLogHelper = {

  /**
   * Clone an event.  The clone will have the same type and values, except for
   * the values overridden by the overrides parameter.
   *
   * The spread operator and Object.assign can only read "own" properties of an
   * object, so this custom cloning method must be used for Events instead.
   *
   * @param {!Event} original
   * @param {Object=} overrides
   * @return {!Event}
   */
  cloneEvent : function(original, overrides) {
    const clone = {};

    // When reading the original, we must use a for-in loop to see all fields.
    // Static fields from Event and methods are skipped, but everything else is
    // copied into a plain object.
    for (const key in original) {
      if (!(key in Event) && (typeof original[key] != 'function')) {
        clone[key] = original[key];
      }
    }

    // Overrides are applied all at once using Object.assign.
    if (overrides) {
      Object.assign(clone, overrides);
    }

    // Setting the prototype of the clone gives the clone the same type as the
    // original.
    Object.setPrototypeOf(clone, original.constructor.prototype);

    return clone;
  },

  /**
   * @param {BufferSource} response
   * @return {(string|!Object|BufferSource)}
   */
  formatEmeResponse : function(response) {
    if (!response || !document.emeFormatters) {
      return response;
    }

    for (const formatter of document.emeFormatters) {
      try {
        let formattedResponse;

        if (formatter.formatResponse) { // v3 API
          formattedResponse = formatter.formatResponse(response);
        } else if (formatter.formatUpdateCall) { // v2 API
          formattedResponse = formatter.formatUpdateCall(response);
        }

        if (formattedResponse) {
          return formattedResponse;
        }
      } catch (exception) {
      } // Ignore, move on to the next formatter.
    }

    // Return the original response, which will be formatted as bytes.
    return response;
  },

  /**
   * @param {BufferSource} request
   * @return {(string|!Object|BufferSource)}
   */
  formatEmeRequest : function(request) {
    if (!request || !document.emeFormatters) {
      return request;
    }

    for (const formatter of document.emeFormatters) {
      try {
        let formattedRequest;

        if (formatter.formatRequest) { // v3 API
          formattedRequest = formatter.formatRequest(request);
        } else if (formatter.formatmessage) { // v2 API
          formattedRequest = formatter.formatmessage(request);
        }

        if (formattedRequest) {
          return formattedRequest;
        }
      } catch (exception) {
      } // Ignore, move on to the next formatter.
    }

    // Return the original request, which will be formatted as bytes.
    return request;
  },

  /**
   * @param {BufferSource} certificate
   * @return {(string|!Object|BufferSource)}
   */
  formatEmeCertificate : function(certificate) {
    if (!certificate || !document.emeFormatters) {
      return certificate;
    }

    for (const formatter of document.emeFormatters) {
      try {
        let formattedCertificate;

        if (formatter.formatServerCertificate) { // v3 API
          formattedCertificate = formatter.formatServerCertificate(certificate);
        }

        if (formattedCertificate) {
          return formattedCertificate;
        }
      } catch (exception) {
      } // Ignore, move on to the next formatter.
    }

    // Return the original certificate, which will be formatted as bytes.
    return certificate;
  },

  /**
   * @param {string} initDataType
   * @param {BufferSource} initData
   * @return {(string|!Object|BufferSource)}
   */
  formatEmeInitData : function(initDataType, initData) {
    if (!initData || !document.emeFormatters) {
      return initData;
    }

    for (const formatter of document.emeFormatters) {
      try {
        let formattedInitData;

        if (formatter.formatInitData) { // v3 API
          formattedInitData = formatter.formatInitData(initDataType, initData);
        }

        if (formattedInitData) {
          return formattedInitData;
        }
      } catch (exception) {
      } // Ignore, move on to the next formatter.
    }

    // Return the original init data, which will be formatted as bytes.
    return initData;
  },

  /**
   * @param {Object} log
   * @return {Object}
   */
  prepLogForMessage : function(log) {
    const clone = {};
    for (const k in log) {
      clone[k] = EmeLogHelper.getSerializable(log[k]);
    }
    return clone;
  },

  /**
   * @param {*} obj A value that may or may not be serializable.
   * @return {*} A value that can be serialized.
   */
  getSerializable : function(obj) {
    // Return primitive types directly.
    if (obj == null || typeof obj == 'string' || typeof obj == 'number' ||
        typeof obj == 'boolean') {
      return obj;
    }

    // Events are full of garbage, so only serialize the interesting fields.
    if (obj instanceof Event) {
      const clone = {};
      for (const k in obj) {
        // Skip fields that are in the Event base class, as well as "isTrusted".
        // These are not interesting for logging.
        if (!(k in Event.prototype) && k != 'isTrusted') {
          clone[k] = EmeLogHelper.getSerializable(obj[k]);
        }
      }
      return {
        __type__ : obj.type + ' Event',
        __fields__ : clone,
      };
    }

    // Elements, Nodes, and Windows are dangerous to serialize because they
    // contain many fields and circular references.
    if (obj instanceof Element) {
      return {
        __type__ : '<' + obj.tagName.toLowerCase() + '> element',
      };
    }
    if (obj instanceof Node) {
      return {
        __type__ : obj.nodeName.toLowerCase() + ' node',
      };
    }
    if (obj instanceof Window) {
      return {
        __type__ : 'Window',
      };
    }

    // Convert array buffers into views.
    // Format views into an object that can be serialized and logged.
    if (obj instanceof ArrayBuffer) {
      obj = new Uint8Array(obj);
    }
    if (ArrayBuffer.isView(obj)) {
      return {
        __type__ : obj.constructor.name,
        __data__ : Array.from(obj),
      };
    }

    // Get all key statuses and serialize them.
    if (obj instanceof MediaKeyStatusMap) {
      const statuses = {};
      obj.forEach((status, arrayBuffer) => {
        const keyId =
            EmeLogHelper.uint8ArrayToHexString(new Uint8Array(arrayBuffer));
        statuses[keyId] = status;
      });
      return { __type__: obj.constructor.name, __fields__: statuses, }
    }

    // DOMExceptions don't serialize right if done generically.  None of their
    // properties are their "own".  This follows the same format used below for
    // serializing other typed objects.
    if (obj instanceof DOMException) {
      return {
        __type__ : 'DOMException',
        __fields__ : {
          name : obj.name,
          code : obj.code,
          message : obj.message,
        },
      };
    }

    // For readability, Date objects are best serialized as strings.
    // This will use the browser's timezone to interpret the the date/time.
    if (obj instanceof Date) {
      return obj.toString();
    }

    if (obj instanceof TimeRanges) {
      const clone = [];
      for (let i = 0; i < obj.length; i++) {
        clone[i] = [ obj.start(i), obj.end(i) ];
      }
      return clone;
    }

    // Clone the elements of an array into serializable versions.
    if (Array.isArray(obj)) {
      const clone = [];
      for (const k in obj) {
        if (typeof obj[k] == 'function') {
          clone[k] = {__type__ : 'function'};
        } else {
          clone[k] = EmeLogHelper.getSerializable(obj[k]);
        }
      }
      return clone;
    }

    // Clone the fields of an object into serializable versions.
    const clone = {};
    for (const k in obj) {
      if (k.startsWith('__TraceAnything') || typeof obj[k] == 'function') {
        continue;
      }

      // 'keystatuseschange.expiration' is returned as a ECMAScript Time Value,
      // so convert it into a Date if specified for better readability.
      if (k == 'expiration' && !isNaN(obj[k])) {
        clone[k] = EmeLogHelper.getSerializable(new Date(obj[k]));
        continue;
      }

      clone[k] = EmeLogHelper.getSerializable(obj[k]);
    }
    // Make sure generated IDs get logged.  Do this through a synthetic field.
    if ('__TraceAnythingId__' in obj && !('id' in clone)) {
      clone.autoId = obj.__TraceAnythingId__;
    }
    if (obj.constructor != Object) {
      // If it's an object with a type, send that info, too.
      return {
        __type__ : obj.constructor.name,
        __fields__ : clone,
      };
    }
    return clone;
  },

  byteToHexString : function(
      byte) { return byte.toString(16).padStart(2, '0'); },

  uint8ArrayToHexString : function(view) {
    return Array.from(view).map(EmeLogHelper.byteToHexString).join('');
  }
};

(() => {
  // General options for TraceAnything.
  const options = {
    // When formatting logs and sending them as serialized messages, we need to
    // wait for async results to be resolved before we log them.
    logAsyncResultsImmediately : false,

    // Our custom logger.  Using an arrow function makes it possible to spy on
    // emeLogger in our tests without breaking this connection.
    logger : (log) => emeLogger(log),

    // Don't bother logging event listener methods.  It's not useful.
    // We can still log events, though.
    skipProperties : [
      'addEventListener',
      'removeEventListener',
    ],
  };

  function combineOptions(baseOptions, overrideOptions) {
    return Object.assign({}, baseOptions, overrideOptions);
  }

  // These will be shimmed in place.
  TraceAnything.traceMember(navigator, 'requestMediaKeySystemAccess', options);
  TraceAnything.traceMember(
      navigator.mediaCapabilities, 'decodingInfo', combineOptions(options, {
        // The result from decodingInfo is a plain object.  We need to dive into
        // this field in particular to find MediaKeySystemAccess instances to
        // trace.
        exploreResultFields : [ 'keySystemAccess' ],
      }));

  // These constructors are not used directly, but this registers them to the
  // tracing system so that instances we find later will be shimmed.
  TraceAnything.traceClass(MediaKeys, options);
  TraceAnything.traceClass(MediaKeySystemAccess, options);
  TraceAnything.traceClass(
      MediaKeySession, combineOptions(options, {
        idProperty : 'sessionId',

        skipProperties : options.skipProperties.concat([
          // Also skip logging certain noisy properties on MediaKeySession.
          // They are logged with keystatuschange event.
          'expiration',
          'keyStatuses',

          // This is still logged in the representation of the session, but we
          // don't need to log access to the property's getter.
          'sessionId',
        ]),

        eventProperties : {
          'keystatuseschange' : [ 'expiration', 'keyStatuses' ],
        },
      }));

  // Trace media element types, and monitor the document for new instances.
  const playbackStateProperties = [
    'currentTime',
    'paused',
    'ended',
    'played',
    'buffered',
    'getVideoPlaybackQuality',
  ];
  const elementOptions = combineOptions(options, {
    // Skip all property access on media elements.
    // It's a little noisy and unhelpful (currentTime getter, for example).
    properties : false,

    // And these specific events are VERY noisy.  Skip them.
    skipEvents : [
      'progress',
      'timeupdate',
    ],

    // Methods we don't care about on media elements:
    skipProperties : options.skipProperties.concat([
      'getAttribute',
      'getBoundingClientRect',
      'querySelector',
      'querySelectorAll',
      'getVideoPlaybackQuality',
    ]),

    eventProperties : {
      'ratechange' : 'playbackRate',
      'resize' : 'getBoundingClientRect',
      'play' : playbackStateProperties,
      'playing' : playbackStateProperties,
      'pause' : playbackStateProperties,
      'ended' : playbackStateProperties,
      'durationchange' : playbackStateProperties,
      'waiting' : playbackStateProperties,
      'loadedmetadata' : playbackStateProperties,
      'loadeddata' : playbackStateProperties,
      'canplay' : playbackStateProperties,
      'canplaythrough' : playbackStateProperties,
    },
  });
  TraceAnything.traceElement('video', elementOptions);
  TraceAnything.traceElement('audio', elementOptions);
})();
