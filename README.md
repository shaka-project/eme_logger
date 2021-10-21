# The EME Call and Event Logger Extension #

The EME Logger extension logs all Encrypted Media Extension (EME) calls and
Events. The log can be viewed in the javascript console, a separate browser page
or a downloaded file.

[EME Specification](https://w3c.github.io/encrypted-media/)

Just want to try it out? Install the EME Logger from [Chrome Web Store](https://chrome.google.com/webstore/detail/eme-call-and-event-logger/cniohcjecdcdhgmlofniddfoeokbpbpb).

## EME Formatters ##

Formatters can be used with the EME Logger extension. Formatters are separate
extensions that provide a class for key system-specific custom formatting of
data from the calls and events. Formatters should use `\n` for line breaks.
This extension will convert these to `<br>` and preserve spaces when generating
HTML.

To register a message formatter:
1. Write a class that implements isKeySystemSupported(keySystem) and the
   relevant logging methods.
2. Append an instance of the class to document.emeFormatters.

For example:
```
function SomeSystemFormatter() {
  this.isKeySystemSupported = function (keySystem) {
    return keySystem == "com.example.somesystem";
  }
  this.formatUpdateCall = function (response) {
    return "SomeSystemFormatter saw an UpdateCall with: " + response;
  }
  this.formatmessage = function (message) {
    return "SomeSystemFormatter saw a MessageEvent with: " + message;
  }
}

if (!document.emeFormatters)
  document.emeFormatters = [];
document.emeFormatters.push(new SomeSystemFormatter);
```
