
set version=%1
set key=%2

dotnet nuget locals all --clear

cd %~dp0/../..
call magic.lambda/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.auth/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.config/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.crypto/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.http/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.hyperlambda/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.io/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.json/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.logging/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.math/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.mssql/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.mysql/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.scheduler/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.slots/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.strings/build.cmd %version% %key%

cd %~dp0/../..
call magic.lambda.validators/build.cmd %version% %key%
