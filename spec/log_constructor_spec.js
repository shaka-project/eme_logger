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
 * @fileoverview emeLogConstructor unit test.
 */

describe('emeLogConstructor', function() {
  it('opens the logging window', function() {
    spyOn(window, 'open');
    emeLogConstructor.openWindow();
    expect(window.open).toHaveBeenCalledWith(
      'log.html', jasmine.any(String), jasmine.any(String));
  });

  it('reports the logging window is open', function() {
    loggingWindow = true;
    expect(emeLogConstructor.isWindowOpen()).toBe(true);
  });

  it('reports the logging window is closed', function() {
    loggingWindow = false;
    expect(emeLogConstructor.isWindowOpen()).toBe(false);
  });

  it('builds an HTML log item', function() {
    var data = {
        title: 'Test Data',
        names: ['Name 1', 'Name 2'],
        values: [{1: 2, 3: 4}, 'Value 2']
    };
    var expectedHtml = '<h3 style="color: blue">Test Data</h3>' +
                       'Name 1: {<br>' +
                       '&nbsp&nbsp&nbsp&nbsp"1":&nbsp2,<br>' +
                       '&nbsp&nbsp&nbsp&nbsp"3":&nbsp4<br>' +
                       '}<br>' +
                       'Name 2: Value&nbsp2<br>';
    expect(emeLogConstructor.buildHTMLLogItem(data)).toEqual(expectedHtml);
  });

  it('builds a text log item', function() {
    var data = {
        title: 'Test Data',
        names: ['Name 1', 'Name 2'],
        values: [{1: 2, 3: 4}, 'Value 2']
    };
    var expectedText = 'Test Data\n' +
                       'Name 1: {\n' +
                       '    "1": 2,\n' +
                       '    "3": 4\n' +
                       '}\n' +
                       'Name 2: Value 2\n\n';
    expect(emeLogConstructor.buildTextLogItem(data)).toEqual(expectedText);
  });

  it('converts text to html', function() {
    var text = 'Testing text conversion';
    var expectedHtml = 'Testing&nbsptext&nbspconversion';
    expect(emeLogConstructor.convertTextToHtml(text)).toEqual(expectedHtml);
  });
});
