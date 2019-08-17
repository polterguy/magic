/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using magic.endpoint.contracts;

namespace magic.endpoint.controller
{
    /// <summary>
    /// IO controller for manipulating files and folders on your server
    /// </summary>
    [Route("api/endpoint")]
    [Consumes("application/json")]
    [Produces("application/json")]
    public class EndpointController : ControllerBase
    {
        readonly IExecutor _executor;

        /// <summary>
        /// Creates a new Hyperlambda endpoint controller.
        /// </summary>
        public EndpointController(IExecutor executor)
        {
            _executor = executor ?? throw new ArgumentNullException(nameof(executor));
        }

        /// <summary>
        /// Executes a dynamically registered Hyperlambda HTTP GET endpoint.
        /// </summary>
        [HttpGet]
        [Route("{*url}")]
        public ActionResult Get(string url)
        {
            return Execute(((args) => _executor.ExecuteGet(url, args)));
        }

        /// <summary>
        /// Executes a dynamically registered Hyperlambda HTTP DELETE endpoint.
        /// </summary>
        [HttpDelete]
        [Route("{*url}")]
        public ActionResult Delete(string url)
        {
            return Execute(((args) => _executor.ExecuteDelete(url, args)));
        }

        /// <summary>
        /// Executes a dynamically registered Hyperlambda HTTP POST endpoint.
        /// </summary>
        [HttpPost]
        [Route("{*url}")]
        public ActionResult Post(string url, JContainer payload)
        {
            var result = _executor.ExecutePost(url, payload);

            if (result == null)
                return Ok();

            return Ok(result);
        }

        /// <summary>
        /// Executes a dynamically registered Hyperlambda HTTP PUT endpoint.
        /// </summary>
        [HttpPut]
        [Route("{*url}")]
        public ActionResult Put(string url, JContainer payload)
        {
            var result = _executor.ExecutePut(url, payload);

            if (result == null)
                return Ok();

            return Ok(result);
        }

        #region [ -- Private helper methods -- ]

        ActionResult Execute(Func<Dictionary<string, string>, object> functor)
        {
            var args = new Dictionary<string, string>();
            foreach (var idx in Request.Query)
            {
                if (args.ContainsKey(idx.Key))
                    throw new ApplicationException($"Found same argument '{idx.Key}' twice in URL of request.");

                args[idx.Key] = idx.Value;
            }
            var result = functor(args);

            if (result == null)
                return Ok();

            return Ok(result);
        }

        #endregion
    }
}
