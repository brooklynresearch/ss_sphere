var app = {
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {
        this.receivedEvent('deviceready');

        $(".app").load("http://192.168.1.200:3000/app/home.html", this.homeLoaded.bind(this));
        StatusBar.hide();
        window.plugins.insomnia.keepAwake();
    },

    homeLoaded: function() {

        var devicePosition;
        var deviceParameters;
        var parametersTable;
        var currentVideo;

        var encoderPosition = 0;
        var encoderRange = 36000;

        var canvas;
        var player;
        var videoGrab;

        var devicePosition = "0101";
        var assetServer = "http://192.168.1.200:8081";

        function newPositionParameters(canvas, json){
            var parameters = json[devicePosition];
            deviceParameters = parameters;
            // this needs to change to actual equation taking into account current encoder readings
            canvas.lon = convertToRange(encoderPosition, [0, encoderRange], [0, 360.0]) - 180.0 + parameters['long'];
            canvas.lat = parameters['lat'];
            canvas.camera.fov = parameters['fov'];
            canvas.camera.updateProjectionMatrix();
            console.log("updated position parameters for: " + devicePosition);
        }

        function downloadFile(filename, size, dir) {
            let ft = new FileTransfer();
            let timeout = Math.random() * 1000 * 200; // sometime in next 8.3 mins
            console.log("Downloading " + filename + " in " + timeout + " ms...");
            setTimeout(function() {
                console.log("Downloading " + filename + "...");
                ft.download(assetServer + "/moviefiles/" + filename, dir.fullPath + filename, function(newFile) {
                        console.log("Download Complete: ", newFile.toURL());
                        console.log("Size should be ", size);
                        newFile.file(function(f) {
                            if (f.size !== size) {
                                console.log("Bad File Size! Got ", newFile.size);
                                console.log("Trying again...");
                                downloadFile(filename, size, dir);
                            }
                        });
                    },
                    function(err) {
                        console.log("Error Downloading File: ", err);
                        console.log("Trying again...");
                        downloadFile(filename, size, dir);
                    }
                );
            }, timeout);
        }

        document.body.style.background = "rgb(0,0,0)";

        var serveraddress = 'http://192.168.1.200:8080';
        var socket = new io.connect(serveraddress, {
          'reconnection': true,
          'reconnectionDelay': 500,
          'reconnectionDelayMax': 1000,
          'reconnectionAttempts': 999
        });

        // WEBSOCKET
        socket.on('connect', function() {
            console.log("Connected to sphereserver");
        });
        socket.on('pos', function(data) {
            console.log("position ", data);
            if(data.length == 4){
                devicePosition = data;
                if(parametersTable && canvas){
                    newPositionParameters(canvas, parametersTable);
                }
            }
            document.getElementById("position-debug").innerHTML = "Position: " + data;
            
        });
        socket.on('newpos', function(data) {
            console.log("New position ", data);
            document.getElementById("position-debug").innerHTML = "Position: " + data;
        });
        socket.on('switch video', function(data) {
            //Load the video and start playing
            if(currentVideo !== data){
                videoGrab.src = "/storage/emulated/0/Android/data/com.ss.sphere/files/" + data;
                currentVideo = data;
            }
            player.currentTime(0);
            player.play();
            setTimeout(function(){
                player.pause();
            }, 1000);

            // should this emit something to server and have server check
            // if everyone got the switch video notice before a udp play send?
            // player.play();
            // player.pause();
        });

        socket.on('filelist', function(data) {
            console.log("Got file list", data);
            let serverFiles = data.map(function(f) {return f.name});
            window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(dir){
                let reader = dir.createReader();
                reader.readEntries(function(entries) {
                    // Delete local files not on the list
                    entries.forEach(function(entry) {
                        if (serverFiles.indexOf(entry.name) === -1) {
                            entry.remove(function() {
                                console.log("Removed file: ", entry.name);
                            }, function(error) {
                                console.log("Error removing file: ", entry.name);
                            }, function() {
                                // File does not exist
                            });
                        }
                    });
                    // Download any new server files
                    let entryNames = entries.map(function(e) {return e.name});
                    console.log("Entries: ", entryNames);
                    data.forEach(function(fileObj) {
                        if (entryNames.indexOf(fileObj.name) === -1) {
                            downloadFile(fileObj.name, fileObj.size, dir);
                        }
                    });
                });
            });
        });
        // for testing and calibration
        socket.on('newtable', function(data) {
            // receive from server new parameters for posTable variable
            console.log("Recv new table");
            if(canvas && devicePosition) {
                // should be a json object
                parametersTable = data;
                newPositionParameters(canvas, parametersTable);
            }
            else {
                console.log("nothing to assign");
            }
        });
        socket.on('file', function(url) {
            var fileUrl = url;
            var filename = fileUrl.split('/').pop();
            window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(dir) {
                console.log("Downloading...");
                var fileTransfer = new FileTransfer();
                fileTransfer.download(fileUrl, dir.fullPath + filename, function(file) {
                        console.log("Download Complete: ", file.toURI());
                    },
                    function(err) {
                        console.log("Error Downloading File: ", err);
                    }
                );
            });
        });
        socket.on('dark', function(data) {
            // receive from server new parameters for posTable variable
            console.log("dark: ", data);
            var blackOut = document.getElementById("black-out");
            if(data === true){
                blackOut.style.backgroundColor = 'black';
            }
            else{
                blackOut.style.backgroundColor = 'transparent';
            }
        });
        socket.on('hidedebug', function(data) {
            console.log("hidedebug: ", data);
            var debugElement = document.getElementById("position-debug");
            if(data === true){
                debugElement.style.visibility = 'hidden';
            }
            else{
                debugElement.style.visibility = 'visible';
            }
        });
        socket.on('reload', function(data) {
            
            let timeout = Math.random() * 1000 * 1; // sometime in next 8.3 mins
            console.log("reloading in: " + timeout);
            setTimeout(function(){
                location.reload();
            }, timeout);
        });


        var arrayBufferToString = function(buf) {
            var str= '';
            var ui8= new Uint8Array(buf);
            for (var i= 0 ; i < ui8.length ; i++) {
                str= str+String.fromCharCode(ui8[i]);
            }
            return str;
        }

        var convertToRange = function(value, srcRange, dstRange){
            // value is outside source range return
            if (value < srcRange[0] || value > srcRange[1]){
                return NaN; 
            }

            var srcMax = srcRange[1] - srcRange[0],
            dstMax = dstRange[1] - dstRange[0],
            adjValue = value - srcRange[0];

            return (adjValue * dstMax / srcMax) + dstRange[0];
        }

        // UDP Listener

        chrome.sockets.udp.create({}, function(createInfo) {
            let socketId = createInfo.socketId;
            console.log("CREATED UDP socket: ", socketId);
            chrome.sockets.udp.bind(socketId, "0.0.0.0", 55555, function(result) {
                console.log("Bind UDP: ", result);
            });
            chrome.sockets.udp.onReceive.addListener(function(message) {

                let data = arrayBufferToString(message.data);
                console.log("got command: " + data);

                switch(data) {
                    case 'play':
                        if(canvas) {
                            player.play();
                        }
                        if (socket) {
                            socket.emit('ACK', "play");
                        }
                        break;
                    case 'pause':
                        if (canvas) {
                            player.pause();
                        }
                        if (socket) {
                            socket.emit('ACK', "pause");
                        }
                        break;
                    default:
                        //let converted = convertToRange(data, [0,36000], [0,255]);
                        var posData = parseInt(data);
                        encoderPosition = posData;
                        // should be a mapping of encoder range to 360 then subtract 180
                        let converted = convertToRange(posData, [0, encoderRange], [0, 360.0]) - 180.0 + deviceParameters['long'];
                        console.log(converted)

                        if(canvas) {
                            canvas.lon = converted;
                        }
                }
            });
        });

        function isMobile() {

            // Panorama player check

            var check = false;
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
                return check;
            }
            (function(window, videojs) {
                player = window.player = videojs('videojs-panorama-player', {}, function () {
                    window.addEventListener("resize", function () {
                        canvas = player.getChild('Canvas');
                        if(canvas) canvas.handleResize();
                    });
                });

                var videoElement = document.getElementById("videojs-panorama-player");
                var width = videoElement.offsetWidth;
                var height = videoElement.offsetHeight;
                console.log(width, height);
                player.width(width), player.height(height);

                // remove loading sign element
                var loadSign = document.getElementsByClassName("vjs-loading-spinner");
                loadSign[0].parentNode.removeChild(loadSign[0]);

                player.panorama({
                    clickToToggle: (!isMobile()),
                    autoMobileOrientation: false,
                    initFov: 30,
                    maxFov: 60,
                    minFov: 5,
                    initLat: 20,
                    initLon: 10,
                    // clickAndDrag: false, // this disables all camera movement, instead, we should have a transparent div covering the entire thing
                    backToVerticalCenter: false,
                    backToHorizonCenter: false,
                    VREnable: false,
                    showNotice: false,
                    callback: function () {
                        if(!isMobile()) player.play();
                    }
                });

                player.ready(function(){
                    player.width(screen.width), player.height(screen.height);
                    player.play();
                    player.pause();
                    console.log("is ready");
                    canvas = player.getChild('Canvas');
                    videoGrab = document.getElementById("videojs-panorama-player_html5_api");
                });

            }(window, window.videojs));

            // Assignment and debug block

            jQuery(function() {
                currentPos = 1234; //If you are seeing this on the front something is wrong

                function getPosition() {
                    // something that gets a posiiton in a four digit format: 0101 for row 1 column 01 or somehting you prefer.
                    var pos = String(currentPos); //replace currentPos here with what you get
                    var row = pos.substring(0,2);
                    var col = pos.slice(-2);

                    $('#pos-row').text(row);
                    $('#pos-col').text(col);
                }


                function initSecret() {

                    var tapCount = 0;

                    $('#hidden-btn').click(function(event) {
                        tapCount ++;
                        if (tapCount == 3) {
                            $('#re-assn-wrap').fadeIn('fast', function() {
                                tapCount = 0;
                                $('#hidden-btn').hide();
                            });
                        }

                    });

                    $('#exit').click(function(event) {
                        $('#re-assn-wrap').fadeOut('fast', function() {
                                $('#hidden-btn').show();
                            });
                    });
                }


                function initAssign() {

                    var newPos = '';
                    
                    $('#re-assn').click(function(event) {
                        newPos = ''
                        $('.view-mode').hide();
                        $('.assn-mode').show();

                        $('#pos-row').text("__");
                        $('#pos-col').text("__");
                    });

                    
                    $('.key').click(function(event) {

                        if (newPos.length < 4) {

                            var input = $(this).attr('data-id');
                            newPos += input;
                            console.log(newPos);
                            if (newPos.length < 3) {
                                $('#pos-row').text(newPos);
                            }
                            else {
                                var newCol = newPos.substr(2);
                                $('#pos-col').text(newCol);
                            }

                        }
                    });

                    $('#confirm').click(function(event) {
                        if (newPos.length == 4) { //Don't conirm with incomplete position
                            //Send the new position somewhere
                            socket.emit('register position', newPos);
                            //Can add an ajax loader and confirm if needed
                            currentPos = newPos;
                            devicePosition = currentPos;
                            //maybe on success you confirm with?:
                            getPosition();

                            // provided we have a table
                            if(parametersTable && canvas){
                                newPositionParameters(canvas, parametersTable);
                            }
                            //then:
                            $('.view-mode').show();
                            $('.assn-mode').hide();
                        }
                    });

                    $('#cancel').click(function(event) {

                        newPos = '';

                        getPosition(); //in case input was not completed revert back to current position

                        $('.view-mode').show();
                        $('.assn-mode').hide();
                    });     

                }


                function initDebug() {
                    $('#debug').click(function(event) {
                        //The world is your oyster
                    });
                }


                function initRefresh() {
                    $('.refresh').click(function(event) {
                        //So Refreshing!
                    });
                }
                

                function init() {
                    getPosition();
                    initSecret();
                    initAssign();
                    // initDebug();
                    // initRefresh();
                }


                init();

            });

        },

    // Update DOM on a Received Event
    receivedEvent: function(id) {

        console.log('Received Event: ' + id);
    }
};

app.initialize();
