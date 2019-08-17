/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Mvc;

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
        /// <summary>
        /// Moves the specified source file to its given destination
        /// </summary>
        [HttpPost]
        [Route("foo")]
        public void Foo()
        {
        }
    }
}
