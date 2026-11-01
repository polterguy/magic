/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using magic.node.extensions;

namespace magic.lambda.git
{
    internal static class GitHubApi
    {
        const string DefaultApiBase = "https://api.github.com";

        public static async Task<string> SendAsync(
            HttpClient httpClient,
            IConfiguration configuration,
            HttpMethod method,
            string path,
            string content = null,
            string mediaType = "application/json")
        {
            var apiBase = (configuration?["magic:git:github:api-base"] ?? DefaultApiBase).TrimEnd('/');
            var token = configuration?["magic:git:github:token"];
            if (string.IsNullOrWhiteSpace(token))
                throw new HyperlambdaException("Missing configuration value 'magic:git:github:token'");

            var username = configuration?["magic:git:github:username"];
            var userAgent = string.IsNullOrWhiteSpace(username) ? "magic.lambda.git" : $"magic.lambda.git ({username})";

            var url = apiBase + "/" + path.TrimStart('/');

            using var request = new HttpRequestMessage(method, url);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
            request.Headers.UserAgent.ParseAdd(userAgent);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            if (content != null)
                request.Content = new StringContent(content, Encoding.UTF8, mediaType);

            using var response = await httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                var status = (int)response.StatusCode;
                throw new HyperlambdaException($"GitHub API request failed. Status: {status} {response.ReasonPhrase}, Body: {body}");
            }

            return body;
        }

        public static string GetDefaultOwner(IConfiguration configuration)
        {
            var owner = configuration?["magic:git:github:username"];
            if (string.IsNullOrWhiteSpace(owner))
                throw new HyperlambdaException("Missing configuration value 'magic:git:github:username'");
            return owner;
        }
    }
}
