/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using Mapster;
using magic.common.contracts;
using www = magic.common.web.model;

namespace magic.common.web.controller
{
    /// <summary>
    /// Generic CRUD controller for Creating, Reading, Updating and Deleting items
    /// </summary>
    /// <typeparam name="WebModel">View model type for your HTTP REST web requests</typeparam>
    /// <typeparam name="DbModel">Database model type that is actually persisted into your database</typeparam>
    [Consumes("application/json")]
    [Produces("application/json")]
    public abstract class CrudController<WebModel, DbModel> : ControllerBase
    {
        /// <summary>
        /// Service implementing business logic for controller endpoints
        /// </summary>
        protected readonly ICrudService<DbModel> Service;

        /// <summary>
        /// Creates a new CRUD controller
        /// </summary>
        /// <param name="service">The underlaying service implementing the CRUD operations for your domain type</param>
        public CrudController(ICrudService<DbModel> service)
        {
            Service = service ?? throw new ArgumentNullException(nameof(service));
        }

        /// <summary>
        /// Saves or updates an instance of your database model type.
        /// </summary>
        /// <param name="input">Data for your instance</param>
        /// <returns></returns>
        [HttpPost]
        public virtual ActionResult<www.OperationResult> Save([Required] [FromBody] WebModel input)
        {
            var id = Service.Save(input.Adapt<DbModel>());
            return Ok(new www.OperationResult
            {
                Message = $"{typeof(DbModel).Name} successfully saved",
                Id = id,
            });
        }

        /// <summary>
        /// Returns the instance with the specified id
        /// </summary>
        /// <param name="id">The id of the instance you want to retrieve</param>
        /// <returns></returns>
        [HttpGet]
        [Route("{id:Guid}")]
        public virtual ActionResult<WebModel> Get(Guid id)
        {
            return Ok(Service.Get(id).Adapt<WebModel>());
        }

        /// <summary>
        /// Returns a list of items, optionally allowing you to page
        /// </summary>
        /// <param name="offset">Offset of where to start retrieveing items</param>
        /// <param name="limit">Maximum number of items to retrieve</param>
        /// <returns></returns>
        [HttpGet]
        public virtual ActionResult<IEnumerable<WebModel>> List(int offset = 0, int limit = 50)
        {
            var list = Service.List(offset, limit);
            return Ok(list.Select(x => x.Adapt<WebModel>()));
        }

        /// <summary>
        /// Deletes the item with the specified id
        /// </summary>
        /// <param name="id">Id of item to delete</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("{id:Guid}")]
        public virtual ActionResult<www.OperationResult> Delete(Guid id)
        {
            Service.Delete(id);
            return Ok(new www.OperationResult
            {
                Message = $"{typeof(DbModel).Name} was successfully deleted",
                Id = id,
            });
        }

        /// <summary>
        /// Returns the total number of items in your database
        /// </summary>
        /// <returns>The number of items in your database</returns>
        [HttpGet]
        [Route("count")]
        public virtual ActionResult<long> Count()
        {
            var count = Service.Count();
            return Ok(count);
        }
    }
}
