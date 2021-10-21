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
 * @fileoverview EmeListeners unit tests.
 */

describe('emeListeners', function() {
  beforeEach(() => {
    // Set a specific mock time, since some of these objects are timestamped and
    // compared with other objects that may have been constructed a few
    // milliseconds later.  This eliminates some test flake.
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2021, 7, 20));
  });

  afterAll(() => {
    jasmine.clock().uninstall();
  });

  var listener, mockFn, async, logCallSpy;
  var expectLogCall = function(proto, args, target, data, keySystem) {
    expect(EmeListeners.logCall).toHaveBeenCalledWith(
        proto, args, jasmine.any(Object), target);
  };

  var expectLogEvent = function(proto, eventName) {
    expect(EmeListeners.logEvent).toHaveBeenCalledWith(
        proto, events[eventName]);
  };

  const events = {
      encryptedEvent: new Event('encrypted'),
      playEvent: new Event('play'),
      errorEvent: new Event('error'),
      messageEvent: new Event('message'),
      keyStatusesChangeEvent: new Event('keystatuseschange')
    };

  beforeEach(function() {
    listener = new EmeListeners();
    logCallSpy = spyOn(EmeListeners, 'logCall').and.returnValue({title: ''});
    spyOn(EmeListeners, 'logEvent');
    spyOn(EmeListeners, 'logPromiseResult');
    mockFn = jasmine.createSpy('mockFn').and.returnValue(Promise.resolve({}));
    async = [];
  });

  describe('logs navigator object', function() {
    var mockMediaKeySystemAccess;

    beforeEach(function() {
      navigator.requestMediaKeySystemAccess = mockFn;
      navigator.listenersAdded_ = false;
      listener.addListenersToNavigator_();
    });

    it('requestMediaKeySystemAccess calls', function(done) {
      logsCall(
        navigator.requestMediaKeySystemAccess,
        emeLogger.RequestMediaKeySystemAccessCall,
        ['fakeKeySystem', ['fakeConfig']],
        navigator,
        done);
    });
  });

  describe('logs MediaKeySystemAccess object', function() {
    var mockMediaKeySystemAccess;

    beforeEach(function() {
      mockMediaKeySystemAccess = {
        getConfiguration: mockFn,
        createMediaKeys: mockFn
      };
      listener.addListenersToMediaKeySystemAccess_(mockMediaKeySystemAccess);
    });

    it('getConfiguration calls', function(done) {
      logsCall(
        mockMediaKeySystemAccess.getConfiguration,
        emeLogger.GetConfigurationCall,
        [],
        mockMediaKeySystemAccess,
        done);
    });

    it('createMediaKeys calls', function(done) {
      logsCall(
        mockMediaKeySystemAccess.createMediaKeys,
        emeLogger.CreateMediaKeysCall,
        [],
        mockMediaKeySystemAccess,
        done);
    });
  });

  describe('logs MediaKeys object', function() {
    var mockMediaKeys;

    beforeEach(function() {
      // Catch call to this method.
      spyOn(listener, 'addListenersToMediaKeySession_');
      mockMediaKeys = {
        createSession: mockFn,
        setServerCertificate: mockFn
      };
      listener.addListenersToMediaKeys_(mockMediaKeys);
    });

    it('createSession calls', function(done) {
      logsCall(
        mockMediaKeys.createSession,
        emeLogger.CreateSessionCall,
        ['fakeSessionType'],
        mockMediaKeys,
        done);
    });

    it('setServerCertificate calls', function(done) {
      logsCall(
        mockMediaKeys.setServerCertificate,
        emeLogger.SetServerCertificateCall,
        ['fakeServerCertificate'],
        mockMediaKeys,
        done);
    });
  });

  describe('logs MediaKeys object', function() {
    var mockMediaKeys;

    beforeEach(function() {
      // Catch call to this method.
      spyOn(listener, 'addListenersToMediaKeySession_');
      mockMediaKeys = {
        createSession: mockFn,
        setServerCertificate: mockFn
      };
      listener.addListenersToMediaKeys_(mockMediaKeys);
    });

    it('createSession calls', function(done) {
      logsCall(
        mockMediaKeys.createSession,
        emeLogger.CreateSessionCall,
        ['fakeSessionType'],
        mockMediaKeys,
        done);
    });

    it('setServerCertificate calls', function(done) {
      logsCall(
        mockMediaKeys.setServerCertificate,
        emeLogger.SetServerCertificateCall,
        ['fakeServerCertificate'],
        mockMediaKeys,
        done);
    });
  });

  describe('logs MediaKeySession object', function() {
    var mockMediaKeySession;

    beforeEach(function() {
      mockMediaKeySession = {
        generateRequest: mockFn,
        load: mockFn,
        update: mockFn,
        close: mockFn,
        remove: mockFn,
        addEventListener: jasmine.createSpy('addEventListenerMock')
      };
      listener.addListenersToMediaKeySession_(mockMediaKeySession);
    });

    it('generateRequest calls', function(done) {
      logsCall(
        mockMediaKeySession.generateRequest,
        emeLogger.GenerateRequestCall,
        ['fakeInitDataType', 'fakeInitData'],
        mockMediaKeySession,
        done);
    });

    it('load calls', function(done) {
      logsCall(
        mockMediaKeySession.load,
        emeLogger.LoadCall,
        ['fakeSessionId'],
        mockMediaKeySession,
        done);
    });

    it('update calls', function(done) {
      logsCall(
        mockMediaKeySession.update,
        emeLogger.UpdateCall,
        ['fakeResponse'],
        mockMediaKeySession,
        done,
        'fakeResponse');
    });

    it('close calls', function(done) {
      logsCall(
        mockMediaKeySession.close,
        emeLogger.CloseCall,
        [],
        mockMediaKeySession,
        done);
    });

    it('remove calls', function(done) {
      logsCall(
        mockMediaKeySession.remove,
        emeLogger.RemoveCall,
        [],
        mockMediaKeySession,
        done);
    });

    it('events', function() {
      // Needs to be an object that implements the EventTarget interface.
      mockMediaKeySession = document.createElement('media');
      listener.addListenersToMediaKeySession_(mockMediaKeySession);
      for (var e in events) {
        mockMediaKeySession.dispatchEvent(events[e]);
      }
      expect(EmeListeners.logEvent.calls.count()).toEqual(2);
      expectLogEvent(emeLogger.MessageEvent, 'messageEvent');
      expectLogEvent(
          emeLogger.KeyStatusesChangeEvent, 'keyStatusesChangeEvent');
    });
  });

  describe('logs unprefixed EME', function() {
    var mockHtmlMedia;

    beforeEach(function() {
      mockHtmlMedia = {
        setMediaKeys: mockFn,
        play: mockFn
      };
      listener.addEmeMethodListeners_(mockHtmlMedia);
    });


    it('setMediaKeys calls', function(done) {
      logsCall(
        mockHtmlMedia.setMediaKeys,
        emeLogger.SetMediaKeysCall,
        ['fakeMediaKeys'],
        mockHtmlMedia,
        done);
    });

    it('play calls', function(done) {
      logsCall(
        mockHtmlMedia.play,
        emeLogger.PlayCall,
        [],
        mockHtmlMedia,
        done);
    });

    it('events', function() {
      spyOn(console, 'error');
      mockHtmlMedia = document.createElement('media');
      listener.addEmeEventListeners_(mockHtmlMedia);
      for (var e in events) {
        mockHtmlMedia.dispatchEvent(events[e]);
      }
      expect(EmeListeners.logEvent.calls.count()).toEqual(3);
      expectLogEvent(emeLogger.PlayEvent, 'playEvent');
      expectLogEvent(emeLogger.ErrorEvent, 'errorEvent');
      expectLogEvent(emeLogger.EncryptedEvent, 'encryptedEvent');
      expect(console.error.calls.count()).toEqual(1);
    });
  });

  it('logs call using given proto', function() {
    spyOn(console, 'log');
    logCallSpy.and.callThrough();
    var mediaElement = document.createElement('media');
    var expected = new emeLogger.SetMediaKeysCall(
        ['fakeMediaKeys'], mediaElement, null);
    EmeListeners.logCall(
        emeLogger.SetMediaKeysCall, ['fakeMediaKeys'], null, mediaElement);
    expect(console.log).toHaveBeenCalledWith(expected);
  });

  function logsCall(fn, proto, args, element, done, key, keySystem) {
    fn.apply(this, args).then(function() {
      expect(EmeListeners.logCall.calls.count()).toEqual(1);
      expect(EmeListeners.logPromiseResult.calls.count()).toEqual(1);
      expect(mockFn.calls.count()).toEqual(1);
      expectLogCall(proto, args, element, key, keySystem);
      done();
    }).catch(function(err) {
      fail(err);
      done();
    });
  }
});
