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
 * @fileoverview Tests for the log window.
 */

describe('Log window', () => {
  let mockDocument;
  let mockWindow;
  let mockLogElement;

  beforeAll(() => {
    mockDocument = document.createElement('div');
    document.body.appendChild(mockDocument);

    mockWindow = {
      closed: false,
      focus: () => {},
      document: mockDocument,
    };
  });

  beforeEach(() => {
    // Reset the singleton we're testing.
    EmeLogWindow.instance = new EmeLogWindow();

    // Return the mock window when we are supposed to open one.
    spyOn(window, 'open').and.returnValue(mockWindow);

    // Clear the contents of the document.
    while (mockDocument.firstChild) {
      mockDocument.firstChild.remove();
    }

    // Add the element where log items will go.
    mockLogElement = document.createElement('ul');
    mockLogElement.id = 'eme-log';
    mockDocument.appendChild(mockLogElement);
  });

  describe('Window handling', () => {
    it('opens the logging window', () => {
      EmeLogWindow.instance.open();
      expect(window.open).toHaveBeenCalledWith(
        'log.html', jasmine.any(String), jasmine.any(String));
    });

    it('reports the logging window is open', () => {
      mockWindow.closed = false;
      EmeLogWindow.instance.open();
      expect(EmeLogWindow.instance.isOpen()).toBe(true);
    });

    it('reports the logging window is closed', () => {
      mockWindow.closed = true;
      EmeLogWindow.instance.open();
      expect(EmeLogWindow.instance.isOpen()).toBe(false);
    });
  });

  it('logs with timestamps', () => {
    const date = new Date('July 20, 1969 12:34:56 UTC');
    EmeLogWindow.instance.open();
    EmeLogWindow.instance.appendLog({
      timestamp: date.getTime(),
    });
    expect(mockLogElement.querySelector('h3').textContent)
        .toContain('1969-07-20 12:34:56');
  });

  it('logs with durations', () => {
    EmeLogWindow.instance.open();
    EmeLogWindow.instance.appendLog({
      timestamp: Date.now(),
      duration: 15,
    });
    expect(mockLogElement.querySelector('h3').textContent)
        .toContain('duration: 15.0 ms');
  });

  it('shows warnings', () => {
    EmeLogWindow.instance.open();
    EmeLogWindow.instance.appendLog({
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
    beforeEach(() => {
      EmeLogWindow.instance.open();
    });

    it('for constructors', () => {
      EmeLogWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Constructor,
        className: 'SomeClass',
        args: [],
      });
      expect(mockLogElement.querySelector('.title').textContent)
          .toContain('new SomeClass');
    });

    it('for methods', () => {
      EmeLogWindow.instance.appendLog({
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
      EmeLogWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Getter,
        className: 'SomeClass',
        memberName: 'someMember',
      });
      expect(mockLogElement.querySelector('.title').textContent)
          .toContain('SomeClass.someMember');
    });

    it('for setters', () => {
      EmeLogWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Setter,
        className: 'SomeClass',
        memberName: 'someMember',
      });
      expect(mockLogElement.querySelector('.title').textContent)
          .toContain('SomeClass.someMember');
    });

    it('for events', () => {
      EmeLogWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Event,
        className: 'SomeClass',
        eventName: 'someevent',
        event: fakeObjectWithType('Event', {type: 'someevent'}),
      });
      expect(mockLogElement.querySelector('.title').textContent)
          .toContain('SomeClass someevent Event');
    });
  });

  describe('formats event data', () => {
    beforeEach(() => {
      EmeLogWindow.instance.open();
    });

    it('for events with falsey values', () => {
      EmeLogWindow.instance.appendLog({
        timestamp: Date.now(),
        type: TraceAnything.LogTypes.Event,
        className: 'SomeClass',
        eventName: 'someevent',
        event: fakeObjectWithType('Event', {type: 'someevent'}),
        value: 0,
      });
      expect(mockLogElement.querySelector('.data').textContent)
          .toContain('Associated value: 0');
    });

    it('for events that are not Event objects', () => {
      EmeLogWindow.instance.appendLog({
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
    beforeEach(() => {
      EmeLogWindow.instance.open();
    });

    function logResult(result) {
      EmeLogWindow.instance.appendLog({
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
  function fakeObjectWithType(type, fields=null, data=null) {
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
