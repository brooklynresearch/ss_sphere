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

var testStreamBtn = document.getElementById('test-stream');
testStreamBtn.onclick = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "test-stream");
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

var updateBtn = document.getElementById('update');
updateBtn.onclick = function() {
  console.log("update-apk button");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "update-apk");
  xhr.send();
};

var dftVidBtn = document.getElementById('default-video');
dftVidBtn.onclick = function() {
  console.log("update-apk button");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "default-video");
  xhr.send();
};

var dftImgBtn = document.getElementById('default-image');
dftImgBtn.onclick = function() {
  console.log("default-image button");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "default-image");
  xhr.send();
};

