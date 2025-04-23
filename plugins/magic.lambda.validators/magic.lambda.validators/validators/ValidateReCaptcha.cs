/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Net;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.validators.helpers;

namespace magic.lambda.validators.validators
{
    /// <summary>
    /// [validators.recaptcha] slot, for using reCAPTCHA validators.
    /// </summary>
    [Slot(Name = "validators.recaptcha")]
    public class ValidateReCaptcha : ISlotAsync
    {
        readonly HttpClient _httpClient;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="httpClient">Needed to invoke reCAPTCHA's API</param>
        public ValidateReCaptcha(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        /// <returns>Awaitable task</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Retrieving arguments and sanity checking invocation.
            var site_key = input.Children.FirstOrDefault(x => x.Name == "site-key").GetEx<string>() ??
                throw new HyperlambdaException("No [site-key] supplied to [validators.recaptcha]");
            var secret = input.Children.FirstOrDefault(x => x.Name == "secret").GetEx<string>() ??
                throw new HyperlambdaException("No [secret] supplied to [validators.recaptcha]");
            var min = input.Children.FirstOrDefault(x => x.Name == "min").GetEx<decimal?>() ??
                throw new HyperlambdaException("No [min] supplied to [validators.recaptcha]");
            var token = input.GetEx<string>() ?? 
                throw new HyperlambdaException("No value/token supplied to [validators.recaptcha]");

            // House cleanups.
            input.Value = null;
            input.Clear();

            // Invoking reCAPTCHA API and sanity checking result.
            var response = await _httpClient.GetAsync($"https://www.google.com/recaptcha/api/siteverify?secret={secret}&response={token}");
            if (response.StatusCode != HttpStatusCode.OK)
                throw new HyperlambdaException("reCAPTCHA didn't return success code, are you sure your server can resolve reCAPTCHA's servers?");

            // Parsing result.
            var jsonResponse = await response.Content.ReadAsStringAsync();
            var result = JsonConvert.DeserializeObject<RecaptchaResponse>(jsonResponse);

            // Sanity checking invocation.
            if (result.Score == null || !result.Success)
                throw new HyperlambdaException(
                        $"There was an error while invoking while invoking reCAPTCHA, error code was '{result.ErrorCodes?.FirstOrDefault() ?? "null"}'",
                        true,
                        500,
                        "recaptcha");

            // Verifying score is above threshold.
            if (result.Score.Value < min)
                throw new HyperlambdaException(
                        $"Invocation to reCAPTCHA was below {min}, its value was {result.Score}, token was '{token}'",
                        true,
                        400,
                        "recaptcha");
        }
    }
}
