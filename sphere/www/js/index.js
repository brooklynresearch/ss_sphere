/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
        StatusBar.hide();

        var serveraddress = 'http://192.168.1.200:8080';
        //var socket = new io.connect('http://192.168.0.153:3000', {
        var socket = new io.connect(serveraddress, {
          'reconnection': true,
          'reconnectionDelay': 500,
          'reconnectionDelayMax': 1000,
          'reconnectionAttempts': 999
        });

        socket.on('connect', function() {
            console.log("Connected to sphereserver");
        });
        socket.on('pos', function(data) {
            console.log("position ", data);
            document.getElementById("position-debug").innerHTML = "Position: " + data;
        });
        socket.on('newpos', function(data) {
            console.log("New position ", data);
            document.getElementById("position-debug").innerHTML = "Position: " + data;
        });
        socket.on('rotate', function(data) {
            console.log("Rotate ", data);
            document.getElementById("rotation-debug").innerHTML = "Rotation: " + data;
        });

        document.getElementById('change-position-debug-1').onclick = function() {
            socket.emit('register position', -420);
        };

        document.getElementById('change-position-debug-2').onclick = function() {
            socket.emit('register position', -666);
        };
        // currentVideo to load, could be an index for an array of video names
        // likely will want to figure out a way to load from camera resources rather than www assets folder
        // as we'll have to save new ones anyhow as they come in
        var currentVideo;
        // variable later for tablet position placement
        var position;

        function isMobile() {
            var check = false;
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
                return check;
            }
            (function(window, videojs) {
                var player = window.player = videojs('videojs-panorama-player', {}, function () {
                    window.addEventListener("resize", function () {
                        var canvas = player.getChild('Canvas');
                        console.log(canvas);
                        if(canvas) canvas.handleResize();
                    });
                });

                var canvas;
                var videoElement = document.getElementById("videojs-panorama-player");
                var width = videoElement.offsetWidth;
                var height = videoElement.offsetHeight;
                console.log(width, height);
                player.width(width), player.height(height);
                player.panorama({
                    clickToToggle: (!isMobile()),
                    autoMobileOrientation: true,
                    initFov: 30,
                    initLat: 20,
                    initLon: 10,
                    backToVerticalCenter: false,
                    backToHorizonCenter: false,
                    VREnable: isMobile(),
                    NoticeMessage: (isMobile())? "please drag and drop the video" : "please use your mouse drag and drop the video",
                    callback: function () {
                        if(!isMobile()) player.play();
                    }
                });

                console.log("requesting fullscreen");
                console.log(player);
                // will need to figure out how to spoof user interaction to force fullscreen call on startup
                player.requestFullscreen();

                player.ready(function(){
                    player.play();
                    player.pause();
                    player.currentTime(30);
                    console.log("is ready");
                    $(".vjs-fullscreen-control").click();
                    console.log("clicked");
                    canvas = player.getChild('Canvas');
                    console.log(canvas);

                });

                document.addEventListener('keydown', function(event) {
                
                    console.log("key pressed");
                    console.log(event.keyCode);
                    console.log("width: " + width);
                    console.log("canvas next");
                    console.log(canvas);

                    switch(event.keyCode){
                        case 37:
                            // key left, camera manipulation for longitude, latitude is canvas.lat
                            console.log(canvas.lon);
                            canvas.lon = canvas.lon - 0.1;
                            console.log("pressed left");
                            console.log(canvas.lon);
                            break;
                        case 39:
                            // key right, camera manipulation
                            canvas.lon = canvas.lon + 0.1;
                            console.log("pressed right");
                            break;
                        default:
                            console.log("pressed: " + event.keyCode);
                            break;
                    }

                });

                player.on("VRModeOn", function(){
                    if(!player.isFullscreen())
                        player.controlBar.fullscreenToggle.trigger("tap");
                });
            }(window, window.videojs));
        },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        // var parentElement = document.getElementById(id);
        // var listeningElement = parentElement.querySelector('.listening');
        // var receivedElement = parentElement.querySelector('.received');

        // listeningElement.setAttribute('style', 'display:none;');
        // receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

app.initialize();
