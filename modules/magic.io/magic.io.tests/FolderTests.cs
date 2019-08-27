/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using System.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using Newtonsoft.Json.Linq;
using magic.io.services;
using magic.io.contracts;
using magic.io.controller;

namespace magic.io.tests
{
    public class FolderTests
    {
        #region [ -- Unit tests -- ]

        [Fact]
        public void CreateFolderListFolders()
        {
            var controller = CreateController();
            var jObj = new JObject
            {
                ["folder"] = "/foo/"
            };
            controller.Create(jObj);
            var result = controller.ListFolders("/");
            Assert.True(result.Any());
            Assert.Contains("/foo/", result);
        }

        [Fact]
        public void CreateFolderAndFileListFiles()
        {
            var controller = CreateController();
            var jObj = new JObject
            {
                ["folder"] = "foo"
            };
            controller.Create(jObj);
            var file = FileTests.CreateMoqFile("foo content", "foo.txt");
            var filesControllers = CreateFilesController();
            filesControllers.Upload(file.Object, "foo");
            var files = controller.ListFiles("foo");
            Assert.Single(files);
            Assert.Equal("/foo/foo.txt", files.First());
        }

        [Fact]
        public void CreateFolderAndFileDeleteFileListFiles()
        {
            var controller = CreateController();
            var jObj = new JObject
            {
                ["folder"] = "foo"
            };
            controller.Create(jObj);
            var result = controller.ListFolders("/");
            var file = FileTests.CreateMoqFile("foo content", "foo.txt");
            var filesControllers = CreateFilesController();
            filesControllers.Upload(file.Object, "foo");
            filesControllers.Delete("foo/foo.txt");
            var files = controller.ListFiles("foo");
            Assert.Empty(files);
        }

        [Fact]
        public void CreateFolderMoveFolder()
        {
            var controller = CreateController();
            var jObj = new JObject
            {
                ["folder"] = "/foo"
            };
            controller.Create(jObj);
            controller.Move(new CopyMoveModel
            {
                Source = "/foo",
                Destination = "/bar"
            });
            var result = controller.ListFolders("/");
            Assert.True(result.Count() > 0);
            Assert.Contains("/bar/", result);
            Assert.DoesNotContain("/foo/", result);
        }

        [Fact]
        public void Authorized_Fail_01()
        {
            var controller = CreateController(true);
            Assert.Throws<SecurityException>(() =>
            {
                var jObj = new JObject
                {
                    ["folder"] = "foo"
                };
                controller.Create(jObj);
            });
        }

        [Fact]
        public void Authorized_Fail_02()
        {
            var controller = CreateController();
            var jObj = new JObject
            {
                ["folder"] = "foo"
            };
            controller.Create(jObj);

            controller = CreateController(true);
            Assert.Throws<SecurityException>(() => controller.ListFolders("/"));
        }

        [Fact]
        public void Authorized_Fail_03()
        {
            var controller = CreateController(true);
            Assert.Throws<SecurityException>(() => controller.ListFiles("/"));
        }

        [Fact]
        public void Authorized_Fail_04()
        {
            var controller = CreateController();
            var jObj = new JObject
            {
                ["folder"] = "foo"
            };
            controller.Create(jObj);

            controller = CreateController(true);
            Assert.Throws<SecurityException>(() => controller.Move(new CopyMoveModel
            {
                Source = "/foo",
                Destination = "/bar",
            }));
        }

        [Fact]
        public void Authorized_Fail_05()
        {
            var controller = CreateController();
            var jObj = new JObject
            {
                ["folder"] = "foo"
            };
            controller.Create(jObj);

            controller = CreateController(true);
            Assert.Throws<SecurityException>(() => controller.Delete("/foo"));
        }

        #endregion

        #region [ -- Private helper methods -- ]

        FilesController CreateFilesController()
        {
            var kernel = new ServiceCollection();
            kernel.AddTransient<IFileService, FileService>();
            kernel.AddTransient<FilesController>();

            var mockConfiguration = new Mock<IConfiguration>();
            mockConfiguration.SetupGet(x => x[It.IsAny<string>()]).Returns("~/");
            kernel.AddTransient<IConfiguration>((svc) => mockConfiguration.Object);
            var provider = kernel.BuildServiceProvider();
            return provider.GetService(typeof(FilesController)) as FilesController;
        }

        FoldersController CreateController(bool authorize = false)
        {
            var kernel = new ServiceCollection();
            kernel.AddTransient<IFolderService, FolderService>();
            kernel.AddTransient<FoldersController>();

            var mockConfiguration = new Mock<IConfiguration>();
            mockConfiguration.SetupGet(x => x[It.IsAny<string>()]).Returns("~/");
            kernel.AddTransient<IConfiguration>((svc) => mockConfiguration.Object);

            if (authorize)
            {
                kernel.AddTransient<IAuthorize, FileTests.Authorize>();
            }
            var provider = kernel.BuildServiceProvider();
            return provider.GetService(typeof(FoldersController)) as FoldersController;
        }

        #endregion
    }
}
