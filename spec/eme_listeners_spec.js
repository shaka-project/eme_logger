describe('emeListeners', function() {
  var listener, mockFn;
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
    mockFn = jasmine.createSpy('mockFn').and.returnValue(Promise.resolve());
  });

  it('logs calls on navigator object', function() {
    navigator.requestMediaKeySystemAccess = mockFn;
    listener.addListenersToNavigator_();
    navigator.requestMediaKeySystemAccess('fakeKeySystem', ['fakeConfig']);
    expect(mockFn.calls.count()).toEqual(1);
    expectLogCall(
      'RequestMediaKeySystemAccessCall',
      ['fakeKeySystem', ['fakeConfig']],
      ['keySystem', 'supportedConfigurations'],
      navigator);
  });

  it('logs calls on MediaKeySystemAccess object', function() {
    var mockMediaKeySystemAccess = {
      getConfiguration: mockFn,
      createMediaKeys: mockFn
    };
    listener.addListenersToMediaKeySystemAccess_(mockMediaKeySystemAccess);
    mockMediaKeySystemAccess.getConfiguration();
    mockMediaKeySystemAccess.createMediaKeys();
    expect(EmeListeners.logCall.calls.count()).toEqual(2);
    expect(mockFn.calls.count()).toEqual(2);
    expectLogCall('GetConfigurationCall', [], [], mockMediaKeySystemAccess);
    expectLogCall('CreateMediaKeysCall', [], [], mockMediaKeySystemAccess);
  });

  it('logs calls on MediaKeys object', function() {
    // Catch call to this method.
    spyOn(listener, 'addListenersToMediaKeySession_');
    var mockMediaKeys = {
      createSession: mockFn,
      setServerCertificate: mockFn
    };
    listener.addListenersToMediaKeys_(mockMediaKeys);
    mockMediaKeys.createSession('fakeSessionType');
    mockMediaKeys.setServerCertificate('fakeServerCertificate');
    expect(EmeListeners.logCall.calls.count()).toEqual(2);
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
  });

  it('logs calls on MediaKeySession object', function() {
    var mockMediaKeySession = {
      generateRequest: mockFn,
      load: mockFn,
      update: mockFn,
      close: mockFn,
      remove: mockFn,
      addEventListener: mockFn
    };
    listener.addListenersToMediaKeySession_(mockMediaKeySession);
    mockMediaKeySession.generateRequest('fakeInitDataType', 'fakeInitData');
    mockMediaKeySession.load('fakeSessionId');
    mockMediaKeySession.update('fakeResponse');
    mockMediaKeySession.close();
    mockMediaKeySession.remove();
    expect(EmeListeners.logCall.calls.count()).toEqual(5);
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

  it('logs prefixed eme calls on HTMLMedia element', function() {
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
    mockHtmlMedia.canPlayType('fakeType', 'fakeKeySystem');
    mockHtmlMedia.webkitGenerateKeyRequest('fakeKeySystem', 'fakeInitData');
    mockHtmlMedia.webkitAddKey(
        'fakeKeySystem', 'fakeKey', 'fakeInitData', 'fakeSessionId');
    mockHtmlMedia.webkitCancelKeyRequest('fakeKeySystem', 'fakeSessionId');
    mockHtmlMedia.play();
    expect(EmeListeners.logCall.calls.count()).toEqual(5);
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
  });

  it('logs prefixed eme events on HTMLMedia element', function() {
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
  });

  it('logs unprefixed eme calls on HTMLMedia element', function() {
    listener.prefixedEmeEnabled = false;
    listener.unprefixedEmeEnabled = true;
    var mockHtmlMedia = {
      setMediaKeys: mockFn,
      play: mockFn
    };
    listener.addEmeMethodListeners_(mockHtmlMedia);
    mockHtmlMedia.setMediaKeys('fakeMediaKeys');
    mockHtmlMedia.play();
    expect(EmeListeners.logCall.calls.count()).toEqual(2);
    expect(mockFn.calls.count()).toEqual(2);
    expectLogCall(
      'SetMediaKeysCall', ['fakeMediaKeys'], ['MediaKeys'], mockHtmlMedia);
    expectLogCall('PlayCall', [], [], mockHtmlMedia);
  });

  it('logs unprefixed eme events on HTMLMedia element', function() {
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
  });

});
