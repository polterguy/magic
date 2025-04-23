/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Net.Http.Headers;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.openai
{
    [Slot(Name = "openai.whisper")]
    public class Whisper : ISlotAsync
    {
        readonly HttpClient _httpClient;
        private const string WhisperEndpoint = "https://api.openai.com/v1/audio/transcriptions";

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="resolver">Passed in from IoC</param>
        /// <param name="httpClient">Passed in from IoC</param>
        public Whisper(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var key = input.Children.FirstOrDefault(x => x.Name == "key")?.GetEx<string>()
                ?? throw new HyperlambdaException("No [key] provide to [openai.whisper]");

            var content = input.Children.FirstOrDefault(x => x.Name == "content")?.GetEx<byte[]>()
                ?? throw new HyperlambdaException("No [content] provide to [openai.whisper]");

            var type = input.Children.FirstOrDefault(x => x.Name == "type")?.GetEx<string>()
                ?? throw new HyperlambdaException("No [type] provide to [openai.whisper]");

            var language = input.Children.FirstOrDefault(x => x.Name == "language")?.GetEx<string>();

            var transcriptionResult = await SendWhisperRequest(key, "whisper-1", content, type, language);

            input.Clear();
            input.Value = null;
            var tmp = new Node("", transcriptionResult);
            signaler.Signal("json2lambda", tmp);
            input.Value = tmp.Children.FirstOrDefault(x => x.Name == "text")?.GetEx<string>();
        }

        /*
         * Private helper methods.
         */

        private async Task<string> SendWhisperRequest(
            string apiKey,
            string model,
            byte[] content,
            string mimeType,
            string language)
        {
            using(var formContent = new MultipartFormDataContent())
            {
                formContent.Add(new StringContent(model), "model");
                if (!string.IsNullOrEmpty(language))
                    formContent.Add(new StringContent(language), "language");

                using (var stream = new MemoryStream(content))
                {
                    using (var fileContent = new StreamContent(stream))
                    {
                        fileContent.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                        formContent.Add(fileContent, "file", "audio." + mimeType.Split('/')[1]);

                        using (var request = new HttpRequestMessage(HttpMethod.Post, WhisperEndpoint)
                        {
                            Content = formContent
                        })
                        {
                            request.Headers.Add("Authorization", "Bearer " + apiKey);
                            using (var response = await _httpClient.SendAsync(request))
                            {
                                var responseBody = await response.Content.ReadAsStringAsync();

                                if (!response.IsSuccessStatusCode)
                                    throw new HyperlambdaException($"Failed to transcribe audio. Status: {response.StatusCode}, Body: {responseBody}");

                                return responseBody;
                            }
                        }
                    }
                }
            }
        }
    }
}