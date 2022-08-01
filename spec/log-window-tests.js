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

describe('Log window', () => {
  let mockDocument;
  let mockLogElement;
  let mockClearButton;
  let mockDownloadButton;

  beforeAll(() => {
    mockDocument = document.createElement('div');
    mockDocument.createElement = (name) => document.createElement(name);
    document.body.appendChild(mockDocument);
  });

  beforeEach(() => {
    // Clear the contents of the document.
    while (mockDocument.firstChild) {
      mockDocument.firstChild.remove();
    }

    // Add the element where log items will go.
    mockLogElement = document.createElement('ul');
    mockLogElement.id = 'eme-log';
    mockLogElement.style.display = 'none';
    mockDocument.appendChild(mockLogElement);

    // Add mock button elements, which the singleton will expect.
    mockClearButton = document.createElement('button');
    mockClearButton.id = 'clear-button';
    mockClearButton.style.display = 'none';
    mockDocument.appendChild(mockClearButton);

    mockDownloadButton = document.createElement('button');
    mockDownloadButton.id = 'download-button';
    mockDownloadButton.style.display = 'none';
    mockDocument.appendChild(mockDownloadButton);

    // Reset the singleton we're testing.
    EmeLoggerWindow.instance = new EmeLoggerWindow();
  });

  it('logs with timestamps', () => {
    const date = new Date('July 20, 1969 12:34:56 UTC');
    EmeLoggerWindow.instance.appendLog({
      timestamp: date.getTime(),
    });
    // Times are in the local user's timezone.  Without mocking that somehow,
    // we can only set expectations on the date format.
    expect(mockLogElement.querySelector('h3').textContent)
        .toContain('Sun Jul 20 1969');
  });

  it('logs with durations', () => {
    EmeLoggerWindow.instance.appendLog({
      timestamp: Date.now(),
      duration: 15,
    });
    expect(mockLogElement.querySelector('h3').textContent)
        .toContain('duration: 15.0 ms');
  });

  it('shows warnings', () => {
    EmeLoggerWindow.instance.appendLog({
      timestamp: Date.now(),
      type: TraceAnything.LogTypes.Warning,
      message: 'Oh no!',
    });

    expect(mockLogElement.querySelector('.title').textContent)
        .toContain('WARNING');
    expect(mockLogElement.querySelector('.title').classList.contains('warning'))
        .toBe(true);
    expect(mockLogElement.querySelector('.data').textContent)
        .toContain('Oh no!');
  });

  describe('sets an appropriate title', () => {
    it('for constructors', () => {
      EmeLoggerWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Constructor,
        className: 'SomeClass',
        args: [],
      });
      expect(mockLogElement.querySelector('.title').textContent)
          .toContain('new SomeClass');
    });

    it('for methods', () => {
      EmeLoggerWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Method,
        className: 'SomeClass',
        methodName: 'someMethod',
        args: [],
      });
      expect(mockLogElement.querySelector('.title').textContent)
          .toContain('SomeClass.someMethod');
    });

    it('for getters', () => {
      EmeLoggerWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Getter,
        className: 'SomeClass',
        memberName: 'someMember',
      });
      expect(mockLogElement.querySelector('.title').textContent)
          .toContain('SomeClass.someMember');
    });

    it('for setters', () => {
      EmeLoggerWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Setter,
        className: 'SomeClass',
        memberName: 'someMember',
      });
      expect(mockLogElement.querySelector('.title').textContent)
          .toContain('SomeClass.someMember');
    });

    it('for events', () => {
      EmeLoggerWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Event,
        className: 'SomeClass',
        eventName: 'someevent',
        event: fakeObjectWithType('Event', { type: 'someevent' }),
      });
      expect(mockLogElement.querySelector('.title').textContent)
          .toContain('SomeClass someevent Event');
    });
  });

  describe('formats event data', () => {
    it('for events with falsey values', () => {
      EmeLoggerWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Event,
        className: 'SomeClass',
        eventName: 'someevent',
        event: fakeObjectWithType('Event', { type: 'someevent' }),
        value: 0,
      });
      expect(mockLogElement.querySelector('.data').textContent)
          .toContain('Associated value: 0');
    });

    it('for events that are not Event objects', () => {
      EmeLoggerWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Event,
        className: 'SomeClass',
        eventName: 'someevent',
        event: {},
        value: 0,
      });
      expect(mockLogElement.querySelector('.data').textContent)
          .toContain('SomeClass someevent Event instance');
      expect(mockLogElement.querySelector('.data').textContent)
          .toContain('Associated value: 0');
    });
  });

  describe('value formatting', () => {
    function logResult(result) {
      EmeLoggerWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Getter,
        className: 'SomeClass',
        memberName: 'someMember',
        result,
      });
    }

    it('builds a formatted string from a undefined value', () => {
      logResult(undefined);
      expect(mockLogElement.querySelector('.data').textContent)
          .toContain('=> undefined');
    });

    it('builds a formatted string from a number', () => {
      logResult(12345);
      expect(mockLogElement.querySelector('.data').textContent)
          .toContain('=> 12345');
    });

    it('builds a formatted string from a boolean', () => {
      logResult(true);
      expect(mockLogElement.querySelector('.data').textContent)
          .toContain('=> true');
    });

    it('builds a formatted string from null', () => {
      logResult(null);
      expect(mockLogElement.querySelector('.data').textContent)
          .toContain('=> null');
    });

    it('builds a formatted string from an array', () => {
      const array = ['Value 0', 'Value 1', 'Value 2'];
      logResult(array);

      const text = mockLogElement.querySelector('.data').textContent;
      expect(text).toContain('=> [\n');

      const arrayText = text.split('=> ')[1];
      expect(JSON5.parse(arrayText)).toEqual(array);
    });

    it('builds a compact formatted string from a 1-element array', () => {
      const array = ['abc'];
      logResult(array);

      const text = mockLogElement.querySelector('.data').textContent;
      expect(text).toContain('=> ["abc"]');

      const arrayText = text.split('=> ')[1];
      expect(JSON5.parse(arrayText)).toEqual(array);
    });

    it('builds a formatted string from a Uint8Array', () => {
      const array = [12, 34, 12, 65, 34, 634, 78, 324, 54, 23, 53];
      logResult(fakeObjectWithType(
          'Uint8Array', /* fields= */ null, /* data= */ array));

      const text = mockLogElement.querySelector('.data').textContent;
      expect(text).toContain('=> Uint8Array instance [\n');

      const arrayText = text.split('=> Uint8Array instance ')[1];
      expect(JSON5.parse(arrayText)).toEqual(array);
    });

    it('builds a formatted string from an Object', () => {
      const object = {
        persistentState: 'required',
        distinctiveIdentifier: 'required',
      };
      logResult(object);

      const text = mockLogElement.querySelector('.data').textContent;
      expect(text).toContain('=> {\n');

      const objectText = text.split('=> ')[1];
      expect(JSON5.parse(objectText)).toEqual(object);
    });

    it('builds a compact formatted string from a 1-field Object', () => {
      const object = {
        keySystem: 'com.widevine.alpha',
      };
      logResult(object);

      const text = mockLogElement.querySelector('.data').textContent;
      expect(text).toContain('=> {keySystem: "com.widevine.alpha"}');

      const objectText = text.split('=> ')[1];
      expect(JSON5.parse(objectText)).toEqual(object);
    });

    it('builds a formatted string from an Object with a type', () => {
      const fields = {
        sessionId: 'abc',
        expiration: Infinity,
      };
      const object = fakeObjectWithType('MediaKeySession', fields);
      logResult(object);

      const text = mockLogElement.querySelector('.data').textContent;
      expect(text).toContain('=> MediaKeySession instance {\n');

      const objectText = text.split('=> MediaKeySession instance ')[1];
      expect(JSON5.parse(objectText)).toEqual(fields);
    });
  });

  // This matches the format used in function emeLogger() in
  // eme-trace-config.js for serializing complex objects.  Emulate it here.
  function fakeObjectWithType(type, fields = null, data = null) {
    const obj = {
      __type__: type,
    };

    // Used for most object types to encode the fields that we serialized and
    // send between windows.
    if (fields) {
      obj.__fields__ = fields;
    }

    // Used for ArrayBuffers and ArrayBufferViews like Uint8Array which encode
    // an array of data.
    if (data) {
      obj.__data__ = data;
    }

    return obj;
  }
});
