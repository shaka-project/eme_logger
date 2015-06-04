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


/*
 * The writer used to write to the log file.
 * @private {FileWriter}
 */
emeLogConstructor.logFileWriter_;


/*
 * The URL of the log file.
 * @private {string}
 */
emeLogConstructor.logFileUrl_ = '';


/*
 * The promise that manages writes to the log file.
 * @private {Promise}
 */
emeLogConstructor.p_ = Promise.resolve();


/**
 * Appends a log item to the current logging frame.
 * @param {!emeLogConstructor.LogItemData} data The data to log.
 */
emeLogConstructor.appendLogItem = function(data) {
  var dom_item = document.createElement('li');
  dom_item.innerHTML = emeLogConstructor.buildHTMLLogItem(data);
  loggingWindow.document.querySelector('#eme-log').appendChild(dom_item);
};


/**
 * @typedef {{
 *   title: string,
 *   names: !Array.<string>,
 *   values: !Array.<string|Object>
 * }}
 */
emeLogConstructor.LogItemData;


/**
 * Builds an HTML log item.
 * @param {!emeLogConstructor.LogItemData} data The data to log.
 * @return {string} An HTML representaion of a log item for the given data.
 */
emeLogConstructor.buildHTMLLogItem = function(data) {
  var item = '<h3 style="color: blue">' + data.title + '</h3>';
  for (var i = 0; i < data.names.length; ++i) {
    var name = data.names[i];
    var value = data.values[i];
    if (typeof(value) == 'object') {
      value = JSON.stringify(value, null, 4);
    }
    if (typeof(value) == 'string') {
      value = emeLogConstructor.convertTextToHtml(value);
    }
    item += name + ': ' + value + '<br>';
  }
  return item;
};


/**
 * Builds a text log item.
 * @param {!emeLogConstructor.LogItemData} data The data to log.
 * @return {string} An text representaion of a log item for the given data.
 */
emeLogConstructor.buildTextLogItem = function(data) {
  var item = data.title + '\n';
  for (var i = 0; i < data.names.length; ++i) {
    var name = data.names[i];
    var value = data.values[i];
    if (typeof(value) == 'object') {
      value = JSON.stringify(value, null, 4);
    }
    item += name + ': ' + value + '\n';
  }
  item += '\n';
  return item;
};

/**
 * Converts text to HTML, replacing line breaks and spaces.
 * @param {string} text The text to convert to HTML.
 * @return {string} The HTML representation of the text.
 */
emeLogConstructor.convertTextToHtml = function(text) {
  if (!text) {
    return '';
  }
  return text.replace(/\n/gm, '<br>')
             .replace(/\s/gm, '&nbsp')
             .replace(/\t/gm, '&nbsp&nbsp&nbsp&nbsp');
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
        if (loggingWindow) {
          emeLogConstructor.appendLogItem(request.data.data);
        }
        if (!emeLogConstructor.logFileWriter_) {
          return;
        }
        emeLogConstructor.p_ = emeLogConstructor.p_.then(function() {
          return new Promise(function(ok, fail) {
            // Alias.
            var fileWriter = emeLogConstructor.logFileWriter_;

            var item = emeLogConstructor.buildTextLogItem(request.data.data);
            var logItem = new Blob([item], {type: 'text/plain'});
            fileWriter.write(logItem);

            fileWriter.onwriteend = ok;
            fileWriter.onerror = fail;
          });
        });
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
