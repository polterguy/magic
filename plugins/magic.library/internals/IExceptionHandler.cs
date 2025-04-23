/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using magic.node.contracts;

namespace magic.library.internals
{
    /// <summary>
    /// Exception handler interface responsible for handling unhandled exceptions.
    /// </summary>
    public interface IExceptionHandler
    {
        /// <summary>
        /// Handles an exception in the specified HTTP context.
        /// </summary>
        /// <param name="context">HttpContext that triggered the exception</param>
        /// <param name="app">Needed to resolve services during exception handling</param>
        /// <param name="rootResolver">Needed to resolve root folder of system</param>
        /// <param name="fileService">Needed to resolve files in system</param>
        /// <returns>Awaitable task</returns>
        Task HandleException(
            IApplicationBuilder app,
            HttpContext context,
            IRootResolver rootResolver,
            IFileService fileService);
   }
}