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
 * @fileoverview Tests for EME API tracing.
 */

describe('EME tracing', () => {
  beforeEach(() => {
    spyOn(EmeListeners, 'logAndPostMessage_').and.callFake((log) => {
      // Validate that the logs can always be serialized.  We don't care about
      // the output at this level.
      try {
        JSON.stringify(log);
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

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'RequestMediaKeySystemAccessCall',
            // NOTE: This is a bug.  The target is not wrapped in this case.
            // But since I'm about to replace the internals, let's ignore it for
            // now.
            'target': navigator,
            'keySystem': keySystem,
            'supportedConfigurations': minimalConfigs,
          }));
    });
  });

  describe('logs MediaKeySystemAccess object', () => {
    let mksa;

    beforeEach(async () => {
      mksa = await navigator.requestMediaKeySystemAccess(
          keySystem, minimalConfigs);
      EmeListeners.logAndPostMessage_.calls.reset();
    });

    it('getConfiguration calls', async () => {
      const config = mksa.getConfiguration();

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'GetConfigurationCall',
            'target': jasmine.objectContaining({
              'title': 'MediaKeySystemAccess',
            }),
            'returned': config,
          }));
    });

    it('createMediaKeys calls', async () => {
      const mediaKeys = await mksa.createMediaKeys();

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'CreateMediaKeysCall',
            'target': jasmine.objectContaining({
              'title': 'MediaKeySystemAccess',
            }),
            'returned': jasmine.any(Promise),
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'CreateMediaKeysCall Promise Result',
            'status': 'resolved',
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
      EmeListeners.logAndPostMessage_.calls.reset();
    });

    it('createSession calls', () => {
      const session = mediaKeys.createSession('temporary');

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'CreateSessionCall',
            // NOTE: This is a bug.  The target is not wrapped in this case.
            // But since I'm about to replace the internals, let's ignore it for
            // now.
            'target': mediaKeys,
            'sessionType': 'temporary',
            'returned': jasmine.objectContaining({
              'title': 'MediaKeySession',
            }),
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

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'SetServerCertificateCall',
            // NOTE: This is a bug.  The target is not wrapped in this case.
            // But since I'm about to replace the internals, let's ignore it for
            // now.
            'target': mediaKeys,
            'serverCertificate': new Uint8Array(serverCertificate),
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'SetServerCertificateCall Promise Result',
            'status': 'resolved',
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
      EmeListeners.logAndPostMessage_.calls.reset();
    });

    it('generateRequest calls', async () => {
      await session.generateRequest('cenc', initData);

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'GenerateRequestCall',
            'target': jasmine.objectContaining({
              'title': 'MediaKeySession',
            }),
            'initDataType': 'cenc',
            'initData': initData,
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'GenerateRequestCall Promise Result',
            'status': 'resolved',
          }));
    });

    it('load calls', async () => {
      try {
        await session.load('fakeSessionId');
      } catch (exception) {}  // Will fail with a fake session ID; ignore it

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'LoadCall',
            'target': jasmine.objectContaining({
              'title': 'MediaKeySession',
            }),
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'LoadCall Promise Result',
            'status': 'rejected',
          }));
    });

    it('update calls', async () => {
      const fakeLicenseResponse = new Uint8Array([1, 2, 3]);
      try {
        await session.update(fakeLicenseResponse);
      } catch (exception) {} // Will fail with fake data; ignore it

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'UpdateCall',
            'target': jasmine.objectContaining({
              'title': 'MediaKeySession',
            }),
            'response': fakeLicenseResponse,
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'UpdateCall Promise Result',
            'status': 'rejected',
          }));
    });

    it('close calls', async () => {
      try {
        await session.close();
      } catch (exception) {}  // Will fail due to invalid state; ignore it

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'CloseCall',
            'target': jasmine.objectContaining({
              'title': 'MediaKeySession',
            }),
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'CloseCall Promise Result',
            'status': 'rejected',
          }));
    });

    it('remove calls', async () => {
      try {
        await session.remove();
      } catch (exception) {}  // Will fail due to invalid state; ignore it

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'RemoveCall',
            'target': jasmine.objectContaining({
              'title': 'MediaKeySession',
            }),
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'RemoveCall Promise Result',
            'status': 'rejected',
          }));
    });

    it('events', () => {
      session.dispatchEvent(new Event('message'));
      session.dispatchEvent(new Event('keystatuseschange'));

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'MessageEvent',
            'target': jasmine.objectContaining({
              'title': 'MediaKeySession',
            }),
            'event': jasmine.any(Event),
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'KeyStatusesChangeEvent',
            'target': jasmine.objectContaining({
              'title': 'MediaKeySession',
            }),
            'event': jasmine.any(Event),
          }));
    });
  });

  describe('logs HTML media elements', () => {
    var mediaElement;

    beforeAll(() => {
      // Make a real video element to log access to.
      mediaElement = document.createElement('video');

      // Set a tiny mp4 data URI as a source, so we can hit play.
      mediaElement.src = tinyMp4;

      // Mute it and hide it visually.
      mediaElement.muted = true;
      mediaElement.style.display = 'none';

      // The element must be in the DOM to be discovered.
      document.body.appendChild(mediaElement);
    });

    afterAll(() => {
      mediaElement.remove();
    });

    it('setMediaKeys calls', async () => {
      const mksa = await navigator.requestMediaKeySystemAccess(
          keySystem, minimalConfigs);
      const mediaKeys = await mksa.createMediaKeys();
      await mediaElement.setMediaKeys(mediaKeys);

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'SetMediaKeysCall',
            'target': jasmine.objectContaining({
              'title': 'HTMLVideoElement',
            }),
            'mediaKeys': mediaKeys,
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'SetMediaKeysCall Promise Result',
            'status': 'resolved',
          }));
    });

    it('play calls', async () => {
      await mediaElement.play();

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'PlayCall',
            'target': jasmine.objectContaining({
              'title': 'HTMLVideoElement',
            }),
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'PlayCall Promise Result',
            'status': 'resolved',
          }));
    });

    it('events', async () => {
      mediaElement.pause();
      await mediaElement.play();  // Will dispatch the play event

      // Simulate a real error event, which also sets this property:
      Object.defineProperty(mediaElement, 'error', {value: {code: 5}});
      mediaElement.dispatchEvent(new Event('error'));

      mediaElement.dispatchEvent(new Event('encrypted'));

      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'PlayEvent',
            'target': jasmine.objectContaining({
              'title': 'HTMLVideoElement',
            }),
            'event': jasmine.any(Event),
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'ErrorEvent',
            'target': jasmine.objectContaining({
              'title': 'HTMLVideoElement',
            }),
            'event': jasmine.any(Event),
          }));
      expect(EmeListeners.logAndPostMessage_).toHaveBeenCalledWith(
          jasmine.objectContaining({
            'title': 'EncryptedEvent',
            'target': jasmine.objectContaining({
              'title': 'HTMLVideoElement',
            }),
            'event': jasmine.any(Event),
          }));
    });
  });
});
