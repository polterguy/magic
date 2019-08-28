/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.http.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.http
{
    [Slot(Name = "http.post.json")]
    public class HttpPostJson : ISlot, IMeta
    {
        readonly ISignaler _signaler;
        readonly IHttpClient _httpClient;

        public HttpPostJson(ISignaler signaler, IHttpClient httpClient)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() > 2 || input.Children.Any((x) => x.Name != "token" && x.Name != "payload"))
                throw new ApplicationException("[http.post.json] can only handle one [token] and one [payload] child node");

            var url = input.GetEx<string>(_signaler);
            var token = input.Children.FirstOrDefault((x) => x.Name == "token")?.GetEx<string>(_signaler);
            var payload = input.Children.FirstOrDefault((x) => x.Name == "payload")?.GetEx<string>(_signaler);

            // Notice, to sanity check the result we still want to roundtrip through a JToken result.
            input.Value = _httpClient.PostAsync<string, string>(url, payload, token).Result;
            input.Clear();
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("token", 1);
            yield return new Node("payload", 1);
        }
    }
}
