describe('emeListeners', function() {
  var listener, mockFn, async;
  var expectLogCall = function(name, args, labels, target) {
    expect(EmeListeners.logCall).toHaveBeenCalledWith(
        name, args, labels, jasmine.any(Object), target);
  };

  var expectLogEvent = function(eventName) {
    expect(EmeListeners.logEvent).toHaveBeenCalledWith(events[eventName]);
  };

  const events = {
      webkitNeedKeyEvent: new Event('webkitneedkey'),
      webkitKeyMessageEvent: new Event('webkitkeymessage'),
      webkitKeyAddedEvent: new Event('webkitkeyadded'),
      webkitKeyErrorEvent: new Event('webkitkeyerror'),
      encryptedEvent: new Event('encrypted'),
      playEvent: new Event('play'),
      errorEvent: new Event('error'),
      messageEvent: new Event('message'),
      keyStatusesChangeEvent: new Event('keystatuseschange')
    };

  beforeEach(function() {
    listener = new EmeListeners();
    spyOn(EmeListeners, 'logCall');
    spyOn(EmeListeners, 'logEvent');
    spyOn(EmeListeners, 'logPromiseResult');
    mockFn = jasmine.createSpy('mockFn').and.returnValue(Promise.resolve({}));
    async = [];
  });

  it('logs calls on navigator object', function(done) {
    navigator.requestMediaKeySystemAccess = mockFn;
    listener.addListenersToNavigator_();
    async.push(
      navigator.requestMediaKeySystemAccess('fakeKeySystem', ['fakeConfig']));
    Promise.all(async).then(function() {
      expect(mockFn.calls.count()).toEqual(1);
      expect(EmeListeners.logPromiseResult.calls.count()).toEqual(1);
      expectLogCall(
        'RequestMediaKeySystemAccessCall',
        ['fakeKeySystem', ['fakeConfig']],
        ['keySystem', 'supportedConfigurations'],
        navigator);
      done();
    }).catch(function(err) {
      fail(err);
      done();
    });
  });

  it('logs calls on MediaKeySystemAccess object', function(done) {
    var mockMediaKeySystemAccess = {
      getConfiguration: mockFn,
      createMediaKeys: mockFn
    };
    listener.addListenersToMediaKeySystemAccess_(mockMediaKeySystemAccess);
    async.push(mockMediaKeySystemAccess.getConfiguration());
    async.push(mockMediaKeySystemAccess.createMediaKeys());
    Promise.all(async).then(function() {
      expect(EmeListeners.logCall.calls.count()).toEqual(2);
      expect(EmeListeners.logPromiseResult.calls.count()).toEqual(2);
      expect(mockFn.calls.count()).toEqual(2);
      expectLogCall('GetConfigurationCall', [], [], mockMediaKeySystemAccess);
      expectLogCall('CreateMediaKeysCall', [], [], mockMediaKeySystemAccess);
      done();
    }).catch(function(err) {
      fail(err);
      done();
    });
  });

  it('logs calls on MediaKeys object', function(done) {
    // Catch call to this method.
    spyOn(listener, 'addListenersToMediaKeySession_');
    var mockMediaKeys = {
      createSession: mockFn,
      setServerCertificate: mockFn
    };
    listener.addListenersToMediaKeys_(mockMediaKeys);
    async.push(mockMediaKeys.createSession('fakeSessionType'));
    async.push(mockMediaKeys.setServerCertificate('fakeServerCertificate'));
    Promise.all(async).then(function() {
      expect(EmeListeners.logCall.calls.count()).toEqual(2);
      expect(EmeListeners.logPromiseResult.calls.count()).toEqual(2);
      expect(mockFn.calls.count()).toEqual(2);
      expectLogCall(
        'CreateSessionCall',
        ['fakeSessionType'],
        ['sessionType'],
        mockMediaKeys);
      expectLogCall(
        'SetServerCertificateCall',
        ['fakeServerCertificate'],
        ['serverCertificate'],
        mockMediaKeys);
      done();
    }).catch(function(err) {
      fail(err);
      done();
    });
  });

  it('logs calls on MediaKeySession object', function(done) {
    var mockMediaKeySession = {
      generateRequest: mockFn,
      load: mockFn,
      update: mockFn,
      close: mockFn,
      remove: mockFn,
      addEventListener: mockFn
    };
    listener.addListenersToMediaKeySession_(mockMediaKeySession);
    async.push(
      mockMediaKeySession.generateRequest('fakeInitDataType', 'fakeInitData'));
    async.push(mockMediaKeySession.load('fakeSessionId'));
    async.push(mockMediaKeySession.update('fakeResponse'));
    async.push(mockMediaKeySession.close());
    async.push(mockMediaKeySession.remove());
    Promise.all(async).then(function() {
      expect(EmeListeners.logCall.calls.count()).toEqual(5);
      expect(EmeListeners.logPromiseResult.calls.count()).toEqual(5);
      // Expect for each logged call and twice for addEventListener
      expect(mockFn.calls.count()).toEqual(7);
      expectLogCall(
        'GenerateRequestCall',
        ['fakeInitDataType', 'fakeInitData'],
        ['initDataType', 'initData'],
        mockMediaKeySession);
      expectLogCall(
        'LoadCall',
        ['fakeSessionId'],
        ['sessionId'],
        mockMediaKeySession);
      expectLogCall(
        'UpdateCall',
        ['fakeResponse'],
        ['response'],
        mockMediaKeySession);
      expectLogCall('CloseCall', [], [], mockMediaKeySession);
      expectLogCall('RemoveCall', [], [], mockMediaKeySession);
      done();
    }).catch(function(err) {
      fail(err);
      done();
    });
  });

  it('logs events on MediaKeySession object', function() {
    // Needs to be an object that implements the EventTarget interface.
    var mockMediaKeySession = document.createElement('media');
    listener.addListenersToMediaKeySession_(mockMediaKeySession);
    for (var e in events) {
      mockMediaKeySession.dispatchEvent(events[e]);
    }
    expect(EmeListeners.logEvent.calls.count()).toEqual(2);
    expectLogEvent('messageEvent');
    expectLogEvent('keyStatusesChangeEvent');
  });

  it('logs prefixed eme calls on HTMLMedia element', function(done) {
    listener.prefixedEmeEnabled = true;
    listener.unprefixedEmeEnabled = false;
    var mockHtmlMedia = {
      canPlayType: mockFn,
      webkitGenerateKeyRequest: mockFn,
      webkitAddKey: mockFn,
      webkitCancelKeyRequest: mockFn,
      play: mockFn
    };
    listener.addEmeMethodListeners_(mockHtmlMedia);
    async.push(mockHtmlMedia.canPlayType('fakeType', 'fakeKeySystem'));
    async.push(mockHtmlMedia.webkitGenerateKeyRequest(
        'fakeKeySystem', 'fakeInitData'));
    async.push(mockHtmlMedia.webkitAddKey(
        'fakeKeySystem', 'fakeKey', 'fakeInitData', 'fakeSessionId'));
    async.push(mockHtmlMedia.webkitCancelKeyRequest(
        'fakeKeySystem', 'fakeSessionId'));
    async.push(mockHtmlMedia.play());
    Promise.all(async).then(function() {
      expect(EmeListeners.logCall.calls.count()).toEqual(5);
      expect(EmeListeners.logPromiseResult.calls.count()).toEqual(5);
      expect(mockFn.calls.count()).toEqual(5);
      expectLogCall(
        'CanPlayTypeCall',
        ['fakeType', 'fakeKeySystem'],
        ['type', 'keySystem'],
        mockHtmlMedia);
      expectLogCall(
        'GenerateKeyRequestCall',
        ['fakeKeySystem', 'fakeInitData'],
        ['keySystem', 'initData'],
        mockHtmlMedia);
      expectLogCall(
        'AddKeyCall',
        ['fakeKeySystem', 'fakeKey', 'fakeInitData', 'fakeSessionId'],
        ['keySystem', 'key', 'initData', 'sessionId'],
        mockHtmlMedia);
      expectLogCall(
        'CancelKeyRequestCall',
        ['fakeKeySystem', 'fakeSessionId'],
        ['keySystem', 'sessionId'],
        mockHtmlMedia);
      expectLogCall('PlayCall', [], [], mockHtmlMedia);
      done();
    }).catch(function(err) {
      fail(err);
      done();
    });
  });

  it('logs prefixed eme events on HTMLMedia element', function() {
    spyOn(console, 'error');
    listener.prefixedEmeEnabled = true;
    listener.unprefixedEmeEnabled = false;
    var mockHtmlMedia = document.createElement('media');
    listener.addEmeEventListeners_(mockHtmlMedia);
    for (var e in events) {
      mockHtmlMedia.dispatchEvent(events[e]);
    }
    expect(EmeListeners.logEvent.calls.count()).toEqual(7);
    expectLogEvent('webkitNeedKeyEvent');
    expectLogEvent('webkitKeyMessageEvent');
    expectLogEvent('webkitKeyAddedEvent');
    expectLogEvent('webkitKeyErrorEvent');
    expectLogEvent('playEvent');
    expectLogEvent('errorEvent');
    expectLogEvent('encryptedEvent');
    expect(console.error.calls.count()).toEqual(1);
  });

  it('logs unprefixed eme calls on HTMLMedia element', function(done) {
    listener.prefixedEmeEnabled = false;
    listener.unprefixedEmeEnabled = true;
    var mockHtmlMedia = {
      setMediaKeys: mockFn,
      play: mockFn
    };
    listener.addEmeMethodListeners_(mockHtmlMedia);
    async.push(mockHtmlMedia.setMediaKeys('fakeMediaKeys'));
    async.push(mockHtmlMedia.play());
    Promise.all(async).then(function() {
      expect(EmeListeners.logCall.calls.count()).toEqual(2);
      expect(EmeListeners.logPromiseResult.calls.count()).toEqual(2);
      expect(mockFn.calls.count()).toEqual(2);
      expectLogCall(
        'SetMediaKeysCall', ['fakeMediaKeys'], ['MediaKeys'], mockHtmlMedia);
      expectLogCall('PlayCall', [], [], mockHtmlMedia);
      done();
    }).catch(function(err) {
      fail(err);
      done();
    });
  });

  it('logs unprefixed eme events on HTMLMedia element', function() {
    spyOn(console, 'error');
    listener.prefixedEmeEnabled = false;
    listener.unprefixedEmeEnabled = true;
    var mockHtmlMedia = document.createElement('media');
    listener.addEmeEventListeners_(mockHtmlMedia);
    for (var e in events) {
      mockHtmlMedia.dispatchEvent(events[e]);
    }
    expect(EmeListeners.logEvent.calls.count()).toEqual(3);
    expectLogEvent('playEvent');
    expectLogEvent('errorEvent');
    expectLogEvent('encryptedEvent');
    expect(console.error.calls.count()).toEqual(1);
  });
});
