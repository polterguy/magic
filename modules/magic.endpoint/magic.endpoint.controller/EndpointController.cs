/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using Microsoft.AspNetCore.Mvc;
using magic.endpoint.contracts;

namespace magic.endpoint.web.controller
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
        public IActionResult Get(string url)
        {
            var result = _executor.Execute();

            if (result == null)
                return Ok();

            return Ok(result);
        }
    }
}
