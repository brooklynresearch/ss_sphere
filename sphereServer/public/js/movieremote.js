console.log("movieremote");

var playBtn = document.getElementById('play');
playBtn.onclick = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "play");
    xhr.send();
};

var playBtn = document.getElementById('pause');
playBtn.onclick = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "pause");
    xhr.send();
};

var sndParamsBtn = document.getElementById('send-params');
sndParamsBtn.onclick = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "sendparams");
    xhr.send();
};

var hideDebugBtn = document.getElementById('hide-debug');
hideDebugBtn.onclick = function() {
  console.log("hide-debug");
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "hidedebug");
	xhr.send();
  console.log("hidedebug");
};

var reloadBtn = document.getElementById('refresh');
reloadBtn.onclick = function() {
  console.log("reload");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "reload");
  xhr.send();
};

var sleepBtn = document.getElementById('sleep');
sleepBtn.onclick = function() {
  console.log("sleep");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "sleep?time=400");
  xhr.send();
};
