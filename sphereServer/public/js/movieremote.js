var playBtn = document.getElementById('play-btn');
playBtn.onclick = function() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "play");
  xhr.send();
};

var pauseBtn = document.getElementById('pause-btn');
pauseBtn.onclick = function() {
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
	var hxr = new HMLHttpRequest();
	xhr.open("GET", "hidedebug");
	xhr.send();
};


var darkBtn = document.getElementById('toggle-dark');
hideDebugBtn.onclick = function() {
	var hxr = new HMLHttpRequest();
	xhr.open("GET", "dark");
	xhr.send();
};
