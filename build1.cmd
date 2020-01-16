
set version=%1
set key=%2

dotnet nuget locals all --clear

echo Building node, http, endpoint, and io

magic.node/build.cmd %version% %key% 
magic.http/build.cmd %version% %key% 
magic.endpoint/build.cmd %version% %key% 
magic.io/build.cmd %version% %key% 
