/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.io.signatures
{
    /// <summary>
    /// Child signature for slots that consume one evaluated child value.
    /// </summary>
    public abstract class SingleContentSignature : ISlotSignature
    {
        readonly string _type;
        readonly string _kind;
        readonly string _description;

        /// <summary>
        /// Creates a child signature for one content node.
        /// </summary>
        /// <param name="type">Documented content type.</param>
        /// <param name="kind">Semantic kind of the child value.</param>
        /// <param name="description">Documented content description.</param>
        protected SingleContentSignature(string type, string kind, string description)
        {
            _type = type;
            _kind = kind;
            _description = description;
        }

        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = _type,
                Kind = _kind,
                Description = _description,
                Required = true,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ExactlyOne,
            },
        };
    }

    /// <summary>
    /// Child signature for text file save slots.
    /// </summary>
    public class TextFileSaveSignature : SingleContentSignature
    {
        /// <summary>
        /// Creates an instance of the signature.
        /// </summary>
        public TextFileSaveSignature()
            : base("string", "text-file-content,text", "Child node yielding the text content to save")
        { }
    }

    /// <summary>
    /// Child signature for binary file save slots.
    /// </summary>
    public class BinaryFileSaveSignature : SingleContentSignature
    {
        /// <summary>
        /// Creates an instance of the signature.
        /// </summary>
        public BinaryFileSaveSignature()
            : base("byte[]", "binary-file-content", "Child node yielding the binary content to save")
        { }
    }

    /// <summary>
    /// Child signature for file and folder copy/move slots.
    /// </summary>
    public class CopyMoveSignature : SingleContentSignature
    {
        /// <summary>
        /// Creates an instance of the signature.
        /// </summary>
        public CopyMoveSignature()
            : base("string", "file-path", "Destination path")
        { }
    }

    /// <summary>
    /// Child signature for file copy/move slots.
    /// </summary>
    public class FileCopyMoveSignature : SingleContentSignature
    {
        /// <summary>
        /// Creates an instance of the signature.
        /// </summary>
        public FileCopyMoveSignature()
            : base("string", "file-path", "Destination path")
        { }
    }

    /// <summary>
    /// Child signature for folder copy/move slots.
    /// </summary>
    public class FolderCopyMoveSignature : SingleContentSignature
    {
        /// <summary>
        /// Creates an instance of the signature.
        /// </summary>
        public FolderCopyMoveSignature()
            : base("string", "folder-path", "Destination path")
        { }
    }

    /// <summary>
    /// Child signature for [io.file.load-recursively]. No input children; OutputChildren
    /// describes the wrapper-per-file return shape so consumers iterating the result
    /// know how to address [name] and [content] children rather than the wrapper's
    /// (null) value.
    /// </summary>
    public class LoadFilesRecursivelySignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new List<SlotChild>();

        /// <inheritdoc />
        public IEnumerable<SlotChild> OutputChildren => new[]
        {
            new SlotChild
            {
                Name = ".",
                Type = "lambda",
                Kind = "loaded-file",
                Description = "One loaded file entry; access fields via the [name] and [content] children",
                Required = false,
                Mode = SlotChildMode.Value,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.StructuredTree,
                Children =
                {
                    new SlotChild
                    {
                        Name = "name",
                        Type = "string",
                        Kind = "file-path",
                        Description = "Relative file path of the loaded file",
                        Required = true,
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ExactlyOne,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                    new SlotChild
                    {
                        Name = "content",
                        Type = "string",
                        Kind = "text-file-content",
                        Description = "Loaded file content as text",
                        Required = true,
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ExactlyOne,
                        Role = SlotChildRole.Payload,
                        Projection = SlotChildProjection.Value,
                    },
                },
            },
        };
    }

    /// <summary>
    /// Child signature for file and folder list slots.
    /// </summary>
    public class ListDirectorySignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "display-hidden",
                Type = "bool",
                Kind = "boolean",
                Description = "Whether hidden files or folders should be included",
                Required = false,
                DefaultValue = "false",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            },
            new SlotChild
            {
                Name = "display-system",
                Type = "bool",
                Kind = "boolean",
                Description = "Whether system folders such as /system/, /misc/, /data/, and /config/ should be included",
                Required = false,
                DefaultValue = "true",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            },
        };
    }

    /// <summary>
    /// Child signature for patch file slot.
    /// </summary>
    public class PatchFileSignature : SingleContentSignature
    {
        /// <summary>
        /// Creates an instance of the signature.
        /// </summary>
        public PatchFileSignature()
            : base("string", "unified-diff", "Unified diff patch content to apply")
        { }
    }

    /// <summary>
    /// Child signature for file execution slots.
    /// </summary>
    public class ExecuteFileSignature : ISlotSignature
    {
        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "object",
                Kind = "value",
                Description = "Named argument passed to the executed file as a child of [.arguments]",
                Required = false,
                Mode = SlotChildMode.Arguments,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.Arguments,
                Projection = SlotChildProjection.ArgumentBag,
            },
        };

        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> OutputChildren => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "lambda",
                Kind = "hyperlambda-result-node",
                Description = "Returned child node produced by the executed Hyperlambda file",
                Required = false,
                Mode = SlotChildMode.Value,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.Payload,
                Projection = SlotChildProjection.Self,
            },
        };
    }

    /// <summary>
    /// Child signature for [execute-file], which unwraps argument expressions first.
    /// </summary>
    public class ExecuteFileUnwrapSignature : ExecuteFileSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "object",
                Kind = "value",
                Description = "Named argument passed to the executed file as a child of [.arguments]",
                Required = false,
                Mode = SlotChildMode.Arguments,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Preprocess = SlotChildPreprocess.UnwrapExpressions,
                Role = SlotChildRole.Arguments,
                Projection = SlotChildProjection.ArgumentBag,
            },
        };
    }

    /// <summary>
    /// Child signature for file search slot.
    /// </summary>
    public class SearchFileSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "pattern",
                Type = "string",
                Kind = "search-pattern",
                Description = "Text or regular expression pattern to search for",
                Required = true,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ExactlyOne,
            },
            new SlotChild
            {
                Name = "regex",
                Type = "bool",
                Kind = "search-regex-mode",
                Description = "Whether [pattern] should be interpreted as a regular expression",
                Required = false,
                DefaultValue = "false",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            },
            new SlotChild
            {
                Name = "case-sensitive",
                Type = "bool",
                Kind = "boolean",
                Description = "Whether matching should be case-sensitive",
                Required = false,
                DefaultValue = "false",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            },
            new SlotChild
            {
                Name = "extensions",
                Type = "string",
                Kind = "text-file-extension-list",
                Description = "Optional comma-separated file extensions to include",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            },
        };

        /// <inheritdoc />
        public IEnumerable<SlotChild> OutputChildren => new[]
        {
            new SlotChild
            {
                Name = ".",
                Type = "lambda",
                Kind = "file-search-result",
                Description = "Search result object for one matching file",
                Required = false,
                Mode = SlotChildMode.None,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.StructuredTree,
                Children =
                {
                    new SlotChild
                    {
                        Name = "file",
                        Type = "string",
                        Kind = "file-path",
                        Description = "Relative path to the matching file",
                        Required = true,
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ExactlyOne,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                    new SlotChild
                    {
                        Name = "lines",
                        Type = "lambda",
                        Kind = "line-number-list",
                        Description = "Line numbers containing matches in the file",
                        Required = true,
                        Mode = SlotChildMode.None,
                        Cardinality = SlotChildCardinality.ExactlyOne,
                        Role = SlotChildRole.StructuredObject,
                        Projection = SlotChildProjection.Children,
                        Children =
                        {
                            new SlotChild
                            {
                                Name = ".",
                                Type = "int",
                                Kind = "line-number",
                                Description = "One matching line number",
                                Required = false,
                                Mode = SlotChildMode.Value,
                                Cardinality = SlotChildCardinality.ZeroOrMore,
                                Role = SlotChildRole.Option,
                                Projection = SlotChildProjection.Value,
                            },
                        },
                    },
                },
            },
        };
    }

    /// <summary>
    /// Child signature for unzip slot.
    /// </summary>
    public class UnzipFileSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "folder",
                Type = "string",
                Kind = "folder-path",
                Description = "Destination folder; defaults to the zip file's folder",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            },
            new SlotChild
            {
                Name = "overwrite",
                Type = "bool",
                Kind = "boolean",
                Description = "Whether existing extracted files should be overwritten",
                Required = false,
                DefaultValue = "false",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            },
        };
    }

    /// <summary>
    /// Child signature for creating ZIP streams from supplied entries.
    /// </summary>
    public class ZipContentSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "string",
                Kind = "zip-entry-path",
                Description = "ZIP entry path",
                Required = true,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.OneOrMore,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "string|byte[]",
                        Kind = "zip-entry-content",
                        Description = "Entry content",
                        Required = true,
                        Mode = SlotChildMode.ExecutableLambda,
                        Cardinality = SlotChildCardinality.ExactlyOne,
                    },
                },
            },
        };
    }

    /// <summary>
    /// Child signature for saving streams to files.
    /// </summary>
    public class SaveStreamToFileSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "overwrite",
                Type = "bool",
                Kind = "boolean",
                Description = "Whether an existing file should be overwritten",
                Required = false,
                DefaultValue = "true",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            },
            new SlotChild
            {
                Name = "*",
                Type = "Stream",
                Kind = "stream",
                Description = "Child node yielding the stream to save",
                Required = true,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ExactlyOne,
            },
        };
    }

    /// <summary>
    /// Child signature for [io.file.mixin].
    /// </summary>
    public class FileMixinSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "object",
                Kind = "value",
                Description = "Optional argument available to codebehind lambda loaded for the mixed file",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.Arguments,
                Projection = SlotChildProjection.ArgumentBag,
            },
        };
    }
}
