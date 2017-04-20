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
        socket.on('fileList', function(msg) {
        	console.log("order received");
        	console.log(msg);

        	var selectCount = 0;

        	// for(var i=0; i < 3; ++i){
        	// 	var index = 1 + 1;
        	// 	$('#vid-0'+index).attr('data-id', msg['']['name']);
        	// 	$('#vid-0'+index).css('background-image', 'url(' + msg[i]['img'] + ')');
        	// }
        });
    }

	function getCurrent() {
		//something that gets the currently playing video, returns currentVid

		setCurrent(currentVid);

	}

	function setCurrent(vid) {

		var current = vid;

		$('[data-id="' + vid + '"]').addClass('active').siblings().removeClass('active');
		console.log("emitting set video");
		socket.emit('set video', current);
		        
	}

	function initVids() {
		var newVid;
		$('.video').off();
		$('.video').on('click', function(event) {
			newVid = $(this).attr('data-id');
			$('.view-mode').addClass('disabled');
			$('#message').text('Activate video '+ $(this).attr('data-name') +' ?');
			$('#confirm-wrap').fadeIn('fast', function() {
				$('#confirm').off();
				$('#confirm').on('click', function(event) {
					//Send command to switch the video 
					setCurrent(newVid); //fire this on a confirmed switch
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
    	initVids();
 
    }


    init();

});
