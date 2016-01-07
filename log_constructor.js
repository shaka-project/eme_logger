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
 * @fileoverview Maintains the separate frame logging.
 */


var emeLogConstructor = {};
var loggingWindow;


/**
 * The writer used to write to the log file.
 * @private {FileWriter}
 */
emeLogConstructor.logFileWriter_;


/**
 * The URL of the log file.
 * @private {string}
 */
emeLogConstructor.logFileUrl_ = '';


/**
 * The promise that manages writes to the log file.
 * @private {Promise}
 */
emeLogConstructor.p_ = Promise.resolve();


/**
 * @typedef {{
 *   title: string,
 *   timestamp: string,
 *   names: !Array.<string>,
 *   values: !Array.<*>
 * }}
 */
emeLogConstructor.LogItemData;


/**
 * @typedef {{
 *   title: string,
 *   timestamp: string,
 *   logData: string
 * }}
 */
emeLogConstructor.FormattedLogItem;


/**
 * Builds a formatted representation of some log data.
 * @param {!emeLogConstructor.LogItemData} data
 * @return {!emeLogConstructor.FormattedLogItem}
 */
emeLogConstructor.buildFormattedLogItem = function(data) {
  var logItem = {'title' : data.title,
                 'timestamp' : data.timestamp,
                 'logData' : emeLogConstructor.buildDataPairs(data, 0)};
  return logItem;
};


/**
 * Builds a log string from pairs of data.
 * @param {!emeLogConstructor.LogItemData} data
 * @param {number} indent Current indentation
 * @return {string} A formatted string.
 */
emeLogConstructor.buildDataPairs = function(data, indent) {
  var indentString = emeLogConstructor.getIndentString(++indent);
  var item = '';
  for (var i = 0; i < data.names.length; ++i) {
    var name = data.names[i];
    var value = emeLogConstructor.buildObjectItem(data.values[i], indent);
    item += i ? '\n' : '';
    item += indentString + name + ':  ' + value;
  }
  return item;
};


/**
 * Builds a formatted string from a data object.
 * @param {undefined|number|string|boolean|emeLogConstructor.LogItemData} data
 *    The data to format.
 * @param {number} indent Current indentation.
 * @return {string} A formatted string.
 */
emeLogConstructor.buildObjectItem = function(data, indent) {
  var getIndentString = emeLogConstructor.getIndentString;

  if (typeof(data) == 'number' || typeof(data) == 'boolean') {
    return data.toString();
  } else if (typeof(data) == 'string') {
    return data;
  } else if (typeof(data) == 'object') {
    if (!data) return 'null';
    if (data.names.length == 0) return data.title + '{}';

    indent++;
    var convertedData = '';
    switch (data.title) {
      case 'Array':
        // Print an array. The array could contain objects, strings or numbers.
        convertedData += '[';
        for (var i = 0; i < data.values.length - 1; ++i) {
          var value = emeLogConstructor.buildObjectItem(data.values[i], indent);
          convertedData += value + ', ';
        }
        if (data.values.length) {
          convertedData += emeLogConstructor.buildObjectItem(
              data.values[data.values.length - 1], indent);
        }
        convertedData += ']';
        break;
      case 'Uint8Array':
        // data.values contains the Uint8Array. This is an array of 8-bit
        // unsigned integers.
        while (data.values.length > 0) {
          convertedData +=
              '\n' + getIndentString(indent) + data.values.splice(0, 20);
        }
        break;
      case 'Object':
        // Print name value pairs without title
        convertedData +=
            '\n' + emeLogConstructor.buildDataPairs(data, --indent);
        break;
      default:
        // Standard Object printing, with object title
        var indentString = getIndentString(indent);
        convertedData = '\n' + indentString + data.title + ' {\n';
        convertedData += emeLogConstructor.buildDataPairs(data, indent);
        convertedData += '\n' + indentString + '}';
    }
    return convertedData;
  } else {
    return 'undefined';
  }
};


/**
 * Builds an HTML log item and appends to the current logging frame.
 * @param {!emeLogConstructor.FormattedLogItem} data The formatted data to log.
 */
emeLogConstructor.appendHtmlLogItem = function(data) {
  var heading = document.createElement('h3');
  var span = document.createElement('span');
  span.style.color = 'blue';
  span.textContent = data.title;
  var time = document.createTextNode('  ' + data.timestamp);
  heading.appendChild(span);
  heading.appendChild(time);
  var pre = document.createElement('pre');
  pre.textContent = data.logData;

  var li = document.createElement('li');
  li.appendChild(heading);
  li.appendChild(pre);
  loggingWindow.document.querySelector('#eme-log').appendChild(li);
};


/**
 * @private {number} The number of spaces in a tab.
 * @const
 */
emeLogConstructor.NUM_SPACES_ = 4;


/**
 * Returns a string of spaces, corresponding to a number of tabs.
 * @param {number} number The number of tabs to create.
 * @return {string} A string of spaces.
 */
emeLogConstructor.getIndentString = function(number) {
  return new Array(number * emeLogConstructor.NUM_SPACES_ + 1).join(' ');
};


/**
 * Opens a separate logging window.
 */
emeLogConstructor.openWindow = function() {
  loggingWindow = window.open('log.html', 'EME Log', 'width=700,height=600');
};


/**
 * Closes the separate logging window.
 */
emeLogConstructor.closeWindow = function() {
  loggingWindow.close();
};


/**
 * Returns true if a separate window for logging is open, or false if it is not.
 * @return {boolean}
 */
emeLogConstructor.isWindowOpen = function() {
  return loggingWindow && !loggingWindow.closed ? true : false;
};


/**
 * Returns the log file URL or an empty string if the file has not been opened.
 * @return {string}
 */
emeLogConstructor.getLogFileUrl = function() {
  return emeLogConstructor.logFileUrl_;
};


/**
 * Listens for messages from the content script to append a log item to the
 * current frame and log file.
 */
if (chrome.runtime) {
  chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        var formattedData =
          emeLogConstructor.buildFormattedLogItem(request.data.data);
        if (loggingWindow) {
          emeLogConstructor.appendHtmlLogItem(formattedData);
        }
        if (!emeLogConstructor.logFileWriter_) {
          return;
        }
        emeLogConstructor.p_ = emeLogConstructor.p_.then(function() {
          return new Promise(function(ok, fail) {
            // Alias.
            var fileWriter = emeLogConstructor.logFileWriter_;

            var textItem =
                formattedData.title + '  ' + formattedData.timestamp + '\n' +
                formattedData.logData + '\n\n';
            var logItem = new Blob([textItem], {type: 'text/plain'});
            fileWriter.write(logItem);

            fileWriter.onwriteend = ok;
            fileWriter.onerror = fail;
          });
        // TODO (natalieharris) Notify user of error in log file.
        }).catch(function() {});
      });
}


/**
 * Initializes the log file. Any previous data will be cleared from the file.
 * @param {FileSystem} filesystem The FileSystem to contain the log.
 */
emeLogConstructor.initializeLogFile = function(filesystem) {
  var initializeFileWriter = function(fileWriter) {
    emeLogConstructor.p_ = emeLogConstructor.p_.then(function() {
      return new Promise(function(ok, fail) {
        fileWriter.truncate(0);
        fileWriter.onwriteend = ok;
        fileWriter.onerror = fail;
      });
    });
    emeLogConstructor.logFileWriter_ = fileWriter;
  };

  filesystem.root.getFile('log.txt', {create: true}, function(fileEntry) {
    fileEntry.createWriter(initializeFileWriter);
    emeLogConstructor.logFileUrl_ = fileEntry.toURL();
  });
};


window.webkitRequestFileSystem(
    window.PERSISTENT,
    5 * 1024 * 1024,
    emeLogConstructor.initializeLogFile);
