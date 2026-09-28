/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using MimeKit;
using MimeKit.IO;
using magic.node;
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
        /// <param name="signaler">Signaler used to construct message, and to open files for entities declaring a [filename].</param>
        /// <param name="input">Hierarchical node structure representing the MIME message in lambda format.</param>
        /// <returns>A MIME entity object encapsulating the specified lambda object</returns>
        public static async Task<MimeEntity> CreateAsync(
            ISignaler signaler,
            Node input)
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
                    return await CreateLeafPartAsync(mainType, subType, input, signaler);

                case "multipart":
                    return await CreateMultipartAsync(signaler, subType, input);

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
            ISignaler signaler)
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
                    await CreateContentObjectFromFilenameAsync(contentNode, result, signaler);
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
            Node messageNode)
        {
            var result = new Multipart(subType);
            DecorateEntityHeaders(result, messageNode);

            foreach (var idxPart in messageNode.Children.Where(x => x.Name == "entity"))
            {
                result.Add(await CreateAsync(signaler, idxPart));
            }
            return result;
        }

        /*
         * Creates ContentObject from value found in node. Transfer encoding is
         * controlled exclusively through the standard MIME `Content-Transfer-Encoding`
         * header inside the [headers] block — DecorateEntityHeaders writes it to
         * entity.Headers, and MimeKit picks up the encoding from there when serializing.
         */
        static async Task CreateContentObjectFromObjectAsync(Node contentNode, MimePart part)
        {
            /*
             * An uploaded file reaches Hyperlambda as an open Stream rather than as text - see the
             * multipart handler in magic.endpoint - so a Stream is attached as the part's content
             * directly. Letting it fall through to the string logic below would stringify the Stream
             * object itself, and the part would contain the type's name instead of the file.
             */
            if (contentNode.GetEx<object>() is Stream streamContent)
            {
                part.Content = new MimeContent(streamContent, ContentEncoding.Default);
                return;
            }

            var stream = new MemoryBlockStream();
            var content = contentNode.GetEx<string>() ??
                throw new HyperlambdaException("No actual [content] supplied to message");
            var writer = new StreamWriter(stream);
            await writer.WriteAsync(content);
            await writer.FlushAsync();
            stream.Position = 0;
            part.Content = new MimeContent(stream, ContentEncoding.Default);
        }

        /*
         * Creates ContentObject from filename. Transfer encoding is controlled
         * exclusively through the standard MIME `Content-Transfer-Encoding` header
         * inside the [headers] block.
         */
        static async Task CreateContentObjectFromFilenameAsync(
            Node contentNode,
            MimePart part,
            ISignaler signaler)
        {
            var filename = contentNode.GetEx<string>() ?? throw new HyperlambdaException("No [filename] value provided");

            // Checking if explicit disposition was specified.
            if (part.ContentDisposition == null)
            {
                // Defaulting Content-Disposition to; "attachment; filename=whatever.xyz"
                part.ContentDisposition = new ContentDisposition("attachment")
                {
                    FileName = Path.GetFileName(filename)
                };
            }

            /*
             * Opening the file through its slot rather than the file service directly, and
             * deliberately WITHOUT exempting it from the whitelist - the path came from the caller,
             * so a whitelist in scope decides whether this caller may attach this particular file.
             */
            var file = new Node("", filename);
            await signaler.SignalAsync("io.stream.open-file", file);
            part.Content = new MimeContent((Stream)file.Value, ContentEncoding.Default);
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
