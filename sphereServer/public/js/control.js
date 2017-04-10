var playBtn = document.getElementById('play-btn');
playBtn.onclick = function() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/play");
  xhr.send();
};

var pauseBtn = document.getElementById('pause-btn');
pauseBtn.onclick = function() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/pause");
  xhr.send();
};

