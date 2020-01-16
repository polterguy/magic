
set version=%1
set key=%2

cd %~dp0
cd ..

FOR /d /r . %%d IN ("bin") DO @IF EXIST "%%d" rd /s /q "%%d"
FOR /d /r . %%d IN ("obj") DO @IF EXIST "%%d" rd /s /q "%%d"

cd %~dp0
call build1.cmd %version% %key%
timeout 300

cd %~dp0
call build2.cmd %version% %key%
timeout 300

cd %~dp0
call build3.cmd %version% %key%
timeout 300

cd %~dp0
call build4.cmd %version% %key%
timeout 300

cd %~dp0
call build5.cmd %version% %key%
cd %~dp0
