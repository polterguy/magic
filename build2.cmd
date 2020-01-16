
set version=%1
set key=%2

dotnet nuget locals all --clear

../magic.signals/build.cmd %version% %key%
