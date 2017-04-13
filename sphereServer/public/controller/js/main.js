jQuery(function() {

	var socket;
	var currentVid = 1; 


    function initSocket() {

        socket = new io.connect("http://192.168.1.200:8080", {
          'reconnection': true,
          'reconnectionDelay': 500,
          'reconnectionDelayMax': 1000,
          'reconnectionAttempts': 999
        });

        // in case there is a new order of images we need to
        socket.on('order', function(msg) {
        	console.log("order received");
        	console.log(msg);
        });
    }

	function getCurrent() {
		//something that gets the currently playing video, returns currentVid

		setCurrent(currentVid);

	}

	function setCurrent(vid) {

		var current = vid;

		$('#vid-0'+vid).addClass('active').siblings().removeClass('active');

		socket.emit('set video', current);
		        
	}

	function initVids() {
		var newVid;
		$('.video').click(function(event) {
			newVid = $(this).attr('data-id');
			$('.view-mode').addClass('disabled');
			$('#message').text('Activate video '+newVid+' ?');
			$('#confirm-wrap').fadeIn('fast', function() {
				$('#confirm').click(function(event) {
					//Send command to switch the video 
					setCurrent(newVid); //fire this on a confirmed switch
					currentVid = newVid; //fire this on a confirmed switch
					$('#confirm-wrap').fadeOut('fast', function() { //fire this on a confirmed switch
						$('.view-mode').removeClass('disabled');
					});
				});
				$('#cancel').click(function(event) {
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
    	initVids();
 
    }


    init();

});
