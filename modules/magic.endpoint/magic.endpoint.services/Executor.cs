/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using magic.endpoint.contracts;

namespace magic.endpoint.services
{
    public class Executor : IExecutor
    {
        public object ExecuteGet(string url, Dictionary<string, string> args)
        {
            throw new NotImplementedException();
        }

        public object ExecuteDelete(string url, Dictionary<string, string> args)
        {
            throw new NotImplementedException();
        }

        public object ExecutePost(string url, JContainer payload)
        {
            throw new NotImplementedException();
        }

        public object ExecutePut(string url, JContainer payload)
        {
            throw new NotImplementedException();
        }
    }
}
