jQuery(function() {

	var socket;
	var currentVid = 1; 

  var mediaType = "Images";


    function initSocket() {

        socket = new io.connect("http://192.168.1.123:8080", {
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
    }

    function toggleMediaType() {
        newType = mediaType === "Images" ? "Videos" : "Images";
        mediaType = newType;
        return newType;
    }

    function initMediaSelect() {
        $('#media-type-select').off();
        $('#media-type-select').on('click', event => {
            console.log("media type select");
            document.getElementById('media-type').innerHTML = toggleMediaType();
            if (mediaType === "Videos") {
                console.log("videos");
                $('#vid-01').attr('data-name', "Chopper");
                $('#vid-01').css('background-image', 'url(' + "css/chopper.jpg" + ')');
                $('#vid-02').hide();
                $('#vid-03').hide();
            } else {
                $('#vid-01').attr('data-name', "Liberty");
                $('#vid-01').css('background-image', 'url(' + "css/Liberty.jpg" + ')');
                $('#vid-02').show();
                $('#vid-03').show();
            }
        });
    }

    function initVids() {
        var newVid;
        $('.video').off();
        $('.video').on('click', function(event) {
            newVid = $(this).attr('data-id');
            newVidName = $(this).attr('data-name');
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
        // getCurrent();
        initMediaSelect();
        initVids();
    }

    init();

});
