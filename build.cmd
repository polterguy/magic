
set version=%1
set key=%2

dotnet nuget locals all --clear

echo Moving one folder up

cd ..

echo Deleting all bin and obj folders

FOR /d /r . %%d IN ("bin") DO @IF EXIST "%%d" rd /s /q "%%d"
FOR /d /r . %%d IN ("obj") DO @IF EXIST "%%d" rd /s /q "%%d"

echo Executing build1.cmd

.\build1.cmd %version% %key%

echo Waiting 5 minutes to allow for NuGet.org to publish package

timeout 300


echo Executing build2.cmd

.\build2.cmd %version% %key%

echo Waiting 5 minutes to allow for NuGet.org to publish package

timeout 300


echo Executing build3.cmd

.\build3.cmd %version% %key%

echo Waiting 5 minutes to allow for NuGet.org to publish package

timeout 300


echo Executing build4.cmd

.\build4.cmd %version% %key%

echo Waiting 5 minutes to allow for NuGet.org to publish package

timeout 300


echo Executing build5.cmd

.\build4.cmd %version% %key%

echo Waiting 5 minutes to allow for NuGet.org to publish package




