/**
 * @fileoverview Controls for the browser action options.
 */

var emePopup = {};


/**
 * Handles opening and closing of the separate logging frame.
 * @param {Event} e A click event.
 */
emePopup.handleSeparateFrame = function(e) {
  if (!chrome.extension.getBackgroundPage().emeLogConstructor.isWindowOpen()) {
    chrome.extension.getBackgroundPage().emeLogConstructor.openWindow();
  } else {
    chrome.extension.getBackgroundPage().emeLogConstructor.closeWindow();
  }
  window.close();
};


document.addEventListener('DOMContentLoaded', function() {
  var loggingCheckbox = document.querySelector('#option-separate-frame');
  loggingCheckbox.checked =
      chrome.extension.getBackgroundPage().emeLogConstructor.isWindowOpen();
  loggingCheckbox.addEventListener('click', emePopup.handleSeparateFrame);
});

