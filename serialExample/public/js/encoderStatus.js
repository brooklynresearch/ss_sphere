var timeBtn = document.getElementById('timing-btn');

timeBtn.onclick = function() {
  var xhr = new XMLHttpRequest();
  var timingParams = "time=" + document.getElementById('timing').value;
  xhr.open("GET", "time?"+timingParams, true);
  xhr.send();
};

var sensBtn = document.getElementById('resolution-btn');
sensBtn.onclick = function() {
  var xhr = new XMLHttpRequest();
  var resParams = "sens=" + document.getElementById('sensitivity').value;
  xhr.open("GET", "sens?"+resParams, true);
  xhr.send();
};
var maxBtn = document.getElementById('maxsteps-btn');
maxBtn.onclick = function() {
    var xhr = new XMLHttpRequest();
    var maxParams = "max=" + document.getElementById('maxsteps').value;
    xhr.open("GET", "max?"+maxParams, true);
    xhr.send();
};

var getStatusBtn = document.getElementById('getStatus-btn');
getStatusBtn.onclick = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "getstatus");
    xhr.send();
};
