/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Moq;
using Xunit;
using magic.node.contracts;
using magic.lambda.logging.contracts;

namespace magic.lambda.sockets.tests
{
    public class HubExecuteTests
    {
        static (Mock<ILogger> Logger, Mock<IFileService> Files) Mocks(bool exists, string hl = "")
        {
            var logger = new Mock<ILogger>();
            var files = new Mock<IFileService>();
            files.Setup(x => x.ExistsAsync(It.IsAny<string>())).ReturnsAsync(exists);
            files.Setup(x => x.LoadAsync(It.IsAny<string>())).ReturnsAsync(hl);
            return (logger, files);
        }

        [Theory]
        [InlineData("foo/bar")]
        [InlineData("/etc/secret")]
        public async Task IllegalFileIsLoggedAndNotLoaded(string file)
        {
            var (logger, files) = Mocks(true);
            await SlotTests.NewHub(new FakeHub(), "c", null, logger, files).execute(file, "{}");
            logger.Verify(x => x.ErrorAsync(It.Is<string>(m => m.Contains("illegal file"))), Times.Once);
            files.Verify(x => x.LoadAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task MissingFileIsLogged()
        {
            var (logger, files) = Mocks(false);
            await SlotTests.NewHub(new FakeHub(), "c", null, logger, files).execute("/modules/foo/bar", "{}");
            logger.Verify(x => x.ErrorAsync(It.Is<string>(m => m.Contains("non-existent file 'modules/foo/bar.socket.hl'"))), Times.Once);
            files.Verify(x => x.LoadAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task ExecutesFileWithConnectionInScope()
        {
            var (logger, files) = Mocks(true, "test.sockets.record:x");
            StubRecord.Connection = null;
            await SlotTests.NewHub(new FakeHub(), "conn-77", null, logger, files).execute("/modules/foo/bar", "{\"a\":1}");
            Assert.Equal("conn-77", StubRecord.Connection);
            Assert.Equal("x", StubRecord.Payload);
            files.Verify(x => x.LoadAsync("/modules/foo/bar.socket.hl"), Times.Once);
            logger.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task EmptyPayloadIsAccepted()
        {
            var (logger, files) = Mocks(true, "test.sockets.record:y");
            await SlotTests.NewHub(new FakeHub(), "c", null, logger, files).execute("system/foo", "");
            Assert.Equal("y", StubRecord.Payload);
        }

        [Fact]
        public async Task ExceptionsAreLoggedNotThrown()
        {
            var (logger, files) = Mocks(true, "test.sockets.throw");
            await SlotTests.NewHub(new FakeHub(), "c", null, logger, files).execute("/modules/foo/bar", "{}");
            logger.Verify(x => x.ErrorAsync(It.Is<string>(m => m.Contains("Unhandled exception")), It.IsAny<string>()), Times.Once);
        }
    }
}
