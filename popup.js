



$(document).ready(function(){
   $('body').on('click', 'a', function(){
     openSettings();
     return false;
   });
});


function openSettings(){
  message('Error: No value specified');

  chrome.tabs.create({ 'url': 'chrome://extensions/?options=' + chrome.runtime.id + "/add_series.html" });
}
