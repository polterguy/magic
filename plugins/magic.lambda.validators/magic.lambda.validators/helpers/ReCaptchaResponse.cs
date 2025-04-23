/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Newtonsoft.Json;

namespace magic.lambda.validators.helpers
{
    /*
     * reCAPTCHA response model, returned from reCAPTCHA's API upon verification.
     */
    internal class RecaptchaResponse
    {
        /*
         * Whether or not invocation was a success or not.
         */
        [JsonProperty("success")]
        public bool Success { get; set; }

        /*
         * Score returned from reCAPTCHA. 0.1 indicates highly likely a bot, 0.9 indicates highly likely a human.
         */
        [JsonProperty("score")]
        public decimal? Score { get; set; }

        /*
         * Error codes returned if reCAPTCHA couldn't for some reasons determine whether or not the user was a human or a bot.
         */
        [JsonProperty("error-codes")]
        public string[] ErrorCodes { get; set; }
    }
}
