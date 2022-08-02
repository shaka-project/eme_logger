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
 * @fileoverview Tests for the log window.
 */

describe('Service worker', () => {
  let mockWindow;
  let oldWindowChrome;

  beforeAll(() => {
    oldWindowChrome = window.chrome;

    window.chrome = {
      windows: {
        create: () => { },
        update: () => { },
      },
      runtime: {
        getURL: () => { },
      }
    }
    mockWindow = {
      id: 1234567,
    };

    // Return the mock window when we are supposed to create one.
    spyOn(window.chrome.windows, 'create').and.returnValue(
      new Promise((resolve, reject) => {
        resolve(mockWindow)
      }));

    spyOn(window.chrome.runtime, 'getURL').and.returnValue('log-window.html');
  });

  afterAll(() => {
    window.chrome = oldWindowChrome;
  });

  beforeEach(() => {
    // Reset the singleton we're testing.
    EmeLoggerServiceWorker.instance = new EmeLoggerServiceWorker();
  });

  describe('Window handling', () => {
    it('opens the logging window', () => {
      EmeLoggerServiceWorker.instance.openLogWindow();
      expect(window.chrome.windows.create).toHaveBeenCalledWith(new Object({
        url: 'log-window.html', type: 'popup', height: 600, width: 700
      }));
    });

    it('reports the logging window is open', async function () {
      expect(EmeLoggerServiceWorker.instance.isLogWindowOpen()).toBe(false);
      await EmeLoggerServiceWorker.instance.openLogWindow();
      expect(EmeLoggerServiceWorker.instance.isLogWindowOpen()).toBe(true);
    });

    it('reports the logging window is closed', async function () {
      await EmeLoggerServiceWorker.instance.openLogWindow();
      expect(EmeLoggerServiceWorker.instance.isLogWindowOpen()).toBe(true);
      EmeLoggerServiceWorker.instance.closeLogWindow(mockWindow.id);
      expect(EmeLoggerServiceWorker.instance.isLogWindowOpen()).toBe(false);
    });
  });
});
