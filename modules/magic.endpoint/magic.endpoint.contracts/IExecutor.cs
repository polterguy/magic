/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace magic.endpoint.contracts
{
	public interface IExecutor
	{
        ActionResult ExecuteGet(string url, Dictionary<string, string> args);

        ActionResult ExecuteDelete(string url, Dictionary<string, string> args);

        ActionResult ExecutePost(string url, JContainer payload);

        ActionResult ExecutePut(string url, JContainer payload);
    }
}
