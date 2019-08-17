/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace magic.endpoint.contracts
{
	public interface IExecutor
	{
        object ExecuteGet(string url, Dictionary<string, string> args);

        object ExecuteDelete(string url, Dictionary<string, string> args);

        object ExecutePost(string url, JContainer payload);

        object ExecutePut(string url, JContainer payload);
    }
}
