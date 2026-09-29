/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using iText.StyledXmlParser.Resolver.Resource;

namespace magic.lambda.pdf
{
    /// <summary>
    /// Resource retriever for [html2pdf], routing every resource a converted document references - images,
    /// stylesheets, fonts - through Magic's own [io.file.load.binary] and [http.get] slots, rather than
    /// letting iText read files and issue HTTP requests on its own. This subjects such resources to
    /// whatever [whitelist] is in scope, exactly like any other slot invocation.
    /// </summary>
    // itext.pdfhtml 6.3.1's ConverterProperties.SetResourceRetriever still only accepts this
    // namespace's IResourceRetriever, even though iText.IO.Resolver.Resource.IResourceRetriever
    // has superseded it - hence implementing the obsolete one is deliberate, not an oversight.
    public class SignalerResourceRetriever : IResourceRetriever
    {
        readonly ISignaler _signaler;

        /// <summary>
        /// Creates a new instance of your type.
        /// </summary>
        /// <param name="signaler">Signaler used to route resource fetches through their whitelisted slots.</param>
        public SignalerResourceRetriever(ISignaler signaler)
        {
            _signaler = signaler;
        }

        /// <inheritdoc />
        public byte[] GetByteArrayByUrl(Uri url)
        {
            return GetBytes(url);
        }

        /// <inheritdoc />
        public Stream GetInputStreamByUrl(Uri url)
        {
            return new MemoryStream(GetBytes(url));
        }

        #region [ -- Private helper methods -- ]

        /*
         * Retrieves the bytes of the specified resource by dispatching to the slot matching its URI
         * scheme, such that the invocation is checked against whatever [whitelist] is in scope.
         */
        byte[] GetBytes(Uri url)
        {
            switch (url.Scheme)
            {
                case "file":

                    var file = new Node("io.file.load.binary", url.AbsolutePath);
                    _signaler.Signal("io.file.load.binary", file);
                    return file.Get<byte[]>();

                case "http":
                case "https":

                    var request = new Node("http.get", url.ToString());
                    _signaler.Signal("http.get", request);
                    return request.Children.FirstOrDefault(x => x.Name == "content")?.Get<byte[]>() ??
                        throw new HyperlambdaException($"[html2pdf] got no content back from '{url}'");

                default:

                    throw new HyperlambdaException($"[html2pdf] does not support the '{url.Scheme}' URI scheme for resources");
            }
        }

        #endregion
    }
}
