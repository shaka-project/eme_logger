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
 * @fileoverview emeLogger unit tests.
 */

describe('emeLogger', function() {
  describe('EmeMethodCall', function() {
    var defaultMethodCall;

    beforeEach(function() {
      defaultMethodCall = new emeLogger.EmeMethodCall(
        'TestMethodCall',
        document.createElement('video'),
        {resultName: 'Name', resultValue: 'Result Value'});
    });

    it('constructs a method call message object', function() {
      var result = emeLogger.getMessagePassableObject(defaultMethodCall);
      expect(result.title).toEqual('TestMethodCall');
      expect(result.names).toEqual([
          'target',
          'returned']);
      expect(result.values[0]).toEqual(
          {title: 'HTMLVideoElement', names: [], values: []});
      expect(result.values[1]).toEqual(
          {title: 'Object',
          names: ['resultName', 'resultValue'],
          values: ['Name', 'Result Value']});
    });
  });

  describe('EmeEvent', function() {
    var defaultEvent;

    beforeEach(function() {
      var event = new Event('Test');
      var video = document.createElement('video');
      defaultEvent = new emeLogger.EmeEvent('TestEvent', event, video);
    });

    it('constructs an event message object', function() {
      var result = emeLogger.getMessagePassableObject(defaultEvent);
      expect(result.title).toEqual('TestEvent');
      expect(result.names).toEqual(['event', 'target']);
      expect(result.values[0]).toEqual(
          {title: 'Event', names: ['isTrusted'], values: [false]});
      // The documents title
      expect(result.values[1].title).toEqual('HTMLVideoElement');
    });
  });

  describe('PromiseResult', function() {
    var defaultPromise;

    beforeEach(function() {
      defaultPromise = new emeLogger.PromiseResult(
        'Promise Result Description', 'resolved', {result: 'Result Object'});
    });

    it('constructs a promise result message object', function() {
      var result = emeLogger.getMessagePassableObject(defaultPromise);
      expect(result.title).toEqual('Promise Result Description');
      // The names and values are the result of iteration, and therefore appear
      // in no particular order.
      expect(result.names.slice().sort()).toEqual(['args', 'result', 'status']);
      const resultMap = {};
      for (let i = 0; i < result.names.length; ++i) {
        resultMap[result.names[i]] = result.values[i];
      }
      expect(resultMap['status']).toEqual('resolved');
      expect(resultMap['result'].title).toEqual('Object');
      expect(resultMap['result'].names).toEqual(['result']);
      expect(resultMap['result'].values).toEqual(['Result Object']);
    });
  });
});
