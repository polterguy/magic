/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using net = System.Net.Http;
using System.Threading.Tasks;
using System.Net.Http.Headers;
using log4net;
using Newtonsoft.Json.Linq;
using magic.http.contracts;

namespace magic.http.services
{
    public class HttpClient : IHttpClient
    {
        static readonly net.HttpClient _client;

        private readonly ILog _logger;

        static HttpClient()
        {
            _client = new net.HttpClient();
        }

        public HttpClient()
        {
            _logger = LogManager.GetLogger(this.GetType());
        }

        #region [ -- Interface implementation -- ]

        public async Task<Response> PostAsync<Request, Response>(
            string url,
            Request input,
            string token = null)
        {
            _logger.Info($"Invoking HTTP POST towards '{url}' with input '{input}'");
            return await CreateRequest<Response>(url, net.HttpMethod.Post, input, token);
        }

        public async Task<Response> PutAsync<Request, Response>(
            string url,
            Request input,
            string token = null)
        {
            _logger.Info($"Invoking HTTP PUT towards '{url}' with input '{input}'");
            return await CreateRequest<Response>(url, net.HttpMethod.Put, input, token);
        }

        public async Task<Response> GetAsync<Response>(
            string url,
            string token = null)
        {
            _logger.Info($"Invoking HTTP GET towards '{url}'");
            return await CreateRequest<Response>(url, net.HttpMethod.Get, token);
        }

        public async Task GetAsync(
            string url,
            Action<Stream> functor,
            string accept = null,
            string token = null)
        {
            _logger.Info($"Invoking HTTP GET towards '{url}' with stream callback");
            await CreateRequest(url, net.HttpMethod.Get, functor, accept, token);
        }

        public async Task<Response> DeleteAsync<Response>(
            string url,
            string token = null)
        {
            _logger.Info($"Invoking HTTP DELETE towards '{url}'");
            return await CreateRequest<Response>(url, net.HttpMethod.Delete, token);
        }

        #endregion

        #region [ -- Protected virtual methods -- ]

        virtual protected async Task<Response> CreateRequest<Response>(
            string url,
            net.HttpMethod method,
            string token)
        {
            return await CreateRequestMessage(url, method, token, async (msg) =>
            {
                return await GetResult<Response>(msg);
            });
        }

        virtual protected async Task<Response> CreateRequest<Response>(
            string url,
            net.HttpMethod method,
            object input,
            string token)
        {
            return await CreateRequestMessage(url, method, token, async (msg) =>
            {
                if (input is Stream stream)
                {
                    using (var content = new net.StreamContent(stream))
                    {
                        content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                        msg.Content = content;
                        return await GetResult<Response>(msg);
                    }
                }
                else
                {
                    using (var content = new net.StringContent(JObject.FromObject(input).ToString()))
                    {
                        content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                        msg.Content = content;
                        return await GetResult<Response>(msg);
                    }
                }
            });
        }

        virtual protected async Task CreateRequest(
            string url,
            net.HttpMethod method,
            Action<Stream> functor,
            string accept,
            string token)
        {
            using(var msg = new net.HttpRequestMessage())
            {
                msg.RequestUri = new Uri(url);
                msg.Method = method;

                if (accept != null)
                    msg.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue(accept));

                if (token != null)
                    msg.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

                using (var response = await _client.SendAsync(msg))
                {
                    using (var content = response.Content)
                    {
                        if (!response.IsSuccessStatusCode)
                            throw new Exception(await content.ReadAsStringAsync());

                        functor(await content.ReadAsStreamAsync());
                    }
                }
            }
        }

        virtual protected async Task<Response> CreateRequestMessage<Response>(
            string url,
            net.HttpMethod method,
            string token,
            Func<net.HttpRequestMessage, Task<Response>> functor)
        {
            using(var msg = new net.HttpRequestMessage())
            {
                msg.RequestUri = new Uri(url);
                msg.Method = method;
                msg.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                msg.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/plain"));

                if (token != null)
                    msg.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

                return await functor(msg);
            }
        }

        virtual protected async Task<Response> GetResult<Response>(net.HttpRequestMessage msg)
        {
            using (var response = await _client.SendAsync(msg))
            {
                using (var content = response.Content)
                {
                    var responseContent = await content.ReadAsStringAsync();

                    if (!response.IsSuccessStatusCode)
                        throw new Exception(responseContent);

                    if (typeof(IConvertible).IsAssignableFrom(typeof(Response)))
                        return (Response)Convert.ChangeType(responseContent, typeof(Response));

                    return JToken.Parse(responseContent).ToObject<Response>();
                }
            }
        }

        #endregion
    }
}