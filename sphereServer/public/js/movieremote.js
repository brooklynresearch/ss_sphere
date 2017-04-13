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
