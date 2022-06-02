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
 * @fileoverview Controls for the logging frame.
 */
document.addEventListener('DOMContentLoaded', function() {
  const clearButton = document.querySelector('#clear-button');
  clearButton.addEventListener('click', () => {
    EmeLogWindow.instance.clear();
  });

  const downloadButton = document.querySelector('#download-button');
  downloadButton.addEventListener('click', () => {
    // Set the download URI to a freshly-generated one that contains the
    // current text from the log window.
    downloadButton.href = EmeLogWindow.instance.getTextLogUri();
  });

  const base64 = false;
  const toggleButton = document.querySelector('#hex-base64-toggle-button');
  toggleButton.addEventListener('click', () => {
    const key = 'settings', toggle = 'toggle';
    var valueToInvert;
    chrome.storage.local.get([key], function(result) {
      if(result.settings == undefined) {
        var testPrefs = {toggle: !base64};
        chrome.storage.local.set({[key]: testPrefs});
        switchContent(!base64);
      } else {
        valueToInvert = result.settings.toggle;
        var testPrefs = {toggle: !valueToInvert};
        chrome.storage.local.set({[key]: testPrefs});
        switchContent(!valueToInvert)
      }
    });

    
  })

  function switchContent(displaybase64Bool) {
    const hexdata = 'hexdata', base64data = 'base64data', block = 'block', toggleValueCurrently = 'toggleValueCurrently', none = 'none';
    if(displaybase64Bool) {
      var hexDataElements = document.getElementsByClassName(hexdata);
      var i;
      for (i = 0; i < hexDataElements.length; i++) {
        hexDataElements[i].style.display = none;
      }
      var base64DataElements = document.getElementsByClassName(base64data);
      var k;
      for (k = 0; k < base64DataElements.length; k++) {
        base64DataElements[k].style.display = block;
      }
      document.getElementById(toggleValueCurrently).innerHTML = "Currently Displaying: Base64";
    } else {
      var base64DataElements = document.getElementsByClassName(base64data);
      var i;
      for (i = 0; i < base64DataElements.length; i++) {
        base64DataElements[i].style.display = none;
      }
      
      var hexDataElements = document.getElementsByClassName(hexdata);
      var k;
      for (k = 0; k < hexDataElements.length; k++) {
        hexDataElements[k].style.display = block;
      }
      document.getElementById(toggleValueCurrently).innerHTML = "Currently Displaying: Hex";

    }
  }
});
