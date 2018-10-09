jQuery(function() {

	var socket;
	var currentVid = 1; 

  var mediaType = "Images";


    function initSocket() {

        let old = "http://192.168.1.123:8080";
        let host = window.location.hostname + ":8080";
        socket = new io.connect(host, {
          'reconnection': true,
          'reconnectionDelay': 500,
          'reconnectionDelayMax': 1000,
          'reconnectionAttempts': 999
        });

        // in case there is a new order of images we need to
        socket.on('fileList', function(msg) {
        console.log("order received");
        console.log(msg);

        var selectCount = 0;

        // for(var i=0; i < 3; ++i){
        // var index = 1 + 1;
        // $('#vid-0'+index).attr('data-id', msg['']['name']);
        // $('#vid-0'+index).css('background-image', 'url(' + msg[i]['img'] + ')');
        // }
        });
    }

    function getCurrent() {
    //something that gets the currently playing video, returns currentVid

        setCurrent(currentVid);

    }

    function setCurrent(vidId, vidName) {

        var current = vidId;

        $('[data-id="' + vidId + '"]').addClass('active').siblings().removeClass('active');
        console.log("emitting set video");
        socket.emit('set media', {"type": mediaType, "name": vidName});
        if (mediaType === "Videos" && vidName !== "black screen") {
            showPlaybackControls();
        }
    }

    function showPlaybackControls() {
        $('#playback-controls').css('display', 'inline-block');
        $('#play-pause-btn').on('click', event => {
            let state = $("#play-pause-btn").attr('data-state');
            $("#play-pause-btn").attr('data-state', state === "pause" ? "play" : "pause");

            var xhr = new XMLHttpRequest();
            xhr.open("GET", "play");
            xhr.send();
        })
        $('#stop-btn').on('click', event => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "stop");
            xhr.send();
        })
    }

    function toggleMediaType() {
        $('#playback-controls').css('display', 'none');
        newType = mediaType === "Images" ? "Videos" : "Images";
        mediaType = newType;
        return newType;
    }

    function updateButtons() {
        let type = mediaType === "Images" ? "imagefiles" : "moviefiles";
        $('#vid-wrap').children('div').each((i, el) => {
            if ($(el).attr('data-dir') === type || $(el).attr('data-name') === 'black screen') {
                $(el).show();
            } else {
                $(el).hide();
            }
        });
    }

    /*
    function initMediaSelect() {
        $('#media-type-select').off();
        $('#media-type-select').on('click', event => {
            console.log("media type select");
            document.getElementById('media-type').innerHTML = toggleMediaType();
            updateButtons();
        });
    }*/

    function loadThumbs() {
        $('#vid-wrap').children('div').each((i, el) => {
            let name = $(el).attr('data-name').split('.')[0];
            $(el).css("background-image", "url(thumbs/" + name + ".jpg)")
        });
    }

    function initVids() {
        var newVid;
        $('.video').off();
        $('.video').on('click', function(event) {
            newVid = $(this).attr('data-id');
            newVidName = $(this).attr('data-name').split('.')[0];
            $('.view-mode').addClass('disabled');
            $('#message').text('Activate '+ newVidName +' ?');
            $('#confirm-wrap').fadeIn('fast', function() {
                $('#confirm').off();
                $('#confirm').on('click', function(event) {
                    //Send command to switch the video 
                    setCurrent(newVid, newVidName); //fire this on a confirmed switch
                    currentVid = newVid; //fire this on a confirmed switch
                    $('#confirm-wrap').fadeOut('fast', function() { //fire this on a confirmed switch
                        $('.view-mode').removeClass('disabled');
                    });
                });
                $('#cancel').off();
                $('#cancel').on('click', function(event) {
                    $('#confirm-wrap').fadeOut('fast', function() {
                        $('.view-mode').removeClass('disabled');
                    });
                });
            });
        });
    }

    function init() {
        initSocket();
        initMediaSelect();
        loadThumbs();
        initVids();
        updateButtons();
    }

    init();

});
