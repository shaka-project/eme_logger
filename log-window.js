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
 * @fileoverview This is the logic for the actual log window.
 */
class EmeLoggerWindow {
  constructor() {
    /** @private {!HTMLElement} */
    this.logElement_ = document.querySelector('#eme-log');

    /** @private {string} */
    this.textLogs_ = '';

    /** @private {!HTMLButtonElement} */
    this.clearButton_ = document.querySelector('#clear-button');
    this.clearButton_.addEventListener('click', () => {
      while (this.logElement_.hasChildNodes()) {
        this.logElement_.removeChild(this.logElement_.firstChild);
      }

      this.textLogs_ = '';
    });

    /** @private {!HTMLButtonElement} */
    this.downloadButton_ = document.querySelector('#download-button');
    this.downloadButton_.addEventListener('click', () => {
      // Format the logs into a Blob.
      const blob = new Blob([this.textLogs_], { type: 'text/plain' });

      // Trigger a download.
      chrome.downloads.download({
        url: URL.createObjectURL(blob),
        filename: 'EMELogFile.txt'
      });
    });

    // Default to hex first as that is what is selected.
    sessionStorage.setItem("toggle", "hex");
    let contact = document.querySelectorAll('input[name="radio-toggle-group"]');

    /** @private {!HTMLInputElement} */
    for (let i = 0; i < contact.length; i++) {
        contact[i].addEventListener("change", function() {
        let val = this.value;
        sessionStorage.setItem("toggle", this.value);
      });
}
  }

  /**
   * Append logs to the DOM and to an internal string.
   *
   * @param {Object} The serialized log
   */
  appendLog(log) {
    const li = document.createElement('li');
    this.logElement_.appendChild(li);

    const heading = document.createElement('h3');
    li.appendChild(heading);

    const time = document.createElement('div');
    time.classList.add('time');
    heading.appendChild(time);
    heading.appendChild(document.createElement('br'));

    const instanceId = document.createElement('div');
    instanceId.classList.add('instance-id');
    heading.appendChild(instanceId);
    heading.appendChild(document.createElement('br'));

    const title = document.createElement('div');
    title.classList.add('title');
    heading.appendChild(title);

    const timestamp = new Date(log.timestamp);
    const formattedTimestamp = timestamp.toString();

    time.textContent = formattedTimestamp;
    if (log.duration) {
      time.textContent += ` - duration: ${log.duration.toFixed(1)} ms`;
    }

    instanceId.textContent = log.instanceId;

    const data = document.createElement('pre');
    data.classList.add('data');
    li.appendChild(data);

    if (log.type == 'Warning') {
      title.textContent = 'WARNING';
      title.classList.add('warning');
      data.textContent = log.message;
    }

    if (log.type == 'Constructor') {
      title.textContent = `new ${log.className}`;
    } else if (log.type == 'Method') {
      title.textContent = `${log.className}.${log.methodName}`;
    } else if (log.type == 'Getter' || log.type == 'Setter') {
      title.textContent = `${log.className}.${log.memberName}`;
    } else if (log.type == 'Event') {
      title.textContent = `${log.className} ${log.eventName} Event`;
    }

    if (log.type == 'Constructor' || log.type == 'Method') {
      const args = log.args.map(arg => this.prettyPrint_(arg)).join(', ');
      data.textContent = `${title.textContent}(${args})`;

      if (log.threw) {
        data.textContent += ` threw ${this.prettyPrint_(log.threw)}`;
      } else {
        data.textContent += ` => ${this.prettyPrint_(log.result)}`;
      }
    } else if (log.type == 'Getter') {
      data.textContent = title.textContent;

      if (log.threw) {
        data.textContent += ` threw ${this.prettyPrint_(log.threw)}`;
      } else {
        data.textContent += ` => ${this.prettyPrint_(log.result)}`;
      }
    } else if (log.type == 'Setter') {
      data.textContent = title.textContent;

      if (log.threw) {
        data.textContent += ` threw ${this.prettyPrint_(log.threw)}`;
      } else {
        data.textContent += ` => ${this.prettyPrint_(log.value)}`;
      }
    } else if (log.type == 'Event') {
      data.textContent = `${log.className} `;
      if (!log.event.__type__) {
        // If the event object didn't properly inherit from Event, then we may
        // be missing type info.  Construct it now with the event name.
        data.textContent += `${log.eventName} Event instance `;
      }
      data.textContent += this.prettyPrint_(log.event);
      if ('value' in log) {
        data.textContent +=
            '\nAssociated value: ' + this.prettyPrint_(log.value);
      }
    }

    // TODO: Keep an array of blobs instead?  More efficient for large logs?
    this.textLogs_ +=
        formattedTimestamp + '\n\n' +
        instanceId.textContent + '\n' +
        data.textContent + '\n\n\n\n';
  }

  /**
   * @param {number} byte
   * @return {string}
   * @private
   */
  byteToHex_(byte) {
    return '0x' + byte.toString(16).padStart(2, '0');
  }

  /**
   * @param {number} byte
   * @return {string}
   * @private
   */
  bytesToBase64_(bytes) {
    return btoa(String.fromCharCode.apply(null,new Uint8Array(bytes)));
  }

  /**
   * @return {string}
   * @private
   */
  toggleStoredInSessionStorage_() {
    return sessionStorage.getItem("toggle");
  }

  /**
   * @param {*} obj
   * @param {string} indentation
   * @return {string}
   * @private
   */
  prettyPrint_(obj, indentation = '') {
    if (obj == null) {
      return obj;
    }

    // If it's a named type, unpack it and attach the name.
    if (obj.__type__) {
      let format = obj.__type__ + ' instance';

      // This has fields like an object.
      if (obj.__fields__) {
        format += ' ' + this.prettyPrint_(obj.__fields__, indentation);
      }

      // This has a data array like an ArrayBufferView.
      // TODO: Handle formatting for 16-bit and 32-bit values?
      if (obj.__data__) {
        const data = obj.__data__.slice();  // Make a copy
        if (data.length == 0) {
          format += '[]';
        } else {
          format += ' ' + '[\n';
          if(this.toggleStoredInSessionStorage_() == "hex"){
              while (data.length) {
                  const row = data.splice(0, 16);
                  format += indentation + '  ';
                  format += row.map(this.byteToHex_).join(', ');
                  format += ',\n';
                }
            } else {
                const base64data = this.bytesToBase64_(data).split(/(.{97})/).filter(O=>O);
                base64data.forEach(base64chunk => {
                  format += base64chunk;
                  format += '\n';
                })
              }
          format += indentation + ']';
        }
      }
      return format;
    }

    if (Array.isArray(obj)) {
      // More compact representations for empty or 1-element arrays.
      if (obj.length == 0) {
        return '[]';
      }
      if (obj.length == 1) {
        return `[${this.prettyPrint_(obj[0], indentation)}]`;
      }

      let insides = '';
      for (const entry of obj) {
        insides += indentation + '  ';
        insides += this.prettyPrint_(entry, indentation + '  ') + ',\n';
      }
      return `[\n${insides}${indentation}]`;
    }

    if (obj.constructor == Object) {
      const keys = Object.keys(obj);

      // More compact representations for empty or 1-element objects.
      if (keys.length == 0) {
        return '{}';
      }
      if (keys.length == 1) {
        return `{${keys[0]}: ${this.prettyPrint_(obj[keys[0]], indentation)}}`;
      }

      let insides = '';
      for (const key of keys) {
        insides += indentation + '  ' + key + ': ';
        insides += this.prettyPrint_(obj[key], indentation + '  ') + ',\n';
      }
      return `{\n${insides}${indentation}}`;
    }

    if (typeof obj == 'string') {
      return `"${obj}"`;
    }

    return obj.toString();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // In a test environment, wait to instantiate this.
  if (!window.jasmine) {
    EmeLoggerWindow.instance = new EmeLoggerWindow();
  }
});

// NOTE: These APIs are not defined in our test environment, but should always
// be present when this is run as a Chrome extension.
if (chrome.runtime !== undefined) {
  /**
   * Listens for messages from the content script to append a log item to the
   * current frame and log file.
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type == 'EME_LOGGER_TRACE') {
      EmeLoggerWindow.instance.appendLog(request.log);
    }
  });
}
