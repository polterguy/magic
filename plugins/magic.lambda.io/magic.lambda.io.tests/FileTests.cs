/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
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
        public void Mixin_WhitelistGrantsCodebehind_Succeeds()
        {
            var loadInvoked = false;
            var fileService = new FileService
            {
                ExistsAction = (path) => path.EndsWith("/etc/page.hl"),
                LoadAction = (path) => { loadInvoked = true; return ".oninit"; },
            };
            var streamService = new StreamService
            {
                OpenFileAction = (path) => new MemoryStream(Encoding.UTF8.GetBytes("<p>howdy</p>")),
            };

            // Reading the codebehind is granted explicitly, not implied by the mixin pin.
            Common.Evaluate(@"
whitelist
   vocabulary
      io.file.mixin:/etc/*.html
      io.file.load:/etc/*.hl
   .lambda
      io.file.mixin:/etc/page.html
", fileService, streamService: streamService);
            Assert.True(loadInvoked);
        }

        [Fact]
        public void Mixin_WhitelistWithoutCodebehindPin_Throws()
        {
            var loadInvoked = false;
            var fileService = new FileService
            {
                ExistsAction = (path) => path.EndsWith("/etc/page.hl"),
                LoadAction = (path) => { loadInvoked = true; return ".oninit"; },
            };
            var streamService = new StreamService
            {
                OpenFileAction = (path) => new MemoryStream(Encoding.UTF8.GetBytes("<p>howdy</p>")),
            };

            // The mixin pin alone no longer implies permission to read the codebehind.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.mixin:/etc/*.html
   .lambda
      io.file.mixin:/etc/page.html
", fileService, streamService: streamService));
            Assert.False(loadInvoked);
        }

        [Fact]
        public void Mixin_WhitelistCodebehindPinnedElsewhere_Throws()
        {
            var fileService = new FileService
            {
                ExistsAction = (path) => path.EndsWith("/etc/page.hl"),
                LoadAction = (path) => ".oninit",
            };
            var streamService = new StreamService
            {
                OpenFileAction = (path) => new MemoryStream(Encoding.UTF8.GetBytes("<p>howdy</p>")),
            };

            // A codebehind pin for a DIFFERENT folder does not grant this one.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.mixin:/etc/*.html
      io.file.load:/other/*.hl
   .lambda
      io.file.mixin:/etc/page.html
", fileService, streamService: streamService));
        }

        static Stream CreateArchive(params string[] entries)
        {
            var result = new MemoryStream();
            using (var archive = new ZipArchive(result, ZipArchiveMode.Create, true))
            {
                foreach (var idx in entries)
                {
                    using (var writer = new StreamWriter(archive.CreateEntry(idx).Open()))
                    {
                        writer.Write("foo");
                    }
                }
            }
            result.Position = 0;
            return result;
        }

        [Fact]
        public void UnzipFile_WhitelistAllowsDestination_ExtractsNestedEntries()
        {
            var saved = new List<string>();
            var streamService = new StreamService
            {
                OpenFileAction = (path) => CreateArchive("root.txt", "sub/nested.txt"),
                SaveFileAction = (stream, path) => saved.Add(path),
            };
            var folderService = new FolderService
            {
                ExistsAction = (path) => true,
                CreateAction = (path) => { },
            };

            // The vocabulary grants the archive as a file, and the destination as a folder. An
            // archive's OWN sub folders are then confined to that destination, not re-compared.
            Common.Evaluate(@"
whitelist
   vocabulary
      io.file.unzip:/etc/*.zip
      io.file.unzip:/etc/*/
   .lambda
      io.file.unzip:/etc/x.zip
         folder:/etc/out/
", streamService: streamService, folderService: folderService);

            Assert.Equal(2, saved.Count);
            Assert.Contains(saved, x => x.EndsWith("/etc/out/root.txt"));
            Assert.Contains(saved, x => x.EndsWith("/etc/out/sub/nested.txt"));
        }

        [Fact]
        public void UnzipFile_WhitelistRefusesDestination_Throws()
        {
            var saveInvoked = false;
            var streamService = new StreamService
            {
                OpenFileAction = (path) => CreateArchive("root.txt"),
                SaveFileAction = (stream, path) => saveInvoked = true,
            };
            var folderService = new FolderService
            {
                ExistsAction = (path) => true,
                CreateAction = (path) => { },
            };

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.unzip:/etc/*.zip
      io.file.unzip:/etc/*/
   .lambda
      io.file.unzip:/etc/x.zip
         folder:/other/out/
", streamService: streamService, folderService: folderService));
            Assert.False(saveInvoked);
        }

        [Fact]
        public void UnzipFile_EntryEscapingDestination_Throws()
        {
            var saveInvoked = false;
            var streamService = new StreamService
            {
                OpenFileAction = (path) => CreateArchive("../escaped.txt"),
                SaveFileAction = (stream, path) => saveInvoked = true,
            };
            var folderService = new FolderService
            {
                ExistsAction = (path) => true,
                CreateAction = (path) => { },
            };

            // Classic zip slip - the entry stays inside the dynamic files folder, but leaves the
            // destination the caller was granted.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.unzip:/etc/*.zip
      io.file.unzip:/etc/*/
   .lambda
      io.file.unzip:/etc/x.zip
         folder:/etc/out/
", streamService: streamService, folderService: folderService));
            Assert.False(saveInvoked);
        }

        [Fact]
        public void UnzipFile_EntryEscapingDestination_ThrowsWithoutWhitelist()
        {
            var saveInvoked = false;
            var streamService = new StreamService
            {
                OpenFileAction = (path) => CreateArchive("../escaped.txt"),
                SaveFileAction = (stream, path) => saveInvoked = true,
            };
            var folderService = new FolderService
            {
                ExistsAction = (path) => true,
                CreateAction = (path) => { },
            };

            // Containment is not a whitelist feature - it holds with no sandbox in scope at all.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
io.file.unzip:/etc/x.zip
   folder:/etc/out/
", streamService: streamService, folderService: folderService));
            Assert.False(saveInvoked);
        }

        [Fact]
        public void CopyFile_WhitelistAllowsBothPaths_Succeeds()
        {
            var copyInvoked = false;
            var fileService = new FileService
            {
                ExistsAction = (path) => false,
                CopyAction = (src, dest) => copyInvoked = true,
            };

            Common.Evaluate(@"
whitelist
   vocabulary
      io.file.copy:/etc/*
   .lambda
      io.file.copy:/etc/src.txt
         .:/etc/dest.txt
", fileService);
            Assert.True(copyInvoked);
        }

        [Fact]
        public void CopyFile_WhitelistRefusesDestination_Throws()
        {
            var copyInvoked = false;
            var fileService = new FileService
            {
                ExistsAction = (path) => false,
                CopyAction = (src, dest) => copyInvoked = true,
            };

            // The source is allowed, the DESTINATION is not - and the signaler never sees it.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.copy:/etc/*
   .lambda
      io.file.copy:/etc/src.txt
         .:/other/dest.txt
", fileService));
            Assert.False(copyInvoked);
        }

        [Fact]
        public void MoveFile_WhitelistRefusesDestination_Throws()
        {
            var moveInvoked = false;
            var fileService = new FileService
            {
                ExistsAction = (path) => false,
                MoveAction = (src, dest) => moveInvoked = true,
            };

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.move:/etc/*
   .lambda
      io.file.move:/etc/src.txt
         .:/other/dest.txt
", fileService));
            Assert.False(moveInvoked);
        }

        [Fact]
        public void SaveFile_WhitelistWildcardSegment_DoesNotCrossTwoFolders()
        {
            var fileService = new FileService { SaveAction = (path, content) => { } };

            // One wildcard segment matches exactly one folder level, never two.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*/foo.md
   .lambda
      io.file.save:/etc/bar/baz/foo.md
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistMultipleExtension_WrongExtensionThrows()
        {
            var fileService = new FileService { SaveAction = (path, content) => { } };

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*.tar.gz
   .lambda
      io.file.save:/etc/x.zip
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistExtensionWildcard_SubFolderThrows()
        {
            var fileService = new FileService { SaveAction = (path, content) => { } };

            // Right extension, wrong folder level.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*.md
   .lambda
      io.file.save:/etc/sub/foo.md
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistExactPath_Succeeds()
        {
            var saveInvoked = false;
            var fileService = new FileService { SaveAction = (path, content) => saveInvoked = true };

            Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/foo.txt
   .lambda
      io.file.save:/etc/foo.txt
         .:foo
", fileService);
            Assert.True(saveInvoked);
        }

        [Fact]
        public void SaveFile_WhitelistExactPath_Throws()
        {
            var fileService = new FileService { SaveAction = (path, content) => { } };

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/foo.txt
   .lambda
      io.file.save:/etc/bar.txt
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistWithoutPin_AllowsAnyPath()
        {
            var saveInvoked = false;
            var fileService = new FileService { SaveAction = (path, content) => saveInvoked = true };

            // An entry with no value permits the slot with any argument, as it always has.
            Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save
   .lambda
      io.file.save:/anywhere/at/all.txt
         .:foo
", fileService);
            Assert.True(saveInvoked);
        }

        [Fact]
        public void SaveFile_WhitelistExtensionIsCaseSensitive_Throws()
        {
            var fileService = new FileService { SaveAction = (path, content) => { } };

            // Ordinal comparison, hence a differing case fails closed.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*.md
   .lambda
      io.file.save:/etc/foo.MD
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistPatternWithoutFolder_Throws()
        {
            var fileService = new FileService { SaveAction = (path, content) => { } };

            // "*" implies no folder, hence can never match a path, hence is refused.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:*
   .lambda
      io.file.save:/etc/foo.txt
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistRootFolder_Succeeds()
        {
            var saveInvoked = false;
            var fileService = new FileService { SaveAction = (path, content) => saveInvoked = true };

            Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/*
   .lambda
      io.file.save:/foo.txt
         .:foo
", fileService);
            Assert.True(saveInvoked);
        }

        [Fact]
        public void SaveFile_WhitelistMultipleExtension_Succeeds()
        {
            var saveInvoked = false;
            var fileService = new FileService { SaveAction = (path, content) => saveInvoked = true };

            Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*.tar.gz
   .lambda
      io.file.save:/etc/foo.tar.gz
         .:foo
", fileService);
            Assert.True(saveInvoked);
        }

        [Fact]
        public void SaveFile_WhitelistExtensionOnFolderSegment_Throws()
        {
            var fileService = new FileService { SaveAction = (path, content) => { } };

            // An extension wildcard is only legal as the filename, never as a folder segment.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/foo.*/howdy/*
   .lambda
      io.file.save:/etc/foo.bar/howdy/x.txt
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistWildcardSegment_Succeeds()
        {
            var saveInvoked = false;
            var fileService = new FileService { SaveAction = (path, content) => saveInvoked = true };

            // A wildcard segment matches exactly one folder level.
            Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*/foo.md
   .lambda
      io.file.save:/etc/bar/foo.md
         .:foo
", fileService);
            Assert.True(saveInvoked);
        }

        [Fact]
        public void SaveFile_WhitelistFolderWildcard_DoesNotCrossFolders()
        {
            var fileService = new FileService
            {
                SaveAction = (path, content) => { },
            };

            // "/etc/*" grants the folder itself, not everything beneath it.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*
   .lambda
      io.file.save:/etc/sub/foo.txt
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistIllegalPattern_Throws()
        {
            var fileService = new FileService
            {
                SaveAction = (path, content) => { },
            };

            // A wildcard must be the whole segment or its start, hence "f*o.md" is refused.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/f*o.md
   .lambda
      io.file.save:/etc/foo.md
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistDoubleWildcard_Throws()
        {
            var fileService = new FileService
            {
                SaveAction = (path, content) => { },
            };

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*.*
   .lambda
      io.file.save:/etc/foo.md
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistFolderWildcard_Succeeds()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) => saveInvoked = true,
            };

            Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*
   .lambda
      io.file.save:/etc/foo.txt
         .:foo
", fileService);
            Assert.True(saveInvoked);
        }

        [Fact]
        public void SaveFile_WhitelistFolderWildcard_Throws()
        {
            var fileService = new FileService
            {
                SaveAction = (path, content) => { },
            };

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*
   .lambda
      io.file.save:/other/foo.txt
         .:foo
", fileService));
        }

        [Fact]
        public void SaveFile_WhitelistExtensionWildcard_Succeeds()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                SaveAction = (path, content) => saveInvoked = true,
            };

            Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*.md
   .lambda
      io.file.save:/etc/foo.md
         .:foo
", fileService);
            Assert.True(saveInvoked);
        }

        [Fact]
        public void SaveFile_WhitelistExtensionWildcard_Throws()
        {
            var fileService = new FileService
            {
                SaveAction = (path, content) => { },
            };

            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      io.file.save:/etc/*.md
   .lambda
      io.file.save:/etc/foo.txt
         .:foo
", fileService));
        }

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
        public void SaveFileAlias()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = false;
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
            };

            #endregion

            Common.Evaluate(@"
save-file:existing.txt
   .:foo
", fileService);
            Assert.True(saveInvoked);
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

        [Slot(Name = "foo",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsDescription = "Resolves to the constant string \"success\"")]
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
   input:string
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
   input:string
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
