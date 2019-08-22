/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Net;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using Microsoft.AspNetCore.Mvc;
using magic.node;
using magic.signals.contracts;
using magic.hyperlambda.utils;
using magic.endpoint.contracts;
using magic.endpoint.services.init;

namespace magic.endpoint.services
{
    public class Executor : IExecutor
    {
        readonly ISignaler _signaler;

        public Executor(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public ActionResult ExecuteGet(string url, Dictionary<string, string> args)
        {
            return ExecuteUrl(url, "get", args);
        }

        public ActionResult ExecuteDelete(string url, Dictionary<string, string> args)
        {
            return ExecuteUrl(url, "delete", args);
        }

        public ActionResult ExecutePost(string url, JContainer payload)
        {
            return ExecuteUrl(url, "post", payload);
        }

        public ActionResult ExecutePut(string url, JContainer payload)
        {
            return ExecuteUrl(url, "put", payload);
        }

        #region [ -- Private helper methods -- ]

        ActionResult ExecuteUrl(
            string url,
            string verb,
            Dictionary<string, string> arguments)
        {
            // Sanity checking URL
            url = SanityCheckUrl(url);
            var path = ConfigureServices.Root + url + $".{verb}.hl";
            if (!File.Exists(path))
                return new NotFoundResult();

            using (var stream = File.OpenRead(path))
            {
                var lambda = new Parser(stream).Lambda();

                /*
                 * Checking file [.arguments], and if given, removing them to make sure invocation of file
                 * only has a single [.arguments] node.
                 * Notice, future improvements implies validating arguments.
                 */
                var fileArgs = lambda.Children.Where((x) => x.Name == ".arguments");
                if (fileArgs.Any())
                {
                    if (fileArgs.Count() > 1)
                        throw new ApplicationException($"URL '{url}' has an invalid [.arguments] declaration. Multiple [.arguments] nodes found in endpoint's file");

                    fileArgs.First().UnTie();
                }

                // Adding arguments from invocation to evaluated lambda node.
                if (arguments.Count > 0)
                {
                    var argsNode = new Node(".arguments");
                    argsNode.AddRange(arguments.Select((x) => new Node(x.Key, x.Value)));
                    lambda.Insert(0, argsNode);
                }

                _signaler.Signal("eval", lambda);

                var result = GetReturnValue(lambda);
                if (result != null)
                    return new OkObjectResult(result);

                return new OkResult();
            }
        }

        ActionResult ExecuteUrl(
            string url,
            string verb,
            JContainer arguments)
        {
            // Sanity checking URL
            url = SanityCheckUrl(url);
            var path = ConfigureServices.Root + url + $".{verb}.hl";
            if (!File.Exists(path))
                return new NotFoundResult();

            using (var stream = File.OpenRead(path))
            {
                var lambda = new Parser(stream).Lambda();

                /*
                 * Checking file [.arguments], and if given, removing them to make sure invocation of file
                 * only has a single [.arguments] node.
                 * Notice, future improvements implies validating arguments.
                 */
                var fileArgs = lambda.Children.Where((x) => x.Name == ".arguments");
                if (fileArgs.Any())
                {
                    if (fileArgs.Count() > 1)
                        throw new ApplicationException($"URL '{url}' has an invalid [.arguments] declaration. Multiple [.arguments] nodes found in endpoint's file");

                    fileArgs.First().UnTie();
                }

                // Adding arguments from invocation to evaluated lambda node.
                var argsNode = new Node(".arguments", arguments);
                _signaler.Signal(".from-json-raw", argsNode);
                lambda.Insert(0, argsNode);

                _signaler.Signal("eval", lambda);

                var result = GetReturnValue(lambda);
                if (result != null)
                    return new OkObjectResult(result);

                return new OkResult();
            }
        }

        string SanityCheckUrl(string url)
        {
            url = WebUtility.UrlDecode(url);
            foreach (var idx in url)
            {
                switch(idx)
                {
                    case '-':
                    case '/':
                        break;
                    default:
                        if ((idx < 'a' || idx > 'z') && (idx < '0' || idx > '9'))
                            throw new ApplicationException($"Illegal URL '{url}' specified");
                        break;
                }
            }
            return url;
        }

        object GetReturnValue(Node lambda)
        {
            if (lambda.Value != null)
            {
                if (lambda.Value is IEnumerable<Node> list)
                {
                    var convert = new Node();
                    convert.AddRange(list.ToList());
                    _signaler.Signal(".to-json-raw", convert);
                    return convert.Value as JToken;
                }
                return JToken.Parse(lambda.Get<string>());
            }
            return null;
        }

        #endregion
    }
}
