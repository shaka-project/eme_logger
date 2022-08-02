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
 * @fileoverview The service worker creates and communicates with the actual
 *   log window.
 */

class EmeLoggerServiceWorker {
  constructor() {
    /** @private {Window} */
    this.logWindow_ = null;
  }

  /** Open the log window. */
  async openLogWindow() {
    if (!this.isLogWindowOpen()) {
      this.logWindow_ = await chrome.windows.create({
        url: chrome.runtime.getURL('log-window.html'),
        type: 'popup',
        height: 600,
        width: 700,
      });
    }

    // Bring the window to the foreground.
    chrome.windows.update(this.logWindow_.id, { focused: true });
  }

  /**
   * Close the log window.
   * @param {Number} Window ID
  */
  closeLogWindow(windowId) {
    if (this.logWindow_ != null && this.logWindow_.id == windowId) {
      this.logWindow_ = null;
    }
  }

  /** @return {boolean} True if the log window is open. */
  isLogWindowOpen() {
    return this.logWindow_ != null;
  }
}

EmeLoggerServiceWorker.instance = new EmeLoggerServiceWorker();

// NOTE: These APIs are not defined in our test environment, but should always
// be present when this is run as a Chrome extension.
if (chrome.runtime !== undefined) {
  /**
   * When a window is closed, clear the handle if it was the log window.
   * Ignored if a different window was closed.
   */
  chrome.windows.onRemoved.addListener((windowId) => {
    EmeLoggerServiceWorker.instance.closeLogWindow(windowId);
  });

  /**
   * When the extension icon is clicked, open the log window if it doesn't
   * exist, and bring it to the front otherwise.
   */
  chrome.action.onClicked.addListener(async (tab) => {
    await EmeLoggerServiceWorker.instance.openLogWindow();
  });
}
