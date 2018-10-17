#! /bin/bash

echo "startup"

sleep 30

echo "stopping"

forever stopall

sleep 1

echo "starting server"

sleep 1

cd /Users/bkr-ss/ss_sphere/sphereServer

forever start -o OUT.log -e ERR.log  --workingDir /Users/bkr-ss/ss_sphere/sphereServer /Users/bkr-ss/ss_sphere/sphereServer/bin/www