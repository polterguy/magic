/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Security.Claims;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json.Linq;
using Microsoft.AspNetCore.Mvc;
using magic.io.contracts;

namespace magic.io.controller
{
    /// <summary>
    /// IO controller for manipulating files and folders on your server
    /// </summary>
    [Route("api/folders")]
    [Consumes("application/json")]
    [Produces("application/json")]
    public class FoldersController : ControllerBase
    {
        readonly IFolderService _service;

        /// <summary>
        /// Creates a new instance of your folders controller
        /// </summary>
        /// <param name="service">Service containing business logic</param>
        public FoldersController(IFolderService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
        }

        /// <summary>
        /// Returns all folders inside of the specified folder
        /// </summary>
        /// <param name="folder">Folder to return folders from within</param>
        /// <returns>List all folders inside of the specified folder</returns>
        [HttpGet]
        [Route("list-folders")]
        public IEnumerable<string> ListFolders(string folder)
        {
            return _service.ListFolders(
                folder ?? "/",
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }

        /// <summary>
        /// Returns all files inside of the specified folder
        /// </summary>
        /// <param name="folder">Folder to return files from within</param>
        /// <returns>List all files inside of the specified folder</returns>
        [HttpGet]
        [Route("list-files")]
        public IEnumerable<string> ListFiles(string folder)
        {
            return _service.ListFiles(
                folder ?? "/",
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }

        /// <summary>
        /// Deletes the specified folder
        /// </summary>
        /// <param name="folder">Folder to delete</param>
        [HttpDelete]
        public void Delete([Required] string folder)
        {
            _service.Delete(
                folder,
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }

        /// <summary>
        /// Creates the specified folder
        /// </summary>
        /// <param name="payload">Payload to create, should contain at least 'folder' property</param>
        [HttpPut]
        public void Create([Required] [FromBody] JObject payload)
        {
            _service.Create(
                payload["folder"].Value<string>(),
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }

        /// <summary>
        /// Moves the specified source folder to its given destination
        /// </summary>
        /// <param name="input">Source and destination folder</param>
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

        /// <summary>
        /// Returns true if the specified folder exists.
        /// </summary>
        /// <param name="path">Folder to check for</param>
        [HttpGet]
        [Route("exists")]
        public bool Exists([Required] string path)
        {
            return _service.FolderExists(
                path,
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }

        /// <summary>
        /// Returns true if the specified file exists.
        /// </summary>
        /// <param name="path">File to check for</param>
        [HttpGet]
        [Route("file-exists")]
        public bool FileExists([Required] string path)
        {
            return _service.FileExists(
                path,
                User?.Identity.Name,
                User?.Claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).ToArray());
        }
    }
}
