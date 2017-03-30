jQuery(function() {

    var socket;
    var unlocked = false;
    var mode = 1;


    function initSocket() {

        socket = new io.connect(null, {
          'reconnection': true,
          'reconnectionDelay': 500,
          'reconnectionDelayMax': 1000,
          'reconnectionAttempts': 999
        });

        socket.on('gimme', function(msg) {
          // document.getElementById('curpos').innerHTML = "Position: " + msg;
          console.log("got positions");
          console.log(msg);
          var intArray = msg.split(" ").map(Number).filter(Boolean);
          console.log(intArray);
          
          for (i=0;i<intArray.length;i++) {
            console.log("Key is "+i+" and Value is "+intArray[i]);
            loadPositions(intArray[i]);
          }

        });

        socket.on('win', function(msg) {
                
            $('#win-confirm').removeClass('confirm-ajax confirm-success confirm-fail'); //in case it's been opened and closed

            $('#win-confirm-title-2').text('READY TO END CURRENT ROUND?');

            $('#win-confirm').show('fast', function() {

                $('.win-conf-msg').show();

                $('#win-enum-yes').off();
                $('#win-enum-yes').on('click',function(event) { 

                    socket.emit('win', 'Win!'); // Time to win

                    $('.win-conf-msg').hide();

                    //Success:
                    $('#win-confirm').addClass('confirm-success').removeClass('confirm-ajax');
                    setTimeout(function(){
                      $('#win-confirm').fadeOut('fast', function() {
                              // reLock();
                        });
                    }, 1000);

                });

                $('#enum-no').off();
                $('#enum-no').on('click', function(event) { 

                    $('#win-confirm').fadeOut('fast', function() {
                            // reLock();
                    });
                });

                $(document).mouseup(function (e) { //hide if clicked outside confirm
        
                    var container = $('#win-confirm');

                    if (!container.is(e.target) // if the target of the click isn't the container...
                        && container.has(e.target).length === 0) // ... nor a descendant of the container
                    {
                        container.hide();
                        // $('.tab').removeClass('active-tab');
                    }
                });
            });
        });

        socket.emit('gimme', 'positions');
    }

    function loadPositions(posNumber) {
        console.log(posNumber);
        var currentTab = $('[data-id="'+posNumber+'"]').filter('.tab');
        currentTab.addClass('marked');
    }

    function toggleLock() {

        if ( unlocked == false ) {
            $('.tab').addClass('tab-lock'); //locks tabs by default from master var
        }

        $('#lock').click(function(event) {
            $('#lock').toggleClass('unlock');
            if ( $('#lock').hasClass('unlock') ) {
                unlocked = true;
                $('.tab').removeClass('tab-lock');
            }
            else {
                unlocked = false;
                $('.tab').addClass('tab-lock');
            }
        });
    }

    function reLock() {
        unlocked = false;
        $('.tab').addClass('tab-lock');
        $('#lock').removeClass('unlock');
    }

    function debugMode() {

        unlocked = true;

        $('.tab').removeClass('tab-lock');
        $('#lock').addClass('unlock');

        $('.tab').off();
        $('.tab').on('click', function(event) {
            pos = $(this).attr('data-id');
            currentTab = $(this);

            if ( !$(this).hasClass('marked') ) {
                console.log(pos);
                currentTab.addClass('marked');
                socket.emit('activate position', pos); //activate tab
            }
            else {
                currentTab.removeClass('marked'); //allow toggle backs for debug mode
                socket.emit('activate position', pos);
            }
            
        });
    }

    function activateTab() {

        $('.tab').off();
        $('.tab').on('click', function(event) {

            if ( unlocked == true && !$(this).hasClass('marked')) {

                pos = $(this).attr('data-id');

                currentTab = $(this);
            
                console.log(pos);

                $('#confirm').removeClass('confirm-ajax confirm-success confirm-fail'); //in case it's been opened and closed

                $('#confirm-title-2').text('ACTIVATE PRIZE FOR POSITION ' + pos + '?');

                // $(this).addClass('active-tab').siblings('.tab').removeClass('active-tab');

                $('#confirm').show('fast', function() {

                    $('.conf-msg').show();

                    $('#enum-yes').off();
                    $('#enum-yes').on('click',function(event) { 

                        socket.emit('activate position', pos); //activate tab

                        currentTab.addClass('marked');

                        $('.conf-msg').hide();

                        //Ajax or comms:
                        // $('#confirm').addClass('confirm-ajax');

                        //Success:
                        $('#confirm').addClass('confirm-success').removeClass('confirm-ajax');
                        setTimeout(function(){
                          $('#confirm').fadeOut('fast', function() {
                              // reLock();
                          });
                        }, 1000);

                        //Fail:
                        // $('#confirm').addClass('confirm-fail').removeClass('confirm-ajax');
                        // setTimeout(function(){
                        //   $('#confirm').fadeOut('slow', function() {
                              
                        //   });
                        // }, 1000);


                    });

                    $('#enum-no').off();
                    $('#enum-no').on('click', function(event) { 

                        $('#confirm').fadeOut('fast', function() {
                            // reLock();
                        });
                    });

                    $(document).mouseup(function (e) { //hide if clicked outside confirm
        
                        var container = $('#confirm');

                        if (!container.is(e.target) // if the target of the click isn't the container...
                            && container.has(e.target).length === 0) // ... nor a descendant of the container
                        {
                            container.hide();
                            // $('.tab').removeClass('active-tab');
                        }
                    });
                    
                    
                });
            }
            
        });

    }

    function config() {

        $('#gear').off();
        $('#gear').on('click', function(event) {
            
            $('#config').toggle('fast');

            $(document).mouseup(function (e) { //hide if clicked outside confirm

                var container = $('#config');

                if (!container.is(e.target) // if the target of the click isn't the container...
                    && container.has(e.target).length === 0) // ... nor a descendant of the container
                {
                    container.hide();
                    
                }
            });
        });

    }

    function configConfirm() {

        $('.config-item').off();
        $('.config-item').on('click', function(event) {

            var configMsg = $(this).attr('data-msg');

            var configId = +$(this).attr('data-id');

            $('#config-confirm').removeClass('confirm-ajax confirm-success confirm-fail'); //in case it's been opened and closed

            $('#config').toggle('fast');

            $('#config-confirm-title-2').text(configMsg + ' ?');

            $('#config-confirm').show('fast', function() {

                $('.config-conf-msg').show();

                $('#config-enum-yes').off();
                $('#config-enum-yes').on('click', function(event) { 

                    $('.config-conf-msg').hide();

                    switch(configId) {
                        case 1:
                            //some socket things
                            if(mode == 2){
                                $('#mode-status').text('Current Mode: 1');
                                socket.emit('mode', '1');
                                socket.emit('ctrl', 'reset positions');
                                $('.tab').removeClass('marked');
                                console.log('Mode 1 Activated');
                                mode = 1;
                                break;
                            }
                            else break;
                        case 2:
                            //some socket things
                            if(mode == 1){
                                $('#mode-status').text('Current Mode: 2');
                                socket.emit('mode', '2');
                                socket.emit('ctrl', 'reset positions');
                                $('.tab').removeClass('marked');
                                console.log('Mode 2 Activated');
                                mode = 2;
                                break;
                            }
                            else break;
                        case 3:
                            socket.emit('ctrl', 'reset positions');
                            $('.tab').removeClass('marked');
                            console.log('Reset All Positions');
                            break;
                        case 4:
                            //some socket things
                            socket.emit('win', 'win condition');
                            console.log('Matrix Mode Activated');
                            break;
                        case 5:
                            // toggle black
                            socket.emit('black', 'toggle black');
                            console.log('Display Toggle');
                            break;
                    }

                    $('#config-confirm').addClass('confirm-success').removeClass('confirm-ajax');
                    setTimeout(function(){
                      $('#config-confirm').fadeOut('fast', function() {
                          
                      });
                    }, 1000);

                });

                $('#config-enum-no').off();
                $('#config-enum-no').on('click', function(event) { 

                    $('#config-confirm').fadeOut('fast', function() {
                        
                    });
                });

                $(document).mouseup(function (e) { //hide if clicked outside confirm
    
                    var container = $('#config-confirm');

                    if (!container.is(e.target) // if the target of the click isn't the container...
                        && container.has(e.target).length === 0) // ... nor a descendant of the container
                    {
                        container.hide();

                    }
                });
                
            });
            
        });
    }



    function init() {

        initSocket();
        activateTab(); //comment out if debug mode
        // debugMode();
        toggleLock();
        config();
        configConfirm();

    }



    init();

});