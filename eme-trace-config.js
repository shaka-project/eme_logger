/**
 * Copyright 2021 Google Inc.
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
    log.args[0] = formatEmeLicense(log.args[0]);
  } else if (log.type == TraceAnything.LogTypes.Event &&
      log.className == 'MediaKeySession' &&
      log.eventName == 'message') {
    // You can't (and shouldn't, to avoid breaking the app) modify the event
    // object here.  So clone it, and replace the message field of that.
    log.event = {
      // The spread operator reads the fields and values (shallow clone) of the
      // object named here.
      ...log.event,
      // This overrides on of those fields with a new value.
      message: formatEmeMessage(log.event.message),
    };
  }

  // Log to the default logger in the JS console.
  TraceAnything.defaultLogger(log);

  // TODO: Discuss instances and properties with xhwang before finalizing

  // This is not needed and can't be easily serialized.
  delete log.instance;

  window.postMessage({type: 'emeTraceLog', log: prepLogForMessage(log)}, '*');
}

/**
 * @param {BufferSource} license
 * @return {(string|BufferSource)}
 */
function formatEmeLicense(license) {
  if (!license || !document.emeFormatters) {
    return license;
  }

  for (const formatter of document.emeFormatters) {
    try {
      const licenseText = formatter.formatUpdateCall(license);
      if (licenseText) {
        return licenseText;
      }
    } catch (exception) {}  // Ignore, move on to the next formatter.
  }

  // Return the original license, which will be formatted as bytes.
  return license;
}

/**
 * @param {BufferSource} message
 * @return {(string|BufferSource)}
 */
function formatEmeMessage(message) {
  if (!document.emeFormatters) {
    return message;
  }

  for (const formatter of document.emeFormatters) {
    try {
      const messageText = formatter.formatmessage(message);
      if (messageText) {
        return messageText;
      }
    } catch (exception) {}  // Ignore, move on to the next formatter.
  }

  // Return the original message, which will be formatted as bytes.
  return message;
}

/**
 * @param {Object} log
 * @return {Object}
 */
function prepLogForMessage(log) {
  const clone = {};
  for (const k in log) {
    clone[k] = getSerializable(log[k]);
  }
  return clone;
}

/**
 * @param {*} obj A value that may or may not be serializable.
 * @return {*} A value that can be serialized.
 */
function getSerializable(obj) {
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
        clone[k] = getSerializable(obj[k]);
      }
    }
    return {
      __type__: obj.type + ' Event',
      __fields__: clone,
    };
  }

  // Elements, Nodes, and Windows are dangerous to serialize because they
  // contain many fields and circular references.
  if (obj instanceof Element) {
    return {
      __type__: '<' + obj.tagName.toLowerCase() + '> element',
    };
  }
  if (obj instanceof Node) {
    return {
      __type__: obj.nodeName.toLowerCase() + ' node',
    };
  }
  if (obj instanceof Window) {
    return {
      __type__: 'Window',
    };
  }

  // Convert array buffers into views.
  // Format views into an object that can be serialized and logged.
  if (obj instanceof ArrayBuffer) {
    obj = new Uint8Array(obj);
  }
  if (ArrayBuffer.isView(obj)) {
    return {
      __type__: obj.constructor.name,
      __data__: Array.from(obj),
    };
  }

  // Get all key statuses and serialize them.
  if (obj instanceof MediaKeyStatusMap) {
    const statuses = {};
    obj.forEach((status, arrayBuffer) => {
      const keyId = uint8ArrayToHexString(new Uint8Array(arrayBuffer));
      statuses[keyId] = status;
    });
    return {
      __type__: obj.constructor.name,
      __fields__: statuses,
    }
  }

  // DOMExceptions don't serialize right if done generically.  None of their
  // properties are their "own".  This follows the same format used below for
  // serializing other typed objects.
  if (obj instanceof DOMException) {
    return {
      __type__: 'DOMException',
      __fields__: {
        name: obj.name,
        code: obj.code,
        message: obj.message,
      },
    };
  }

  // Clone the elements of an array into serializable versions.
  if (Array.isArray(obj)) {
    const clone = [];
    for (const k in obj) {
      if (typeof obj[k] == 'function') {
        clone[k] = {__type__: 'function'};
      } else {
        clone[k] = getSerializable(obj[k]);
      }
    }
    return clone;
  }

  // Clone the fields of an object into serializable versions.
  const clone = {};
  for (const k in obj) {
    if (k == '__TraceAnything__' || typeof obj[k] == 'function') {
      continue;
    }
    clone[k] = getSerializable(obj[k]);
  }
  if (obj.constructor != Object) {
    // If it's an object with a type, send that info, too.
    return {
      __type__: obj.constructor.name,
      __fields__: clone,
    };
  }
  return clone;
}

function byteToHexString(byte) {
  return byte.toString(16).padStart(2, '0');
}

function uint8ArrayToHexString(view) {
  return Array.from(view).map(byteToHexString).join('');
}

function combineOptions(baseOptions, overrideOptions) {
  return Object.assign({}, baseOptions, overrideOptions);
}

// General options for TraceAnything.
const options = {
  // When formatting logs and sending them as serialized messages, we need to
  // wait for async results to be resolved before we log them.
  logAsyncResultsImmediately: false,

  // Our custom logger.  Using an arrow function makes it possible to spy on
  // emeLogger in our tests without breaking this connection.
  logger: (log) => emeLogger(log),

  // Don't bother logging event listener methods.  It's not useful.
  // We can still log events, though.
  skipProperties: [
    'addEventListener',
    'removeEventListener',
  ],
};

// These will be shimmed in place.
TraceAnything.traceMember(navigator, 'requestMediaKeySystemAccess', options);
TraceAnything.traceMember(
    navigator.mediaCapabilities, 'decodingInfo', combineOptions(options, {
  // The result from decodingInfo is a plain object.  We need to dive into
  // this field in particular to find MediaKeySystemAccess instances to
  // trace.
  exploreResultFields: ['keySystemAccess'],
}));

// These constructors are not used directly, but this registers them to the
// tracing system so that instances we find later will be shimmed.
TraceAnything.traceClass(MediaKeys, options);
TraceAnything.traceClass(MediaKeySystemAccess, options);
TraceAnything.traceClass(MediaKeySession, combineOptions(options, {
  skipProperties: options.skipProperties.concat([
    // Also skip logging certain noisy properites on MediaKeySession.
    'expiration',

    // This is still logged in the representation of the session, but we don't
    // need to log access to the property's getter.
    'sessionId',
  ]),
}));

// Trace media element types, and monitor the document for new instances.
const elementOptions = combineOptions(options, {
  // Skip all property access on media elements.
  // It's a little noisy and unhelpful (currentTime getter, for example).
  properties: false,

  // And these specific events are VERY noisy.  Skip them.
  skipEvents: [
    'progress',
    'timeupdate',
  ],

  // Methods we don't care about on media elements:
  skipProperties: options.skipProperties.concat([
    'getAttribute',
    'getBoundingClientRect',
    'querySelector',
    'querySelectorAll',
  ]),
});
TraceAnything.traceElement('video', elementOptions);
TraceAnything.traceElement('audio', elementOptions);
