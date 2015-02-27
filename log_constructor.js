/**
 * @fileoverview Maintains the separate frame logging.
 */

// TODO(natalieharris): Determine if this can be converted to an event page or
// if it is an exception to the extension best practices
var emeLogConstructor = {};
var loggingWindow;


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
 * Listens for messages from the content script to either open the logging
 * frame or append a log item to the current frame.
 */
if (chrome.runtime) {
  chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        if (loggingWindow) {
          emeLogConstructor.appendLogItem(request.data.data);
        }
      });
}

