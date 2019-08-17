/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using magic.io.contracts;

namespace magic.io.controller
{
    /// <summary>
    /// IO controller for manipulating files and folders on your server
    /// </summary>
    [Route("api/files")]
    [Consumes("application/json")]
    [Produces("application/json")]
    public class FilesController : ControllerBase
    {
        readonly IFileService _service;

        /// <summary>
        /// Creates a new instance of your files controller
        /// </summary>
        /// <param name="service">Service containing business logic</param>
        public FilesController(IFileService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
        }

        /// <summary>
        /// Uploads a file to your server and stores it at the specified path
        /// </summary>
        /// <param name="file">The actual file</param>
        /// <param name="folder">The folder on your server where you want to store your file</param>
        /// <returns>200 if file was successfully saved</returns>
        [HttpPost]
        [DisableRequestSizeLimit]
        [Consumes("multipart/form-data")]
        public void Upload([Required] [FromForm] IFormFile file, string folder)
        {
            _service.Upload(
                file,
                folder ?? "/",
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }

        /// <summary>
        /// Returns the specified file to caller
        /// </summary>
        /// <param name="file">File to return</param>
        /// <returns>The specified file</returns>
        [HttpGet]
        public FileResult Download([Required] string file)
        {
            return _service.Download(
                file,
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }

        /// <summary>
        /// Deletes the specified file
        /// </summary>
        /// <param name="file">File to delete</param>
        [HttpDelete]
        public void Delete([Required] string file)
        {
            _service.Delete(
                file,
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }

        /// <summary>
        /// Copies the specified source file to its given destination
        /// </summary>
        /// <param name="input">Source and destination file</param>
        [HttpPost]
        [Route("copy")]
        public void Copy([Required] CopyMoveModel input)
        {
            _service.Copy(
                input.Source,
                input.Destination,
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }

        /// <summary>
        /// Moves the specified source file to its given destination
        /// </summary>
        /// <param name="input">Source and destination file</param>
        [HttpPost]
        [Route("move")]
        public void Move([Required] CopyMoveModel input)
        {
            _service.Move(
                input.Source,
                input.Destination,
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }
    }
}
