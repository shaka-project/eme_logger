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
  var link = document.getElementById('option-download-file');
  var href =
      chrome.extension.getBackgroundPage().emeLogConstructor.getLogFileUrl();
  if (href == '') {
    link.disabled = true;
  } else {
    link.disabled = false;
    link.href = href;
  }
});
