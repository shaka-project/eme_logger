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
 * @fileoverview Code for the "popup" when the extension is clicked.
 */

// When the user clicks the extension icon, open the EME log window.
document.addEventListener('DOMContentLoaded', () => {
  const backgroundPage = chrome.extension.getBackgroundPage();
  const emeLogWindow = backgroundPage.EmeLogWindow.instance;

  // Without a small delay, it opens behind the current window.  Adding the
  // delay makes it a proper popup that takes focus.
  setTimeout(() => {
    emeLogWindow.open();
    window.close();
  }, 100);
});
