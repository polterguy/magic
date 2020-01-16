
set version=%1
set key=%2

dotnet nuget locals all --clear

cd %~dp0/..
magic.lambda/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.auth/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.config/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.crypto/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.http/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.hyperlambda/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.io/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.json/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.logging/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.math/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.mssql/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.mysql/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.scheduler/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.slots/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.strings/build.cmd %key% %version%

cd %~dp0/..
magic.lambda.validators/build.cmd %key% %version%
