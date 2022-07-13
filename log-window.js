/**
 * Copyright 2021 Google Inc.
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
 * @fileoverview Implements the log window.
 */

class EmeLogWindow {
  constructor() {
    /** @private {Window} */
    this.logWindow_ = null;

    /** @private {string} */
    this.textLogs_ = '';
  }

  /** Open the log window. */
  async open() {
    if (!this.isOpen()) {
      this.logWindow_ = await chrome.windows.create({
        url: chrome.runtime.getURL('log.html'),
        type: 'popup',
        height: 600,
        width: 700,
      });

      // Inject a copy of this class into the window so that it can get the log
      // URI later.
      this.logWindow_.EmeLogWindow = EmeLogWindow;
    }

    // Bring the window to the foreground.
    chrome.windows.update(this.logWindow_.id, { focused: true });
  }

  /**
   * Close the log window.
   * @param {Number} Window ID
  */
  close(windowId) {
    if (this.logWindow_ != null && this.logWindow_.id == windowId) {
      this.logWindow_ = null;
      this.clear();
    }
  }

  /** @return {boolean} True if the log window is open. */
  isOpen() {
    return this.logWindow_ != null;
  }

  /** @return {string} The text log. */
  getTextLogs() {
    return this.textLogs_;
  }

  /** Clear the log window. */
  clear() {
    this.textLogs_ = '';
  }

  /** @param {Object} The text log. */
  appendLog(textLog) {
    if (this.logWindow_) {
      this.textLogs_ += textLog;
    }
  }
}

EmeLogWindow.instance = new EmeLogWindow();

// NOTE: These APIs are not defined in our test environment, but should always
// be present when this is run as a Chrome extension.
if (chrome.runtime !== undefined) {
  /**
   * When a window is closed, close the log window.
   */
  chrome.windows.onRemoved.addListener((windowId) => {
    EmeLogWindow.instance.close(windowId);
  });

  /**
   * When the extension icon is clicked, open the log window if it doesn't exist,
   * and bring it to the front otherwise.
   */
  chrome.action.onClicked.addListener(async (tab) => {
    EmeLogWindow.instance.open();
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EME_LOGGER_CLEAR') {
      EmeLogWindow.instance.clear();
    }
    else if (message.type === 'EME_LOGGER_GET_TEXT_LOGS') {
      sendResponse({ textLogs: EmeLogWindow.instance.getTextLogs() });
    }
    else if (message.type == 'EME_LOGGER_APPEND_LOG') {
      EmeLogWindow.instance.appendLog(message.data);
    }
  });
}
