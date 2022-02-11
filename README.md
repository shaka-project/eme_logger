# The EME Call and Event Logger Extension #

The EME Logger extension logs all Encrypted Media Extension (EME) calls and
Events. The log can be viewed in the javascript console, a separate browser page
or a downloaded file.

[EME Specification](https://w3c.github.io/encrypted-media/)

Just want to try it out? Install the EME Logger from [Chrome Web Store](https://chrome.google.com/webstore/detail/eme-call-and-event-logger/cniohcjecdcdhgmlofniddfoeokbpbpb).


## EME Formatters ##

Formatters can be used with the EME Logger extension. Formatters are separate
extensions that provide a class for key-system-specific custom formatting of
data from the calls and events.  Formatters should return objects with rich data
so that the EME Logger extension can incorporate them into its own formatting.

For backward compatibility with the v2 extension's format, they can also return
strings.

To register a message formatter:
  1. Write a class that implements the formatting methods below.
  2. Append an instance of the class to document.emeFormatters.

For example:

```js
class SomeFormatter {
  // Return objects with rich data (preferred), or a string with a pre-formatted
  // summary of the contents.  Throw an exception if the data is not formatted
  // correctly for your key system.

  formatInitData(initDataType, initData) {
    return MyParser.parseInitDataIntoObject(initDataType, initData);
  }

  formatRequest(request) {
    return MyParser.parseRequestIntoObject(request);
  }

  formatResponse(response) {
    return MyParser.parseResponseIntoObject(response);
  }

  formatServerCertificate(certificate) {
    return MyParser.parseCertificateIntoObject(certificate);
  }
}

if (!document.emeFormatters)
  document.emeFormatters = [];
document.emeFormatters.push(new SomeFormatter);
```

