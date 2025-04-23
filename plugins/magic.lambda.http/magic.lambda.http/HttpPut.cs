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
    /// Invokes the HTTP PUT verb towards some resource.
    /// </summary>
    [Slot(Name = "http.put")]
    public class HttpPut : ISlotAsync
    {
        readonly IMagicHttp _service;

        /// <summary>
        /// Creates an instance of your class.
        /// </summary>
        /// <param name="service">Actual implementation.</param>
        public HttpPut(IMagicHttp service)
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
            await _service.Invoke(signaler, HttpMethod.Put, input);
        }
    }
}
