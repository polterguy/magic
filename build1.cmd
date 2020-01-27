
set version=%1
set key=%2

dotnet nuget locals all --clear

cd %~dp0/..
call magic.node/build.cmd %version% %key% 

cd %~dp0/..
call magic.http/build.cmd %version% %key% 
