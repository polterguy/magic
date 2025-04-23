/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;
using magic.lambda.io.tests.helpers;

namespace magic.lambda.io.tests
{
    public class FolderTests
    {
        [Fact]
        public void CreateAndDeleteFolder()
        {
            #region [ -- Setting up mock service(s) -- ]

            var createInvoked = false;
            var deleteInvoked = false;
            var existsInvoked = false;
            var folderService = new FolderService
            {
                CreateAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo", path);
                    createInvoked = true;
                },
                DeleteAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo", path);
                    deleteInvoked = true;
                },
                ExistsAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo", path);
                    existsInvoked = true;
                    return true;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.folder.create:foo
   .:foo
io.folder.exists:foo
io.folder.delete:foo
", null, folderService);
            Assert.True(createInvoked);
            Assert.True(deleteInvoked);
            Assert.True(existsInvoked);
        }

        [Fact]
        public void ListFolders()
        {
            #region [ -- Setting up mock service(s) -- ]

            var listInvoked = false;
            var folderService = new FolderService
            {
                ListAction = (path) =>
                {
                    listInvoked = true;
                    return new string[] {
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo/",
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        ".foo/",
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "bar/"
                    }.ToList();
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.folder.list:/
", null, folderService);
            Assert.True(listInvoked);
            Assert.Equal(2, lambda.Children.First().Children.Count());

            // Notice, files are SORTED!
            Assert.Equal("/foo/", lambda.Children.First().Children.First().Get<string>());
            Assert.Equal("/bar/", lambda.Children.First().Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void ListHiddenFolders()
        {
            #region [ -- Setting up mock service(s) -- ]

            var listInvoked = false;
            var folderService = new FolderService
            {
                ListAction = (path) =>
                {
                    listInvoked = true;
                    return new string[] {
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        ".hidden/",
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "bar/",
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo/"
                    }.ToList();
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.folder.list:/
   display-hidden:true
", null, folderService);
            Assert.True(listInvoked);
            Assert.Equal(3, lambda.Children.First().Children.Count());

            // Notice, files are SORTED!
            Assert.Equal("/.hidden/", lambda.Children.First().Children.First().Get<string>());
            Assert.Equal("/bar/", lambda.Children.First().Children.Skip(1).First().Get<string>());
            Assert.Equal("/foo/", lambda.Children.First().Children.Skip(2).First().Get<string>());
        }

        [Fact]
        public void CreateFolderListFolders()
        {
            #region [ -- Setting up mock service(s) -- ]

            var listInvoked = false;
            var createInvoked = true;
            var folderService = new FolderService
            {
                CreateAction = (path) =>
                {
                    createInvoked = true;
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo", path);
                },
                ListAction = (path) =>
                {
                    listInvoked = true;
                    return new string[] {
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "bar/",
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo/"
                    }.ToList();
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.folder.create:/foo
io.folder.list:/
", null, folderService);
            Assert.True(listInvoked);
            Assert.True(createInvoked);
            Assert.True(lambda.Children.Skip(1).First().Children.Count() == 2);

            // Notice, files are SORTED!
            Assert.Equal("/bar/", lambda.Children.Skip(1).First().Children.First().Get<string>());
            Assert.Equal("/foo/", lambda.Children.Skip(1).First().Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void MoveFolder()
        {
            #region [ -- Setting up mock service(s) -- ]

            var moveInvoked = false;
            var existsInvoked = false;
            var folderService = new FolderService
            {
                MoveAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "source/", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "destination/", dest);
                    moveInvoked = true;
                },
                ExistsAction = (src) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "destination/", src);
                    existsInvoked = true;
                    return false;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.folder.move:/source/
   .:/destination/
", null, folderService);
            Assert.True(moveInvoked);
            Assert.True(existsInvoked);
        }

        [Fact]
        public async Task MoveFolderAsync()
        {
            #region [ -- Setting up mock service(s) -- ]

            var moveInvoked = false;
            var existsInvoked = false;
            var folderService = new FolderService
            {
                MoveAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "source/", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "destination/", dest);
                    moveInvoked = true;
                },
                ExistsAction = (src) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "destination/", src);
                    existsInvoked = true;
                    return false;
                }
            };

            #endregion

            var lambda = await Common.EvaluateAsync(@"
io.folder.move:/source/
   .:/destination/
", null, folderService);
            Assert.True(moveInvoked);
            Assert.True(existsInvoked);
        }

        [Fact]
        public void MoveFolderDestinationExists_Throws()
        {
            #region [ -- Setting up mock service(s) -- ]

            var moveInvoked = false;
            var existsInvoked = false;
            var folderService = new FolderService
            {
                MoveAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "source/", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "destination/", dest);
                    moveInvoked = true;
                },
                ExistsAction = (src) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "destination/", src);
                    existsInvoked = true;
                    return true; // Notice, returning TRUE here!
                }
            };

            #endregion

            Assert.Throws<NullReferenceException>(() => Common.Evaluate(@"
io.folder.move:/source/
   .:/destination/
", null, folderService));
            Assert.False(moveInvoked);
            Assert.True(existsInvoked);
        }

        [Fact]
        public void MoveFolderSameSourceAndDestination_Throws()
        {
            #region [ -- Setting up mock service(s) -- ]

            var moveInvoked = false;
            var existsInvoked = false;
            var folderService = new FolderService
            {
                MoveAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "source/", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "destination/", dest);
                    moveInvoked = true;
                },
                ExistsAction = (src) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "destination/", src);
                    existsInvoked = true;
                    return false;
                }
            };

            #endregion

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
io.folder.move:/source/
   .:/source/
", null, folderService));
            Assert.False(moveInvoked);
            Assert.False(existsInvoked);
        }

        [Fact]
        public void GetPathFolder_01()
        {
            var lambda = Common.Evaluate(@"
io.path.get-folder:/foo/howdy/file.hl
");
            Assert.Equal("/foo/howdy/", lambda.Children.First().Value);
        }

        [Fact]
        public void GetPathFolder_02()
        {
            var lambda = Common.Evaluate(@"
io.path.get-folder:/foo/howdy/
");
            Assert.Equal("/foo/howdy/", lambda.Children.First().Value);
        }
    }
}
