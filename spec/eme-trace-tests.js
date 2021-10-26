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
 * @fileoverview Tests for EME API tracing.
 */

describe('EME tracing', () => {
  beforeEach(() => {
    spyOn(window, 'emeLogger').and.callFake((log) => {
      // Validate that the logs can always be serialized.  We don't care about
      // the output at this level.
      delete log.instance;

      try {
        JSON.stringify(prepLogForMessage(log));
      } catch (exception) {
        fail(exception);
      }
    });
  });

  const keySystem = 'com.widevine.alpha';
  const minimalConfigs = [{
    initDataTypes: ['cenc'],
    videoCapabilities: [{
      contentType: 'video/mp4; codecs="avc1.42E01E"',
    }],
  }];
  const initData = new Uint8Array([
    0x00, 0x00, 0x00, 0x73, 0x70, 0x73, 0x73, 0x68, 0x00, 0x00, 0x00, 0x00,
    0xed, 0xef, 0x8b, 0xa9, 0x79, 0xd6, 0x4a, 0xce, 0xa3, 0xc8, 0x27, 0xdc,
    0xd5, 0x1d, 0x21, 0xed, 0x00, 0x00, 0x00, 0x53, 0x08, 0x01, 0x12, 0x10,
    0x68, 0xac, 0xcc, 0x06, 0xd6, 0xac, 0x53, 0x58, 0x98, 0x88, 0x6c, 0x1e,
    0x31, 0xe0, 0xbf, 0x39, 0x12, 0x10, 0x3e, 0x07, 0xd4, 0x81, 0x61, 0x7a,
    0x50, 0x6a, 0x9d, 0x22, 0x6e, 0x72, 0xc7, 0xf5, 0xc9, 0xb7, 0x12, 0x10,
    0x44, 0x2d, 0x60, 0xd2, 0x0f, 0xad, 0x5d, 0xee, 0xa5, 0xc7, 0x3e, 0x00,
    0x05, 0xf1, 0xc3, 0x9e, 0x1a, 0x0d, 0x77, 0x69, 0x64, 0x65, 0x76, 0x69,
    0x6e, 0x65, 0x5f, 0x74, 0x65, 0x73, 0x74, 0x22, 0x08, 0xce, 0xc5, 0xbf,
    0xf5, 0xdc, 0x40, 0xdd, 0xc9, 0x32, 0x00,
  ]);
  // A completely valid mp4 in a data URI (an audio init segment).
  const tinyMp4 = 'data:audio/mp4;base64,AAAAGGZ0eXBkYXNoAAAAAGlzbzZtcDQxAAAC0W1vb3YAAABsbXZoZAAAAADTjyWa048lmgAAu4ACim4AAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAACGbWV0YQAAAAAAAAAgaGRscgAAAAAAAAAASUQzMgAAAAAAAAAAAAAAAAAAAFpJRDMyAAAAABXHSUQzBAAAAAAAQlBSSVYAAAA4AABodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2VkYXNoLXBhY2thZ2VyAGZlNjc3NWEtcmVsZWFzZQAAADhtdmV4AAAAEG1laGQAAAAAAopuAAAAACB0cmV4AAAAAAAAAAEAAAABAAAEAAAAAAAAAAAAAAABn3RyYWsAAABcdGtoZAAAAAPTjyWa048lmgAAAAEAAAAAAopuAAAAAAAAAAAAAAAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAATttZGlhAAAAIG1kaGQAAAAA048lmtOPJZoAALuAAopuABXHAAAAAAAtaGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAFNvdW5kSGFuZGxlcgAAAADmbWluZgAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAKpzdGJsAAAAXnN0c2QAAAAAAAAAAQAAAE5tcDRhAAAAAAAAAAEAAAAAAAAAAAACABAAAAAAu4AAAAAAACplc2RzAAAAAAMcAAEABBRAFQAAAAAAAAAAAAAABQURkFblAAYBAgAAABBzdHRzAAAAAAAAAAAAAAAQc3RzYwAAAAAAAAAAAAAAFHN0c3oAAAAAAAAAAAAAAAAAAAAQc3RjbwAAAAAAAAAAAAAAEHNtaGQAAAAAAAAAAA==';

  describe('logs navigator object', () => {
    it('requestMediaKeySystemAccess calls', async () => {
      const mksa = await navigator.requestMediaKeySystemAccess(
          keySystem, minimalConfigs);

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'Navigator',
            'methodName': 'requestMediaKeySystemAccess',
            'args': [keySystem, minimalConfigs],
            'result': mksa,
          }));
    });
  });

  describe('logs MediaKeySystemAccess object', () => {
    let mksa;

    beforeEach(async () => {
      mksa = await navigator.requestMediaKeySystemAccess(
          keySystem, minimalConfigs);
      emeLogger.calls.reset();
    });

    it('getConfiguration calls', async () => {
      const config = mksa.getConfiguration();

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'MediaKeySystemAccess',
            'methodName': 'getConfiguration',
            'args': [],
            'result': config,
          }));
    });

    it('createMediaKeys calls', async () => {
      const mediaKeys = await mksa.createMediaKeys();

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'MediaKeySystemAccess',
            'methodName': 'createMediaKeys',
            'args': [],
            'result': mediaKeys,
          }));
    });
  });

  describe('logs MediaKeys object', () => {
    let mediaKeys;

    beforeEach(async () => {
      const mksa = await navigator.requestMediaKeySystemAccess(
          keySystem, minimalConfigs);
      mediaKeys = await mksa.createMediaKeys();
      emeLogger.calls.reset();
    });

    it('createSession calls', () => {
      const session = mediaKeys.createSession('temporary');

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'MediaKeys',
            'methodName': 'createSession',
            'args': ['temporary'],
            'result': session,
          }));
    });

    it('setServerCertificate calls', async () => {
      const response = await fetch('__spec__/server-cert');
      expect(response.ok).toBe(true);
      if (!response.ok) {
        return;
      }

      const serverCertificate = await response.arrayBuffer();
      await mediaKeys.setServerCertificate(serverCertificate);

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'MediaKeys',
            'methodName': 'setServerCertificate',
            'args': [serverCertificate],
            'result': true,
          }));
    });
  });

  describe('logs MediaKeySession object', () => {
    let session;

    beforeEach(async () => {
      const mksa = await navigator.requestMediaKeySystemAccess(
          keySystem, minimalConfigs);
      const mediaKeys = await mksa.createMediaKeys();
      session = mediaKeys.createSession('temporary');
      emeLogger.calls.reset();
    });

    it('generateRequest calls', async () => {
      await session.generateRequest('cenc', initData);

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'MediaKeySession',
            'methodName': 'generateRequest',
            'args': ['cenc', initData],
            'result': undefined,
          }));
    });

    it('load calls', async () => {
      try {
        await session.load('fakeSessionId');
      } catch (exception) {}  // Will fail with a fake session ID; ignore it

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'MediaKeySession',
            'methodName': 'load',
            'args': ['fakeSessionId'],
            'threw': jasmine.any(Error),
          }));
    });

    it('update calls', async () => {
      const fakeLicenseResponse = new Uint8Array([1, 2, 3]);
      try {
        await session.update(fakeLicenseResponse);
      } catch (exception) {} // Will fail with fake data; ignore it

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'MediaKeySession',
            'methodName': 'update',
            'args': [fakeLicenseResponse],
            'threw': jasmine.any(Error),
          }));
    });

    it('close calls', async () => {
      try {
        await session.close();
      } catch (exception) {}  // Will fail due to invalid state; ignore it

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'MediaKeySession',
            'methodName': 'close',
            'args': [],
            'threw': jasmine.any(Error),
          }));
    });

    it('remove calls', async () => {
      try {
        await session.remove();
      } catch (exception) {}  // Will fail due to invalid state; ignore it

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'MediaKeySession',
            'methodName': 'remove',
            'args': [],
            'threw': jasmine.any(Error),
          }));
    });

    it('events', () => {
      session.dispatchEvent(new Event('message'));
      session.dispatchEvent(new Event('keystatuseschange'));

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Event,
            'className': 'MediaKeySession',
            'eventName': 'message',
          }));
      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Event,
            'className': 'MediaKeySession',
            'eventName': 'keystatuseschange',
            'value': session.keyStatuses,
          }));
    });
  });

  describe('logs HTML media elements', () => {
    var mediaElement;

    beforeAll(async () => {
      // Make a real video element to log access to.
      mediaElement = document.createElement('video');

      // Set a tiny mp4 data URI as a source, so we can hit play.
      mediaElement.src = tinyMp4;

      // Mute it.
      mediaElement.muted = true;

      // The element must be in the DOM to be discovered.
      document.body.appendChild(mediaElement);

      // FIXME: Discovery is not working in this environment.  Why?  Is it still
      // working in a normal page?
      TraceAnything.scanDocumentForNewElements();
    });

    afterAll(() => {
      mediaElement.remove();
    });

    it('setMediaKeys calls', async () => {
      const mksa = await navigator.requestMediaKeySystemAccess(
          keySystem, minimalConfigs);
      const mediaKeys = await mksa.createMediaKeys();
      await mediaElement.setMediaKeys(mediaKeys);

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'HTMLVideoElement',
            'methodName': 'setMediaKeys',
            'args': [mediaKeys],
            'result': undefined,
          }));
    });

    it('play calls', async () => {
      await mediaElement.play();

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Method,
            'className': 'HTMLVideoElement',
            'methodName': 'play',
            'args': [],
          }));
    });

    it('events', async () => {
      mediaElement.pause();
      await mediaElement.play();  // Will dispatch the play event

      // Simulate a real error event, which also sets this property:
      Object.defineProperty(mediaElement, 'error', {value: {code: 5}});
      mediaElement.dispatchEvent(new Event('error'));

      const encryptedEvent = new Event('encrypted');
      encryptedEvent.initDataType = 'webm';
      encryptedEvent.initData = new Uint8Array([1, 2, 3]);
      mediaElement.dispatchEvent(encryptedEvent);

      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Event,
            'className': 'HTMLVideoElement',
            'eventName': 'play',
          }));
      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Event,
            'className': 'HTMLVideoElement',
            'eventName': 'error',
            'value': {code: 5},
          }));
      expect(emeLogger).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'type': TraceAnything.LogTypes.Event,
            'className': 'HTMLVideoElement',
            'eventName': 'encrypted',
            'event': jasmine.objectContaining({
              'initDataType': 'webm',
              'initData': new Uint8Array([1, 2, 3]),
            }),
          }));
    });
  });
});
