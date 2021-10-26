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

describe('Log window', function() {
  it('opens the logging window', function() {
    spyOn(window, 'open');
    emeLogConstructor.openWindow();
    expect(window.open).toHaveBeenCalledWith(
      'log.html', jasmine.any(String), jasmine.any(String));
  });

  it('reports the logging window is open', function() {
    spyOn(window, 'open').and.returnValue({closed: false});
    emeLogConstructor.openWindow();
    expect(emeLogConstructor.isWindowOpen()).toBe(true);
  });

  it('reports the logging window is closed', function() {
    spyOn(window, 'open').and.returnValue({closed: true});
    emeLogConstructor.openWindow();
    expect(emeLogConstructor.isWindowOpen()).toBe(false);
  });

  it('builds a formatted log item', function() {
    var data = {
        title: 'Test Data',
        names: ['Name 1'],
        values: ['Value 1']
    };
    var expectedString = '    Name 1:  Value 1';
    var formattedItem = emeLogConstructor.buildFormattedLogItem(data);
    expect(formattedItem.title).toEqual(data.title);
    expect(formattedItem.logData).toEqual(expectedString);
  });

  it('builds data pairs', function() {
    var data = {
        title: 'Test Data',
        names: ['Name 1', 'Name 2'],
        values: ['Value 1', 'Value 2']
    };
    var expectedText = '    Name 1:  Value 1\n' +
                       '    Name 2:  Value 2';
    expect(emeLogConstructor.buildDataPairs(data, 0)).toEqual(expectedText);
  });

  it('builds a formatted string from a undefined value', function() {
    var result = emeLogConstructor.buildObjectItem(undefined, 0);
    expect(result).toEqual('undefined');
  });

  it('builds a formatted string from a number', function() {
    var result = emeLogConstructor.buildObjectItem(12345, 0);
    expect(result).toEqual('12345');
  });

  it('builds a formatted string from a boolean', function() {
    var result = emeLogConstructor.buildObjectItem(true, 0);
    expect(result).toEqual('true');
  });

  it('builds a formatted string from null', function() {
    var result = emeLogConstructor.buildObjectItem(null, 0);
    expect(result).toEqual('null');
  });

  it('builds a formatted string from an array', function() {
    var data = {
        title: 'Array',
        names: ['0', '1', '2'],
        values: ['Value 0', 'Value 1', 'Value 2']
    };
    var expectedText = '[Value 0, Value 1, Value 2]';
    var result = emeLogConstructor.buildObjectItem(data, 0);
    expect(result).toEqual(expectedText);
  });

   it('builds a formatted string from a Uint8Array', function() {
    var data = {
        title: 'Uint8Array',
        names: ['0', '1', '2'],
        values: [12, 34, 12, 65, 34, 634, 78, 324, 54, 23, 53]
    };
    var expectedText = '\n    12,34,12,65,34,634,78,324,54,23,53';
    var result = emeLogConstructor.buildObjectItem(data, 0);
    expect(result).toEqual(expectedText);
  });

  it('builds a formatted string from an Object', function() {
    var data = {
        title: 'Object',
        names: ['persistantStateRequired'],
        values: ['true']
    };
    var expectedText = '\n    persistantStateRequired:  true';
    var result = emeLogConstructor.buildObjectItem(data, 0);
    expect(result).toEqual(expectedText);
  });

  it('builds a formatted string from an Object with a type', function() {
    var data = {
        title: 'MediaKey',
        names: ['keySystem'],
        values: ['test.com']
    };
    var expectedText = '\n    MediaKey {\n' +
                       '        keySystem:  test.com\n' +
                       '    }';
    var result = emeLogConstructor.buildObjectItem(data, 0);
    expect(result).toEqual(expectedText);
  });
});
