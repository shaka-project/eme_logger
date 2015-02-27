describe('emePrototypes', function() {
  describe('EmeMethodCall', function() {
    var defaultMethodCall;

    beforeEach(function() {
      defaultMethodCall = new emePrototypes.EmeMethodCall(
        'TestMethodCall',
        ['arg1', ['arg 2 array']],
        ['Argument 1', 'Argument 2'],
        {resultName: 'Name', resultValue: 'Result Value'},
        document.createElement('video'));
    });

    it('constructs a method call message object', function() {
      var methodMessageObject = defaultMethodCall.getMessageObject();
      expect(methodMessageObject.title).toEqual('TestMethodCall');
      expect(methodMessageObject.names).toEqual(
          ['Argument 1', 'Argument 2', 'target', 'returned']);
      expect(methodMessageObject.values).toEqual(
          ['arg1',
           {0: 'arg 2 array', type: 'Array'},
           'HTMLVideoElement',
           {type: 'Object', resultName: 'Name', resultValue: 'Result Value'}]);
    });
  });

  describe('EmeEvent', function() {
    var defaultEvent;

    beforeEach(function() {
      var event = new Event('Test');
      document.dispatchEvent(event);
      defaultEvent = new emePrototypes.EmeEvent(event);
    });

    it('constructs an event message object', function() {
      var eventMessageObject = defaultEvent.getMessageObject();
      expect(eventMessageObject.title).toEqual('TestEvent');
      expect(eventMessageObject.names).toEqual(
          ['type', 'time', 'event', 'target element']);
      expect(eventMessageObject.values).toEqual(
          ['Test',
           new Date(event.timeStamp).toString(),
           'Event',
           'HTMLDocument']);
    });
  });

  describe('PromiseResult', function() {
    var defaultPromise;

    beforeEach(function() {
      defaultPromise = new emePrototypes.PromiseResult(
        'Promise Result Description', 'resolved', {result: 'Result Object'});
    });

    it('constructs a promise result message object', function() {
      var promiseResultMessageObject = defaultPromise.getMessageObject();
      expect(promiseResultMessageObject.title).toEqual(
        'Promise Result Description');
      expect(promiseResultMessageObject.names).toEqual(
          ['status', 'result']);
      expect(promiseResultMessageObject.values).toEqual(
          ['resolved',
           {type: 'Object', result: 'Result Object'}]);
    });
  });
});
