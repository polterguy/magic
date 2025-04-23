/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Text;
using System.IO.Compression;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.io.tests.helpers;

namespace magic.lambda.io.tests
{
    public class FileTests
    {
        [Fact]
        public void SaveFile()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = false;
            var existsInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                ExistsAction = (path) =>
                {
                    existsInvoked = true;
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    return true;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.save:existing.txt
   .:foo
io.file.exists:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(existsInvoked);
            Assert.True(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public void SaveAndLoadFile()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = false;
            var loadInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                LoadAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    loadInvoked = true;
                    return "foo";
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.save:existing.txt
   .:foo
io.file.load:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(loadInvoked);
            Assert.Equal("foo", lambda.Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void SaveAndLoadFileBinary()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = false;
            var loadInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                LoadBinaryAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    loadInvoked = true;
                    return Encoding.UTF8.GetBytes("foo");
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.save:existing.txt
   .:foo
io.file.load.binary:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(loadInvoked);
            Assert.Equal("foo", Encoding.UTF8.GetString(lambda.Children.Skip(1).First().Get<byte[]>()));
        }

        [Fact]
        public void SaveAndDeleteFile()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = false;
            var deleteInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                DeleteAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    deleteInvoked = true;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.save:existing.txt
   .:foo
io.file.delete:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(deleteInvoked);
        }

        [Fact]
        public async Task SaveAndLoadFileAsync()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = false;
            var loadInvoked = false;
            var fileService = new FileService
            {
                SaveAction = async (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                    await Task.Yield();
                },
                LoadAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    loadInvoked = true;
                    return "foo";
                }
            };

            #endregion

            var lambda = await Common.EvaluateAsync(@"
io.file.save:existing.txt
   .:foo
io.file.load:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(loadInvoked);
            Assert.Equal("foo", lambda.Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void SaveFileAndMove_01()
        {
            #region [ -- Setting up mock service(s) -- ]

            var existsInvoked = 0;
            var saveInvoked = false;
            var moveInvoked = false;
            var deleteInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                ExistsAction = (path) =>
                {
                    existsInvoked += 1;
                    if (existsInvoked == 1)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return false;
                    }
                    else if (existsInvoked == 2)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return true;
                    }
                    else if (existsInvoked == 3)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "existing.txt", path);
                        return false;
                    }
                    else
                    {
                        throw new Exception("Failure in unit test");
                    }
                },
                MoveAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", dest);
                    moveInvoked = true;
                },
                DeleteAction = (path) =>
                {
                    deleteInvoked = true;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.save:/existing.txt
   .:foo
io.file.move:/existing.txt
   .:/moved.txt
io.file.exists:/moved.txt
io.file.exists:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(moveInvoked);
            Assert.False(deleteInvoked);
            Assert.Equal(3, existsInvoked);
            Assert.True(lambda.Children.Skip(2).First().Get<bool>());
            Assert.False(lambda.Children.Skip(3).First().Get<bool>());
        }

        [Fact]
        public void SaveFileAndMove_02()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = false;
            var moveInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                ExistsAction = (src) =>
                {
                    return false;
                },
                MoveAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/foo/" +
                        "existing.txt", dest);
                    moveInvoked = true;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.save:/existing.txt
   .:foo
io.file.move:/existing.txt
   .:/foo/
", fileService);
            Assert.True(saveInvoked);
            Assert.True(moveInvoked);
        }

        [Fact]
        public async Task SaveFileAndMove_03_Async()
        {
            #region [ -- Setting up mock service(s) -- ]

            var existsInvoked = 0;
            var saveInvoked = false;
            var moveInvoked = false;
            var deleteInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                DeleteAction = (path) =>
                {
                    deleteInvoked = true;
                },
                ExistsAction = (path) =>
                {
                    existsInvoked += 1;
                    if (existsInvoked == 1)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return false;
                    }
                    else if (existsInvoked == 2)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return true;
                    }
                    else if (existsInvoked == 3)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "existing.txt", path);
                        return false;
                    }
                    else
                    {
                        throw new Exception("Failure in unit test");
                    }
                },
                MoveAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", dest);
                    moveInvoked = true;
                }
            };

            #endregion

            var lambda = await Common.EvaluateAsync(@"
io.file.save:/existing.txt
   .:foo
io.file.move:/existing.txt
   .:/moved.txt
io.file.exists:/moved.txt
io.file.exists:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(moveInvoked);
            Assert.False(deleteInvoked);
            Assert.Equal(3, existsInvoked);
            Assert.True(lambda.Children.Skip(2).First().Get<bool>());
            Assert.False(lambda.Children.Skip(3).First().Get<bool>());
        }

        [Fact]
        public void SaveFileAndMove_Throws_01()
        {
            #region [ -- Setting up mock service(s) -- ]

            var existsInvoked = 0;
            var moveInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                },
                ExistsAction = (path) =>
                {
                    existsInvoked += 1;
                    if (existsInvoked == 1)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return false;
                    }
                    else if (existsInvoked == 2)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return true;
                    }
                    else if (existsInvoked == 3)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "existing.txt", path);
                        return false;
                    }
                    else
                    {
                        throw new Exception("Failure in unit test");
                    }
                },
                MoveAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", dest);
                    moveInvoked = true;
                }
            };

            #endregion

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
io.file.save:/existing.txt
   .:foo
io.file.move:/existing.txt
   .:/existing.txt
", fileService));
            Assert.False(moveInvoked);
        }


        [Fact]
        public void SaveFileAndMove_Throws_02()
        {
            #region [ -- Setting up mock service(s) -- ]

            var existsInvoked = 0;
            var moveInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                },
                ExistsAction = (path) =>
                {
                    existsInvoked += 1;
                    if (existsInvoked == 1)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return false;
                    }
                    else if (existsInvoked == 2)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return true;
                    }
                    else if (existsInvoked == 3)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "existing.txt", path);
                        return false;
                    }
                    else
                    {
                        throw new Exception("Failure in unit test");
                    }
                },
                MoveAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", dest);
                    moveInvoked = true;
                }
            };

            #endregion

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
io.file.save:/existing.txt
   .:foo
io.file.move:/existing.txt
", fileService));
            Assert.False(moveInvoked);
        }

        [Fact]
        public void MoveFileExists()
        {
            #region [ -- Setting up mock service(s) -- ]

            var existsInvoked = false;
            var moveInvoked = false;
            var deleteInvoked = false;
            var fileService = new FileService
            {
                ExistsAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", path);
                    existsInvoked = true;
                    return true;
                },
                MoveAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", dest);
                    moveInvoked = true;
                },
                DeleteAction = (src) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", src);
                    deleteInvoked = true;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.move:/existing.txt
   .:/moved.txt
", fileService);
            Assert.True(existsInvoked);
            Assert.True(moveInvoked);
            Assert.True(deleteInvoked);
        }

        [Fact]
        public void SaveFileAndCopy()
        {
            #region [ -- Setting up mock service(s) -- ]

            var existsInvoked = 0;
            var saveInvoked = false;
            var copyInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                ExistsAction = (path) =>
                {
                    existsInvoked += 1;
                    if (existsInvoked == 1)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return false;
                    }
                    else if (existsInvoked == 2)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return true;
                    }
                    else if (existsInvoked == 3)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "existing.txt", path);
                        return false;
                    }
                    else
                    {
                        throw new Exception("Failure in unit test");
                    }
                },
                CopyAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", dest);
                    copyInvoked = true;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.save:/existing.txt
   .:foo
io.file.copy:/existing.txt
   .:moved.txt
io.file.exists:/moved.txt
io.file.exists:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(copyInvoked);
            Assert.Equal(3, existsInvoked);
            Assert.True(lambda.Children.Skip(2).First().Get<bool>());
            Assert.False(lambda.Children.Skip(3).First().Get<bool>());
        }

        [Fact]
        public void CopyFileAlreadyExisting()
        {
            #region [ -- Setting up mock service(s) -- ]

            var existsInvoked = false;
            var copyInvoked = false;
            var deleteInvoked = false;
            var fileService = new FileService
            {
                ExistsAction = (path) =>
                {
                    existsInvoked = true;
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "dest.txt", path);
                    return true;
                },
                CopyAction = (src, dest) =>
                {
                    copyInvoked = true;
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "src.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "dest.txt", dest);
                },
                DeleteAction = (src) =>
                {
                    deleteInvoked = true;
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "dest.txt", src);
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.copy:/src.txt
   .:/dest.txt
", fileService);
            Assert.True(existsInvoked);
            Assert.True(copyInvoked);
            Assert.True(deleteInvoked);
        }

        [Fact]
        public void SaveFileAndCopy_SameFileName()
        {
            #region [ -- Setting up mock service(s) -- ]

            var existsInvoked = 0;
            var saveInvoked = false;
            var copyInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                ExistsAction = (path) =>
                {
                    existsInvoked += 1;
                    if (existsInvoked == 1)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "foo/existing.txt", path);
                        return false;
                    }
                    else if (existsInvoked == 2)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "foo/existing.txt", path);
                        return true;
                    }
                    else if (existsInvoked == 3)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "existing.txt", path);
                        return false;
                    }
                    else
                    {
                        throw new Exception("Failure in unit test");
                    }
                },
                CopyAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo/existing.txt", dest);
                    copyInvoked = true;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.save:/existing.txt
   .:foo
io.file.copy:/existing.txt
   .:/foo/
io.file.exists:/foo/existing.txt
io.file.exists:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(copyInvoked);
            Assert.Equal(3, existsInvoked);
            Assert.True(lambda.Children.Skip(2).First().Get<bool>());
            Assert.False(lambda.Children.Skip(3).First().Get<bool>());
        }

        [Fact]
        public void SaveFileAndCopy_Throws_01()
        {
            #region [ -- Setting up mock service(s) -- ]

            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                },
                ExistsAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", path);
                    return false;
                },
                CopyAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", dest);
                }
            };

            #endregion

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
io.file.save:/existing.txt
   .:foo
io.file.copy:/existing.txt
", fileService));
        }

        [Fact]
        public void SaveFileAndCopy_Throws_02()
        {
            #region [ -- Setting up mock service(s) -- ]

            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                },
                ExistsAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", path);
                    return false;
                },
                CopyAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", dest);
                }
            };

            #endregion

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
io.file.save:/existing.txt
   .:foo
io.file.copy:/existing.txt
   .:existing.txt
", fileService));
        }

        [Fact]
        public async Task SaveFileAndCopy_Throws_03()
        {
            #region [ -- Setting up mock service(s) -- ]

            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                },
                ExistsAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", path);
                    return false;
                },
                CopyAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", dest);
                }
            };

            #endregion

            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
io.file.save:/existing.txt
   .:foo
io.file.copy:/existing.txt
   .:existing.txt
", fileService));
        }

        [Fact]
        public async Task SaveFileAndCopyAsync()
        {
            #region [ -- Setting up mock service(s) -- ]

            var existsInvoked = 0;
            var saveInvoked = false;
            var copyInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("foo", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                ExistsAction = (path) =>
                {
                    existsInvoked += 1;
                    if (existsInvoked == 1)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return false;
                    }
                    else if (existsInvoked == 2)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "moved.txt", path);
                        return true;
                    }
                    else if (existsInvoked == 3)
                    {
                        Assert.Equal(
                            AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                            + "/" +
                            "existing.txt", path);
                        return false;
                    }
                    else
                    {
                        throw new Exception("Failure in unit test");
                    }
                },
                CopyAction = (src, dest) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", src);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "moved.txt", dest);
                    copyInvoked = true;
                }
            };

            #endregion

            /*
             * Notice, even though we don't explicitly invoke async slots here,
             * the async slots whould be invoked none the less, due to the signaler's
             * default behaviour, which is to invoke async slots, from an async context,
             * if the slot implements the ISlotAsync interface.
             */
            var lambda = await Common.EvaluateAsync(@"
io.file.save:/existing.txt
   .:foo
io.file.copy:/existing.txt
   .:moved.txt
io.file.exists:/moved.txt
io.file.exists:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(copyInvoked);
            Assert.Equal(3, existsInvoked);
            Assert.True(lambda.Children.Skip(2).First().Get<bool>());
            Assert.False(lambda.Children.Skip(3).First().Get<bool>());
        }

        [Slot(Name = "foo")]
        public class EventSource : ISlot
        {
            public void Signal(ISignaler signaler, Node input)
            {
                input.Value = "success";
            }
        }

        [Fact]
        public void SaveWithEventSourceAndLoadFile()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = false;
            var loadInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    Assert.Equal("success", content);
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    saveInvoked = true;
                },
                LoadAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    loadInvoked = true;
                    return "success";
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.save:existing.txt
   foo:error
io.file.load:/existing.txt
", fileService);
            Assert.True(saveInvoked);
            Assert.True(loadInvoked);
            Assert.Equal("success", lambda.Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void SaveOverwriteAndLoadFile()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = 0;
            var loadInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) =>
                {
                    saveInvoked += 1;
                    if (saveInvoked == 1)
                        Assert.Equal("foo", content);
                    else if (saveInvoked == 2)
                        Assert.Equal("foo1", content);
                    else
                        throw new Exception("Unit test failure");
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                },
                LoadAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "existing.txt", path);
                    loadInvoked = true;
                    return "foo1";
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.save:existing.txt
   .:foo
io.file.save:existing.txt
   .:foo1
io.file.load:/existing.txt
", fileService);
            Assert.Equal(2, saveInvoked);
            Assert.True(loadInvoked);
            Assert.Equal("foo1", lambda.Children.Skip(2).First().Get<string>());
        }

        [Fact]
        public void ListFiles()
        {
            #region [ -- Setting up mock service(s) -- ]

            var fileService = new FileService
            {
                ListFilesAction = (path) =>
                {
                    return new string[] {
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        ".hidden.txt",
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "bar.txt",
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo.txt"
                    }.ToList();
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.list:/
", fileService);
            Assert.True(lambda.Children.First().Children.Count() == 2);

            // Notice, files are SORTED!
            Assert.Equal("/bar.txt", lambda.Children.First().Children.First().Get<string>());
            Assert.Equal("/foo.txt", lambda.Children.First().Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void ListHiddenFiles()
        {
            #region [ -- Setting up mock service(s) -- ]

            var fileService = new FileService
            {
                ListFilesAction = (path) =>
                {
                    return new string[] {
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        ".hidden.txt",
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "bar.txt",
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo.txt"
                    }.ToList();
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.list:/
   display-hidden:true
", fileService);
            Assert.Equal(3, lambda.Children.First().Children.Count());

            // Notice, files are SORTED!
            Assert.Equal("/.hidden.txt", lambda.Children.First().Children.First().Get<string>());
            Assert.Equal("/bar.txt", lambda.Children.First().Children.Skip(1).First().Get<string>());
            Assert.Equal("/foo.txt", lambda.Children.First().Children.Skip(2).First().Get<string>());
        }

        [Fact]
        public void EvaluateFile()
        {
            #region [ -- Setting up mock service(s) -- ]

            var loadInvoked = false;
            var fileService = new FileService
            {
                LoadAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo.hl", path);
                    loadInvoked = true;
                    return @"return-nodes
   result:hello world";
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.execute:foo.hl
", fileService);
            Assert.True(loadInvoked);
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("hello world", lambda.Children.First().Children.First().Get<string>());
        }

        [Fact]
        public void EvaluateFileWithArguments()
        {
            #region [ -- Setting up mock service(s) -- ]

            var loadInvoked = false;
            var fileService = new FileService
            {
                LoadAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo.hl", path);
                    loadInvoked = true;
                    return @"
.arguments
   foo:bar
if
   not
      eq
         get-value:x:@.filename
         .:/foo.hl
   .lambda
      throw:Wrong filename
if
   not
      eq
         get-count:x:../*/.arguments
         .:int:1
   .lambda
      throw:Too many [.arguments] nodes
unwrap:x:+/*
return-nodes
   result:x:@.arguments/*";
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.execute:/foo.hl
   input:jo world
", fileService);
            Assert.True(loadInvoked);
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("result", lambda.Children.First().Children.First().Name);
            Assert.Equal("jo world", lambda.Children.First().Children.First().Get<string>());
        }

        [Fact]
        public void EvaluateFileReturningRootFilename()
        {
            #region [ -- Setting up mock service(s) -- ]

            var loadInvoked = false;
            var fileService = new FileService
            {
                LoadAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo.hl", path);
                    loadInvoked = true;
                    return @"unwrap:x:+/*
return-nodes
   result:x:@.filename";
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.file.execute:foo.hl
", fileService);
            Assert.True(loadInvoked);
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("result", lambda.Children.First().Children.First().Name);
            Assert.EndsWith("foo.hl", lambda.Children.First().Children.First().Get<string>());
        }

        [Fact]
        public void EvaluateFileReturningValue()
        {
            #region [ -- Setting up mock service(s) -- ]

            var loadInvoked = false;
            var fileService = new FileService
            {
                LoadAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo.hl", path);
                    loadInvoked = true;
                    return "return-value:howdy world";
                }
            };

            #endregion

            var lambda = Common.Evaluate("io.file.execute:foo.hl", fileService);
            Assert.True(loadInvoked);
            Assert.Empty(lambda.Children.First().Children);
            Assert.Equal("howdy world", lambda.Children.First().Get<string>());
        }

        [Fact]
        public async Task EvaluateFileAsync()
        {
            #region [ -- Setting up mock service(s) -- ]

            var loadInvoked = false;
            var fileService = new FileService
            {
                LoadAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo.hl", path);
                    loadInvoked = true;
                    return @"return-nodes
   result:hello world";
                }
            };

            #endregion

            var lambda = await Common.EvaluateAsync(@"
io.file.execute:foo.hl
", fileService);
            Assert.True(loadInvoked);
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("hello world", lambda.Children.First().Children.First().Get<string>());
        }

        [Fact]
        public async Task EvaluateFileWithArgumentsAsync()
        {
            #region [ -- Setting up mock service(s) -- ]

            var loadInvoked = false;
            var fileService = new FileService
            {
                LoadAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/')
                        + "/" +
                        "foo.hl", path);
                    loadInvoked = true;
                    return @"
.arguments
   foo:bar
if
   not
      eq
         get-value:x:@.filename
         .:/foo.hl
   .lambda
      throw:Wrong filename
if
   not
      eq
         get-count:x:../*/.arguments
         .:int:1
   .lambda
      throw:Too many [.arguments] nodes
unwrap:x:+/*
return-nodes
   result:x:@.arguments/*";
                }
            };

            #endregion

            var lambda = await Common.EvaluateAsync(@"
io.file.execute:/foo.hl
   input:jo world
", fileService);
            Assert.True(loadInvoked);
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("result", lambda.Children.First().Children.First().Name);
            Assert.Equal("jo world", lambda.Children.First().Children.First().Get<string>());
        }

        [Fact]
        public void CreateZipStream_01()
        {
            var lambda = Common.Evaluate(@"
.filename1:foo.txt
.content1:foo-content
io.content.zip-stream
   get-value:x:@.filename1
      get-value:x:@.content1
");
            var zipNode = lambda.Children.FirstOrDefault(x => x.Name == "io.content.zip-stream");
            Assert.NotNull(zipNode);

            using var archive = new ZipArchive(zipNode.Get<MemoryStream>());
            Assert.Single(archive.Entries);
            var entry = archive.Entries.First();
            using (var reader = new StreamReader(entry.Open()))
            {
                Assert.Equal("foo-content", reader.ReadToEnd());
            }
            Assert.Equal("foo.txt", entry.FullName);
        }

        [Fact]
        public void CreateZipStream_02()
        {
            var lambda = Common.Evaluate(@"
io.content.zip-stream
   .:/foo1.txt
      .:howdy
   .:/foo2.txt
      .:world
   .:/another-folder/foo3.txt
      .:2.0
");
            var zipNode = lambda.Children.FirstOrDefault(x => x.Name == "io.content.zip-stream");
            Assert.NotNull(zipNode);

            var mem = zipNode.Get<MemoryStream>();
            using var archive = new ZipArchive(mem);
            Assert.Equal(3, archive.Entries.Count);
            var entry = archive.Entries.First();
            using (var reader = new StreamReader(entry.Open()))
            {
                Assert.Equal("howdy", reader.ReadToEnd());
            }
            Assert.Equal("/foo1.txt", entry.FullName);
            entry = archive.Entries.Skip(1).First();
            using (var reader = new StreamReader(entry.Open()))
            {
                Assert.Equal("world", reader.ReadToEnd());
            }
            Assert.Equal("/foo2.txt", entry.FullName);
            entry = archive.Entries.Skip(2).First();
            using (var reader = new StreamReader(entry.Open()))
            {
                Assert.Equal("2.0", reader.ReadToEnd());
            }
            Assert.Equal("/another-folder/foo3.txt", entry.FullName);
        }
    }
}
