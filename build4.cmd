
set version=%1
set key=%2

dotnet nuget locals all --clear

../magic.lambda/build.cmd %key% %version%
../magic.lambda.auth/build.cmd %key% %version%
../magic.lambda.config/build.cmd %key% %version%
../magic.lambda.crypto/build.cmd %key% %version%
../magic.lambda.http/build.cmd %key% %version%
../magic.lambda.hyperlambda/build.cmd %key% %version%
../magic.lambda.io/build.cmd %key% %version%
../magic.lambda.json/build.cmd %key% %version%
../magic.lambda.logging/build.cmd %key% %version%
../magic.lambda.math/build.cmd %key% %version%
../magic.lambda.mssql/build.cmd %key% %version%
../magic.lambda.mysql/build.cmd %key% %version%
../magic.lambda.scheduler/build.cmd %key% %version%
../magic.lambda.slots/build.cmd %key% %version%
../magic.lambda.strings/build.cmd %key% %version%
../magic.lambda.validators/build.cmd %key% %version%
