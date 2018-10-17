console.log("movieremote");

var sndParamsBtn = document.getElementById('send-params');
sndParamsBtn.onclick = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "sendparams");
    xhr.send();
};

var updateBtn = document.getElementById('update');
updateBtn.onclick = function() {
  console.log("update-apk button");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "update-apk");
  xhr.send();
};

var slider = document.getElementById('rotation-slider');
slider.oninput = function() {
    console.log("onInput");
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "rotate?val="+slider.value);
    xhr.send();
}

