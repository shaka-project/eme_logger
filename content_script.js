/**
 * @fileoverview Does necessary set up for the EME Logger extension.
 */

// Load required scripts into the current web page.
var urls = ['/mutation-summary.js', '/prototypes.js', '/eme_listeners.js'];
for (var i = 0; i < urls.length; i++) {
  var mainScriptUrl = chrome.extension.getURL(urls[i]);

  // We cannot load the main script using '.src' because such scripts are not
  // guaranteed to run immediately.
  var xhr = new XMLHttpRequest();
  xhr.open('GET', mainScriptUrl, true);
  xhr.send();

  var mainScript = document.createElement('script');
  mainScript.type = 'application/javascript';
  if (xhr.status == 200) {
    mainScript.text = xhr.responseText;
    document.documentElement.appendChild(mainScript);
  }
}

// Listen for message events posted from EmeListeners, then forwards
// message to the background page.
window.addEventListener('message', function(event) {
  if (event.data.type == 'emeLogMessage')
    chrome.runtime.sendMessage({data: event.data});
});

