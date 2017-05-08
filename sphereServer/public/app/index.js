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
        var encoderRange = 39000;

        var canvas;
        var player;
        var videoGrab;

        var devicePosition = "0101";
        var assetServer = "http://192.168.1.200:8081";
        var stillsFile = "1492712901828_injected.mp4";
        var currentVideo = "1492712901828_injected.mp4";

        var debugElement = document.getElementById("position-debug");
        debugElement.style.visibility = 'hidden';

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

        var lastFrameCmd;

        function changeFrame(selectedFrame) {
            player.pause();
            console.log(selectedFrame);
            player.currentTime(selectedFrame);
            player.play();
            setTimeout(function(){
                player.pause();
                // player.currentTime(10);

                // setTimeout(function(){
                //     player.pause();

                // }, 1000);
            }, 2000);

        }

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
            player.pause();

            if(currentVideo !== data){

                player.src("/storage/emulated/0/Android/data/com.ss.sphere/files/" + data);
                currentVideo = data;
            }
            player.currentTime(0);
            player.play();
            setTimeout(function(){
                player.pause();
                // player.currentTime(10);

                // setTimeout(function(){
                //     player.pause();

                // }, 1000);
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
            if(data === 'true'){
                blackOut.style.backgroundColor = 'black';
            }
            else{
                blackOut.style.backgroundColor = 'transparent';
            }
        });
        socket.on('hidedebug', function(data) {
            console.log("hidedebug: ", data);
            debugElement = document.getElementById("position-debug");
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
        socket.on('frame', function(data) {
            if (data !== lastFrameCmd) {
                var blackOut = document.getElementById("black-out");
                blackOut.style.backgroundColor = 'transparent';

                lastFrameCmd = data;
                // actually seconds in
                console.log('frame data: ', data);
                var selectedFrame = parseInt(data);
                changeFrame(selectedFrame);
            }
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

                if (data[0] === 'f') {
                    let frameCmd = data.substr(1);
                    if (frameCmd !== lastFrameCmd) {
                        lastFrameCmd = frameCmd;
                        if (frameCmd === '-0'){
                            var blackOut = document.getElementById("black-out");
                            blackOut.style.backgroundColor = 'black';
                        } else if (frameCmd === '+0') {
                            var blackOut = document.getElementById("black-out");
                            blackOut.style.backgroundColor = 'transparent';
                        } else {
                            var blackOut = document.getElementById("black-out");
                            blackOut.style.backgroundColor = 'transparent';

                            console.log('frame data: ', frameCmd);
                            var selectedFrame = parseInt(frameCmd);
                            changeFrame(selectedFrame);
                        }
                    }
                }

                else {

                    switch(data) {
                        case 'play':
                            if(canvas) {
                                // player.play();
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
                }
            });
        });

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
                    player.src("/storage/emulated/0/Android/data/com.ss.sphere/files/" + stillsFile);
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
