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
