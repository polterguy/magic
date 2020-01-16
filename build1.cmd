
echo Moving one folder up

cd ..

echo Deleting all bin and obj folders

FOR /d /r . %%d IN ("bin") DO @IF EXIST "%%d" rd /s /q "%%d"
FOR /d /r . %%d IN ("obj") DO @IF EXIST "%%d" rd /s /q "%%d"

echo Building node, http, endpoint, and io

magic.node/build.cmd
magic.http/build.cmd
magic.endpoint/build.cmd
magic.io/build.cmd
