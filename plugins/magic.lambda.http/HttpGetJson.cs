/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.http.contracts;
using magic.signals.contracts;

namespace magic.lambda.http
{
    [Slot(Name = "http.get.json")]
    public class HttpGetJson : ISlot, IMeta
    {
        readonly ISignaler _signaler;
        readonly IHttpClient _httpClient;

        public HttpGetJson(IServiceProvider services, IHttpClient httpClient)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() > 1 || input.Children.Any((x) => x.Name != "token"))
                throw new ApplicationException("[http.get.json] can only handle one [token] child node");

            _signaler.Signal("eval", input);
            var url = input.Get<string>();
            var token = input.Children.FirstOrDefault((x) => x.Name == "token")?.Get<string>();
            var result = _httpClient.GetAsync<object>(
                url,
                token).Result;
            input.Value = result.ToString();
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("token", 1);
        }
    }
}
