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
 * @fileoverview Does necessary set up for the EME Logger extension.
 */

// Load required scripts into the current web page.
const urls = ['/trace-anything.js', '/eme-trace-config.js'];
for (const url of urls) {
  const absoluteUrl = chrome.runtime.getURL(url);

  // Insert a script tag and force it to load synchronously.
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.defer = false;
  script.async = false;
  script.src = absoluteUrl;
  (document.head || document.documentElement).appendChild(script);
}

// Listen for message events posted from eme-trace-config, then forward the
// log to the log window.  If the log window is closed, this message gets
// dropped.
window.addEventListener('message', (event) => {
  if (event.data.type == 'emeTraceLog') {
    chrome.runtime.sendMessage({
      type: 'EME_LOGGER_TRACE',
      log: event.data.log,
    });
  }
});
