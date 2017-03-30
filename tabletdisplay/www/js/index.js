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
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        document.addEventListener('onresume', this.onResume, false);
        StatusBar.hide();
        window.plugins.insomnia.keepAwake();

        console.log("start");
        // var selectPos = document.getElementById('position');

        // for (var i = 1; i <= 50; i++){
        //     var option = document.createElement("option");
        //     option.value = i;
        //     option.text = i;
        //     selectPos.appendChild(option);
        // }

        

        jQuery(function() {

            var serveraddress = 'http://172.16.0.11:3000';
            //var socket = new io.connect('http://192.168.0.153:3000', {
            var socket = new io.connect(serveraddress, {
              'reconnection': true,
              'reconnectionDelay': 500,
              'reconnectionDelayMax': 1000,
              'reconnectionAttempts': 999
            });
            // document.getElementById('registerbutton').addEventListener("click", function(){
            //   var e = document.getElementById('position');
            //   var pos = e.options[e.selectedIndex].value;
            //   socket.emit('register position', pos);
            // });

            var activated = false;
            var currentMode = "mode-1";
            var position;
            socket.on('cmd', function(msg) {
              console.log(msg);
              if (msg == "Toggle!") {
                activated = !activated
                // document.getElementById('state').innerHTML = activated ? "ACTIVATED" : "NOT ACTIVATED";
                // document.body.style.backgroundColor = activated ? "aqua" : "cornsilk";
                if (activated){
                    prizeReveal();
                }
                else {
                    prizeHide();
                }

              } else if (msg == "Deactivate!") {
                activated = false;
                // document.getElementById('state').innerHTML = "NOT ACTIVATED";
                // document.body.style.backgroundColor = "cornsilk";
                prizeHide();
              } else if (msg == "Activate!") {
                activated = true;
                // document.getElementById('state').innerHTML = "ACTIVATED";
                // document.body.style.backgroundColor = "aqua";
                prizeReveal();
              }
            });
            socket.on('pos', function(msg) {
              // document.getElementById('curpos').innerHTML = "Position: " + msg;
              getTabPosition(msg);
              console.log("got position");
              console.log(msg);
            });

            socket.on('win', function(msg) {
              // document.getElementById('curpos').innerHTML = "Position: " + msg;
              matrixReveal();
              console.log("got win");
            });

            socket.on('mode', function(msg) {
              // document.getElementById('curpos').innerHTML = "Position: " + msg;
              matrixHide();
              currentMode = "mode-" + msg;

              var currentPosition = position; //temp var

              // var currentMode = 'mode-1' //this may need to be updated elsewhere from the controller

              if(currentPosition !== undefined)
              {
                $('#master-back').css('background-image', 'url(' + serveraddress + '/img/master-img/'+currentPosition+'.svg)'); //updates master matrix image
                $('#prize-graphic').css('background-image', 'url(' + serveraddress + '/img/prizes/'+currentMode+'/prize-'+currentPosition+'.svg)'); //updates prize
              }

              console.log("got mode: " + msg);
            });

            socket.on('black', function(msg) {
              // document.getElementById('curpos').innerHTML = "Position: " + msg;
              if (msg == "off") {
                $('#show-black').css("display", "none");
              } else if (msg == "on") {
                $("#show-black").css("display", "block");
              }

              console.log("got black: " + msg);
            });

            var masterBkg = false;

            var imagesModeOne = new Array();
            var imagesModeTwo = new Array();
            var imagesBKG = new Array();

            function preload() {
                var numDisplays = 50;
                console.log("preload begins");
                for(i = 0; i < numDisplays; i++){
                    var tempNum = i+1;
                    imagesModeOne[i] = new Image();
                    imagesModeOne[i].src = '../www/img/prizes/mode-1/prize-'+tempNum+'.svg';
                    imagesModeTwo[i] = new Image();
                    imagesModeTwo[i].src = '../www/img/prizes/mode-2/prize-'+tempNum+'.svg';
                    imagesBKG[i] = new Image();
                    imagesBKG[i].src = '../www/img/master-img/'+tempNum+'.svg';
                    console.log("finished preload: " + tempNum);
                }

                console.log("preload finished");
            }

            function vipAccess() {

                var touchCount = 0;

                $('#vip-access').click(function(event) {
                    console.log("vip pressed");
                    touchCount++
                    if ( touchCount == 3 ) {
                        // getTabPosition();
                        $('#enumerate').toggle(400);
                        $('#card').toggle(400);
                        touchCount = 0;
                    }
                });

            }

            function getTabPosition(pos) {

                //something that returns a number 1 - 50 from the server
                //wrap it around this:

                var currentPosition = pos; //temp var

                // var currentMode = 'mode-1' //this may need to be updated elsewhere from the controller

                console.log(pos);

                if(currentPosition !== undefined){

                    position = pos;
                    $('#tab-num').text(currentPosition); //front display number

                    $('.tab').removeClass('active-tab');
                    $('.tab[data-id='+currentPosition+']').addClass('active-tab'); //admin panel

                    // $('#master-back').css('background-image', 'url(../www/img/master-img/'+currentPosition+'.svg)'); //updates master matrix image

                    // $('#prize-graphic').css('background-image', 'url(../www/img/prizes/'+currentMode+'/prize-'+currentPosition+'.svg)'); //updates prize

                    $('#master-back').css('background-image', 'url(' + serveraddress + '/img/master-img/'+currentPosition+'.svg)'); //updates master matrix image

                    $('#prize-graphic').css('background-image', 'url(' + serveraddress + '/img/prizes/'+currentMode+'/prize-'+currentPosition+'.svg)'); //updates prize
                }
            }

            function setTabPosition() {

                $('.tab').click(function(event) {

                    console.log("setting tab position");

                    var numSelect = $(this).attr('data-id');
                    
                    console.log(numSelect);

                    $('#confirm').removeClass('confirm-ajax confirm-success confirm-fail'); //in case it's been opened and closed

                    $('#confirm-title-2').text('Enumerate this device to position ' + numSelect + '?');

                    /*$(this).addClass('active-tab').siblings('.tab').removeClass('active-tab');*/

                    $('#confirm').show('fast', function() {

                        $('.conf-msg').show();

                        $('#enum-yes').mouseup(function(event) { 

                            //Add the actions here to enumerate the tablet
                            $('.conf-msg').hide();


                            console.log("emit pos");
                            socket.emit('register position', numSelect);


                            $('#tab-num').text(numSelect); //front display number

                            /*$('.tab[data-id='+numSelect+']').addClass('active-tab'); //admin panel*/
                            //Ajax or comms:
                            // $('#confirm').addClass('confirm-ajax');

                            //Success:
                            /*$('#confirm').addClass('confirm-success').removeClass('confirm-ajax');*/
                            setTimeout(function(){
                              $('#confirm').fadeOut('slow', function() {
                                  
                              });
                            }, 1000);

                            //Fail:
                            // $('#confirm').addClass('confirm-fail').removeClass('confirm-ajax');
                            // setTimeout(function(){
                            //   $('#confirm').fadeOut('slow', function() {
                                  
                            //   });
                            // }, 1000);


                        });

                        $('#enum-no').mouseup(function(event) { 

                            $('#confirm').hide('fast', function() {
                                /*$('.tab').removeClass('active-tab');*/
                            });
                        });

                        $(document).mouseup(function (e) //hide if clicked outside confirm
                        {
                            var container = $('#confirm');

                            if (!container.is(e.target) // if the target of the click isn't the container...
                                && container.has(e.target).length === 0) // ... nor a descendant of the container
                            {
                                container.hide();
                                /*$('.tab').removeClass('active-tab');*/
                            }
                        });
                        
                        
                    });
                });

            }

            function prizeReveal() {

                //Something from controller that fires this:

                $("#card").flip(true);

            }

            function prizeHide() {

                //Something from controller that fires this:

                $("#card").flip(false);

            }

            function matrixReveal() {

                //Something from controller that fires this:
                $("#master-card").flip(true);

            }

            function matrixHide() {

                //Something from controller that fires this:
                $("#master-card").flip(false);

            }

            function flipFlop() { //Just initializing flippyflappy

                // $("#card").flip({reverse: true}); //Touch for testing
                $("#card").flip({reverse: true, trigger: 'manual'});

                $("#master-card").flip({front: '.m-front', back: '.m-back', reverse: true, trigger: 'manual'}); //For  production
            }

            function init() {

                // preload();
                flipFlop();
                vipAccess();
                getTabPosition();
                setTabPosition();

            }

            init();

        });
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        // var parentElement = document.getElementById(id);
        // var listeningElement = parentElement.querySelector('.listening');
        // var receivedElement = parentElement.querySelector('.received');

        // listeningElement.setAttribute('style', 'display:none;');
        // receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    // On Resume
    onResume: function() {
        StatusBar.hide();
    }
};

app.initialize();