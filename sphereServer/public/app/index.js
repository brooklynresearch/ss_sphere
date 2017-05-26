var app = {

    // GLOBALS
    canvas: null,
    stillsFile: "1492712901828_injected.mp4",
    //stillsFile: "",
    currentVideo: "1492712901828_injected.mp4",
    lastFrameCmd: null,
    blackOut: null,
    webSocket: null,
    udpSocket: null,
    parametersTable: null,
    deviceParameters: null,
    devicePosition: "0101",
    encoderPosition: 0,
    encoderRange: 39000,
    player: null,
    

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

        document.body.style.background = "rgb(0,0,0)";
        var debugElement = document.getElementById("position-debug");
        debugElement.style.visibility = 'hidden';

        this.blackOut = document.getElementById("black-out");

        this.startWebsocket();
        this.startUdp();
        this.startVideoPlayer();
        this.startUI();

/*
        window.wakeuptimer.wakeup(
            function(result) {
                if (result.type === 'wakeup') {
                    console.log("Wakeup alarm--", result.alarm_date);
                } else if (result.type === 'set') {
                    console.log("Wakeup alarm set--", result);
                } else {
                    console.log("Unknown type--", result.alarm_date);
                    //navigator.app.exitApp();
                }
            }, 
            function(err) {
                console.log("wakeuptimer error", err);
            }, 
            {
                alarms: [{
                    type: 'onetime',
                    time: {hour: 4, minute: 20},
                    //extra: {},
                    message: "Alarm!"
                }]
            }
        );*/
    },
//=============================================================================

    /**
     * BEGIN WEBSOCKET
     */
    startWebsocket: function() {

        var serveraddress = 'http://192.168.1.200:8080';
        var socket = new io.connect(serveraddress, {
          'reconnection': true,
          'reconnectionDelay': 1000,
          'reconnectionDelayMax': 5000,
          'reconnectionAttempts': 9999
        });

        function downloadFile(filename, size, dir) {
            let assetServer = "http://192.168.1.200:8081";

            let ft = new FileTransfer();
            let timeout = Math.random() * 1000 * 200; // sometime in next 8.3 mins
            console.log("Downloading " + filename + " in " + timeout + " ms...");
            setTimeout(() => {
                console.log("Downloading " + filename + "...");
                console.log("Asset Server: ", assetServer);
                ft.download(assetServer + "/moviefiles/" + filename, dir.fullPath + filename,
                    function(newFile) {
                        console.log("Download Complete: ", newFile.toURL());
                        console.log("Size should be ", size);
                        newFile.file(function(f) {
                            if (f.size !== size) {
                                console.log("Bad File Size! Got ", newFile.size);
                                console.log("Trying again...");
                                downloadFile(filename, size, dir);
                            } else {
                                location.reload();
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

        function deleteFile(fileEntry) {
            fileEntry.remove(function() {
                console.log("Removed file: ", fileEntry.name);
            }, function(error) {
                console.log("Error removing " + fileEntry.name + ": ", error);
            }, function() {
                // File does not exist
                console.log("Error on delete. File not found: ", fileEntry.name);
            });
        }

        // WEBSOCKET MESSAGE LISTENERS
        socket.on('connect', () => {
            console.log("Connected to sphereserver");
            this.webSocket = socket;
        });
        socket.on('pos', (data) => {
            console.log("position ", data);
            if(data.length == 4){
                this.devicePosition = data;
                if(this.parametersTable && this.canvas){
                    this.newPositionParameters(this.canvas, this.parametersTable);
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
            }, 1000);
        });

        socket.on('filelist', (data) => {
            console.log("Got file list", data);
            let serverFiles = data.map(function(f) {return f.name;});
            window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, (dir) => {
                let reader = dir.createReader();
                reader.readEntries((entries) => {
                    entries.forEach((entry) => {
                        // Delete local files not on the list
                        if (serverFiles.indexOf(entry.name) === -1) {
                            console.log("Not on filelist: ", entry.name);
                            deleteFile(entry);
                        } else if (serverFiles.indexOf(entry.name) >= 0) { // We have the file
                            let index = serverFiles.indexOf(entry.name);
                            let correctSize = data[index].size;
                            entry.file(function(f) {
                                if (f.size !== correctSize) { // Delete if incomplete
                                    console.log("Wrong filesize: ", entry.name);
                                    deleteFile(entry);
                                    let filename = serverFiles[index];
                                    // give it another go
                                    downloadFile(filename, correctSize, dir);
                                }
                                else if (data[index].active) { // it should be loaded
                                    this.player.src("/storage/emulated/0/Android/data/com.ss.sphere/files/" + data[index].name);
                                    console.log("Setting active video: ", data[index].name);
                                    this.player.play();
                                    this.player.pause();
                                }
                            });
                        }
                    });
                    // Set current video file and start downloading any new ones
                    let entryNames = entries.map(function(e) {return e.name;});
                    console.log("Entries: ", entryNames);
                    //this.stillsFile = this.currentVideo; //In case nothing set 'selected'
                    //this.startVideoPlayer();
                    data.forEach((fileObj) => {
                        if (entryNames.indexOf(fileObj.name) === -1) {
                            downloadFile(fileObj.name, fileObj.size, dir);
                        }
                    });
                });
            });
        });
        // for testing and calibration
        socket.on('newtable', (data) => {
            // receive from server new parameters for posTable variable
            console.log("Recv new table");
            if(this.canvas && this.devicePosition) {
                // should be a json object
                this.parametersTable = data;
                this.newPositionParameters(this.canvas, this.parametersTable);
            }
            else {
                console.log("nothing to assign");
            }
        });
        socket.on('file', (url) => {
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
        socket.on('dark', (data) => {
            // receive from server new parameters for posTable variable
            console.log("dark: ", data);
            if(data === 'true'){
                this.blackOut.style.backgroundColor = 'black';
            }
            else{
                this.blackOut.style.backgroundColor = 'transparent';
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

            //let timeout = Math.random() * 1000 * 1; // sometime in next 8.3 mins
            //console.log("reloading in: " + timeout);
            //setTimeout(function(){
                location.reload();
            //}, timeout);
        });
        socket.on('frame', (data) => {
            if (data !== this.lastFrameCmd) {
                this.blackOut.style.backgroundColor = 'transparent';

                this.lastFrameCmd = data;
                // actually seconds in
                console.log('frame data: ', data);
                var selectedFrame = parseInt(data);
                this.changeFrame(selectedFrame);
            }
        });
        socket.on('sleep', (data) => {
            console.log("Sleep command: ", data)
            this.activateSleepMode(parseInt(data)*1000);
        });
    }, // END WEBSOCKET
//=============================================================================

    /**
     * BEGIN UDP LISTENER
     */
    startUdp: function() {

        var arrayBufferToString = function(buf) {
            var str= '';
            var ui8= new Uint8Array(buf);
            for (var i= 0 ; i < ui8.length ; i++) {
                str= str+String.fromCharCode(ui8[i]);
            }
            return str;
        };

        chrome.sockets.udp.create({}, (createInfo) => {
            let socketId = createInfo.socketId;
            this.udpSocket = socketId;
            console.log("CREATED UDP socket: ", socketId);
            chrome.sockets.udp.bind(socketId, "0.0.0.0", 55555, function(result) {
                console.log("Bind UDP: ", result);
            });
            chrome.sockets.udp.onReceive.addListener((message) => {

                let data = arrayBufferToString(message.data);
                console.log("got command: " + data);

                if (data[0] === 'f' && data.substr[1] !== this.lastFrameCmd) {
                    let frameCmd = data.substr(1);
                    this.lastFrameCmd = frameCmd;
                    if (frameCmd === '-0'){
                        this.blackOut.style.backgroundColor = 'black';
                    } else if (frameCmd === '+0') {
                        this.blackOut.style.backgroundColor = 'transparent';
                    } else {
                        this.blackOut.style.backgroundColor = 'transparent';
                        console.log('frame data: ', frameCmd);
                        var selectedFrame = parseInt(frameCmd);
                        this.changeFrame(selectedFrame);
                    }
                } else if (data === 'play') {
                    if(canvas) {
                        // player.play();
                    }
                } else if ( data === 'pause') {
                    if (this.canvas) {
                        player.pause();
                    }
                } else {
                    var posData = parseInt(data);
                    this.encoderPosition = posData;
                    // should be a mapping of encoder range to 360 then subtract 180
                    let converted = this.convertToRange(posData, [0, this.encoderRange], [0, 360.0]) - 180.0 + this.deviceParameters['long'];
                    console.log(converted);

                    if(this.canvas) {
                        this.canvas.lon = converted;
                    }
                }
            });
        });
    },// END UDP LISTENER
//=============================================================================

    /**
     * BEGIN VIDEOPLAYER
     */
    startVideoPlayer: function() {

            this.player = window.player = window.videojs('videojs-panorama-player', {}, function () {
                window.addEventListener("resize", function () {
                    this.canvas = this.player.getChild('Canvas');
                    if(this.canvas) this.canvas.handleResize();
                });
            });

            var videoElement = document.getElementById("videojs-panorama-player");
            var width = videoElement.offsetWidth;
            var height = videoElement.offsetHeight;
            console.log(width, height);
            this.player.width(width);
            this.player.height(height);

            // remove loading sign element
            var loadSign = document.getElementsByClassName("vjs-loading-spinner");
            loadSign[0].parentNode.removeChild(loadSign[0]);

            this.player.panorama({
                clickToToggle: false,
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
                    //player.play();
                }
            });

            this.player.ready(() => {
                this.player.width(screen.width);
                this.player.height(screen.height);
                this.player.src("/storage/emulated/0/Android/data/com.ss.sphere/files/" + this.stillsFile);
                //this.player.play();
                //this.player.pause();
                console.log("is ready");
                this.canvas = this.player.getChild('Canvas');
            });


    }, // END VIDEOPLAYER
//=============================================================================

    /**
     * BEGIN SHARED UTILITIES
     */
    convertToRange: function(value, srcRange, dstRange){
        // value is outside source range return
        if (value < srcRange[0] || value > srcRange[1]){
            return NaN;
        }
        var srcMax = srcRange[1] - srcRange[0],
        dstMax = dstRange[1] - dstRange[0],
        adjValue = value - srcRange[0];

        return (adjValue * dstMax / srcMax) + dstRange[0];
    },

    newPositionParameters: function(canvas, json){
        var parameters = json[this.devicePosition];
        this.deviceParameters = parameters;
        // this needs to change to actual equation taking into account current encoder readings
        this.canvas.lon = this.convertToRange(this.encoderPosition, [0, this.encoderRange], [0, 360.0]) - 180.0 + parameters['long'];
        this.canvas.lat = parameters['lat'];
        this.canvas.camera.fov = parameters['fov'];
        this.canvas.camera.updateProjectionMatrix();
        console.log("updated position parameters for: " + this.devicePosition);
    },

    changeFrame: function(selectedFrame) {
        this.player.pause();
        console.log(selectedFrame);
        this.player.currentTime(selectedFrame);
        this.player.play();
        setTimeout(function(){
            this.player.pause();
        }, 2000);
    },// END SHARED UTILITIES
//=============================================================================

    /**
     * BEGIN SLEEP MODE
     */
    activateSleepMode: function(sleepTime) {
        console.log("Entering Sleep Mode ", sleepTime);

        navigator.app.exitApp();

    },// END SLEEP MODE
//=============================================================================

    /**
     * BEIGN UI
     */
    startUI: function() {
        // Assignment and debug block

            var that = this;
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
                    newPos = '';
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

                $('#confirm').click((event) => {
                    if (newPos.length == 4) { //Don't conirm with incomplete position
                        //Send the new position somewhere
                        that.webSocket.emit('register position', newPos);
                        //Can add an ajax loader and confirm if needed
                        currentPos = newPos;
                        that.devicePosition = currentPos;
                        //maybe on success you confirm with?:
                        getPosition();

                        // provided we have a table
                        if(that.parametersTable && that.canvas){
                            that.newPositionParameters(that.canvas, that.parametersTable);
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

            function init() {
                getPosition();
                initSecret();
                initAssign();
            }
            init();
 
    },// END UI
//=============================================================================

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

app.initialize();
