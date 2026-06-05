/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Net.Http;
using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.http.contracts;

namespace magic.lambda.http
{
    /// <summary>
    /// Invokes the HTTP GET verb towards some resource.
    /// </summary>
    [Slot(
        Name = "http.get",
        Description = "Issues an HTTP GET to the specified URL and returns the response body, status code, and headers",
        ValueKind = "url-template",
        ValueDescription = "URL to send the request to; supports {placeholder} segments substituted from [url-params]",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "http-response",
        ReturnsDescription = "Resolves to the HTTP status code in value and response headers and content as child nodes",
        SignatureType = typeof(global::magic.lambda.http.signatures.HttpEmptyRequestSignature))]
    public class HttpGet : ISlotAsync
    {
        readonly IMagicHttp _service;

        /// <summary>
        /// Creates an instance of your class.
        /// </summary>
        /// <param name="service">Actual implementation.</param>
        public HttpGet(IMagicHttp service)
        {
            _service = service;
        }

        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaiatble task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await _service.Invoke(signaler, HttpMethod.Get, input);
        }
    }
}
