/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using MimeKit;
using MimeKit.IO;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using System.Threading.Tasks;

namespace magic.lambda.mime.helpers
{
    /// <summary>
    /// Helper class to create MIME messages.
    /// </summary>
    public static class MimeCreator
    {
        /// <summary>
        /// Creates a MimeEntity from the specified lambda object and returns the
        /// result as a MimeEntity to caller.
        /// </summary>
        /// <param name="signaler">Signaler used to construct message.</param>
        /// <param name="input">Hierarchical node structure representing the MIME message in lambda format.</param>
        /// <param name="streamService">Needed in case one of our MIME entities wants to read files from the file service.</param>
        /// <param name="rootResolver">Needed to determine root folder for files.</param>
        /// <returns>A MIME entity object encapsulating the specified lambda object</returns>
        public static async Task<MimeEntity> CreateAsync(
            ISignaler signaler,
            Node input,
            IStreamService streamService,
            IRootResolver rootResolver)
        {
            // Finding Content-Type of entity.
            var type = input.GetEx<string>();
            if (!type.Contains("/"))
                throw new HyperlambdaException($"'{type}' is an unknown MIME Content-Type. Please provide a valid MIME type as the value of your node.");

            var tokens = type.Split('/');
            if (tokens.Length != 2)
                throw new HyperlambdaException($"'{type}' is an unknown MIME Content-Type. Please provide a valid MIME type as the value of your node.");

            var mainType = tokens[0];
            var subType = tokens[1];
            switch (mainType)
            {
                case "application":
                case "text":
                    return await CreateLeafPartAsync(mainType, subType, input, streamService, rootResolver);

                case "multipart":
                    return await CreateMultipartAsync(signaler, subType, input, streamService, rootResolver);

                default:
                    throw new HyperlambdaException($"I don't know how to handle the '{type}' MIME type.");
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Creates a leaf part, implying no MimePart children.
         */
        static async Task<MimePart> CreateLeafPartAsync(
            string mainType,
            string subType,
            Node messageNode,
            IStreamService streamService,
            IRootResolver rootResolver)
        {
            // Retrieving [content] node.
            var contentNode = messageNode.Children.FirstOrDefault(x => x.Name == "content" || x.Name == "filename") ??
                throw new HyperlambdaException("No [content] or [filename] provided for your entity");

            var result = new MimePart(ContentType.Parse(mainType + "/" + subType));
            DecorateEntityHeaders(result, messageNode);

            switch (contentNode.Name)
            {
                case "content":
                    await CreateContentObjectFromObjectAsync(contentNode, result);
                    break;

                case "filename":
                    await CreateContentObjectFromFilenameAsync(contentNode, result, streamService, rootResolver);
                    break;
            }
            return result;
        }

        /*
         * Creates a multipart of some sort.
         */
        static async Task<Multipart> CreateMultipartAsync(
            ISignaler signaler,
            string subType,
            Node messageNode,
            IStreamService streamService,
            IRootResolver rootResolver)
        {
            var result = new Multipart(subType);
            DecorateEntityHeaders(result, messageNode);

            foreach (var idxPart in messageNode.Children.Where(x => x.Name == "entity"))
            {
                result.Add(await CreateAsync(signaler, idxPart, streamService, rootResolver));
            }
            return result;
        }

        /*
         * Creates ContentObject from value found in node.
         */
        static async Task CreateContentObjectFromObjectAsync(Node contentNode, MimePart part)
        {
            var stream = new MemoryBlockStream();
            var content = contentNode.GetEx<string>() ??
                throw new HyperlambdaException("No actual [content] supplied to message");
            var writer = new StreamWriter(stream);
            await writer.WriteAsync(content);
            await writer.FlushAsync();
            stream.Position = 0;

            var encoding = ContentEncoding.Default;
            var encodingNode = contentNode.Children.FirstOrDefault(x => x.Name == "Content-Encoding");
            if (encodingNode != null)
                encoding = (ContentEncoding)Enum.Parse(typeof(ContentEncoding), encodingNode.GetEx<string>(), true);
            part.Content = new MimeContent(stream, encoding);
        }

        /*
         * Creates ContentObject from filename.
         */
        static async Task CreateContentObjectFromFilenameAsync(
            Node contentNode,
            MimePart part,
            IStreamService streamService,
            IRootResolver rootResolver)
        {
            var filename = contentNode.GetEx<string>() ?? throw new HyperlambdaException("No [filename] value provided");

            // Checking if explicit encoding was supplied.
            ContentEncoding encoding = ContentEncoding.Default;
            var encodingNode = contentNode.Children.FirstOrDefault(x => x.Name == "Content-Encoding");
            if (encodingNode != null)
                encoding = (ContentEncoding)Enum.Parse(typeof(ContentEncoding), encodingNode.GetEx<string>(), true);

            // Checking if explicit disposition was specified.
            if (part.ContentDisposition == null)
            {
                // Defaulting Content-Disposition to; "attachment; filename=whatever.xyz"
                part.ContentDisposition = new ContentDisposition("attachment")
                {
                    FileName = Path.GetFileName(filename)
                };
            }
            part.Content = new MimeContent(
                await streamService.OpenFileAsync(
                    rootResolver.AbsolutePath(filename.TrimStart('/'))),
                    encoding);
        }

        /*
         * Decorates MimeEntity with headers specified in Node children collection.
         */
        static void DecorateEntityHeaders(MimeEntity entity, Node messageNode)
        {
            var headerNode = messageNode.Children.FirstOrDefault(x => x.Name == "headers");
            if (headerNode == null)
                return; // No headers

            foreach (var idx in headerNode.Children.Where(ix => ix.Name != "Content-Type"))
            {
                entity.Headers.Replace(idx.Name, idx.GetEx<string>());
            }
        }

        #endregion
    }
}
