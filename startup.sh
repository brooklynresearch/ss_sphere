#! /bin/bash

echo "startup"

sleep 30

echo "stopping"

forever stopall

sleep 1

echo "starting static"

forever start /Users/bkr-ss/ss_sphere/staticServe/bin/www

sleep 1

echo "starting server"

forever start /Users/bkr-ss/ss_sphere/sphereServer/bin/www