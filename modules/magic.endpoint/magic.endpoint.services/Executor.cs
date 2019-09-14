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
using magic.endpoint.contracts;
using magic.endpoint.services.init;
using magic.node.extensions.hyperlambda;

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
            if (!Utilities.IsLegalHttpName(url))
                throw new ApplicationException("Illeal URL");

            var path = RootResolver.Root + url + $".{verb}.hl";
            if (!File.Exists(path))
                return new NotFoundResult();

            using (var stream = File.OpenRead(path))
            {
                var lambda = new Parser(stream).Lambda();

                /*
                 * Checking file [.arguments], and if given, removing them to make sure invocation of file
                 * only has a single [.arguments] node.
                 */
                var fileArgs = lambda.Children.Where(x => x.Name == ".arguments").ToList();
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
                    argsNode.AddRange(arguments.Select(x =>
                        ConvertArgument(x.Key, x.Value,
                            fileArgs.First().Children.FirstOrDefault(x2 => x2.Name == x.Key))));
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
            if (!Utilities.IsLegalHttpName(url))
                throw new ApplicationException("Illeal URL");

            var path = RootResolver.Root + url + $".{verb}.hl";
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
                var fileArgs = lambda.Children.Where(x => x.Name == ".arguments").ToList();
                if (fileArgs.Any())
                {
                    if (fileArgs.Count() > 1)
                        throw new ApplicationException($"URL '{url}' has an invalid [.arguments] declaration. Multiple [.arguments] nodes found in endpoint's file");

                    fileArgs.First().UnTie();
                }

                // Adding arguments from invocation to evaluated lambda node.
                var argsNode = new Node("", arguments);
                _signaler.Signal(".from-json-raw", argsNode);
                var convertedArgs = new Node(".arguments");
                foreach (var idxArg in argsNode.Children)
                {
                    if (idxArg.Value == null)
                        convertedArgs.Add(idxArg.Clone()); // TODO: Recursively sanity check arguments.
                    else
                        convertedArgs.Add(ConvertArgument(idxArg.Name, idxArg.Get<string>(), fileArgs.First().Children.FirstOrDefault(x => x.Name == idxArg.Name)));
                }
                lambda.Insert(0, convertedArgs);

                _signaler.Signal("eval", lambda);

                var result = GetReturnValue(lambda);
                if (result != null)
                    return new OkObjectResult(result);

                return new OkResult();
            }
        }

        Node ConvertArgument(string name, string value, Node declaration)
        {
            if (declaration == null)
                throw new ApplicationException($"I don't know how to handle the '{name}' argument");

            return new Node(name, Parser.ConvertValue(value, declaration.Get<string>()));
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
