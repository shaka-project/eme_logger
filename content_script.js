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
 * @fileoverview Does necessary set up for the EME Logger extension.
 */

// Load required scripts into the current web page.
var urls = ['/mutation-summary.js', '/prototypes.js', '/eme_listeners.js'];
for (var i = 0; i < urls.length; i++) {
  var mainScriptUrl = chrome.extension.getURL(urls[i]);

  // We cannot load the main script using '.src' because such scripts are not
  // guaranteed to run immediately.
  var xhr = new XMLHttpRequest();
  xhr.open('GET', mainScriptUrl, true);

  xhr.onload = function(e) {
    var xhr = e.target;
    var mainScript = document.createElement('script');
    mainScript.type = 'application/javascript';
    if (xhr.status == 200) {
      mainScript.text = xhr.responseText;
      document.documentElement.appendChild(mainScript);
    }
  };

  xhr.send();
}

// Listen for message events posted from EmeListeners, then forwards
// message to the background page.
window.addEventListener('message', function(event) {
  if (event.data.type == 'emeLogMessage')
    chrome.runtime.sendMessage({data: event.data});
});

