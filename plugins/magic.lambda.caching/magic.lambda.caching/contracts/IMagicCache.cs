/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace magic.lambda.caching.contracts
{
    /// <summary>
    /// Magic cache contract allowing developer to query keys,
    /// and clear (all) items in one go, in addition to providing atomic inserts,
    /// get, remove and add methods.
    /// </summary>
    public interface IMagicCache
    {
        /// <summary>
        /// Creates a new cache entry.
        /// </summary>
        /// <param name="key">What key to use for item.</param>
        /// <param name="value">The actual value of the item.</param>
        /// <param name="utcExpiration">UTC date and time of when item expires.</param>
        /// <param name="hidden">If true, item will be hidden.</param>
        Task UpsertAsync(
            string key,
            string value,
            DateTime utcExpiration,
            bool hidden = false);

        /// <summary>
        /// Removes the specified cache entry with the specified key.
        /// </summary>
        /// <param name="key">Key of item to remove.</param>
        /// <param name="hidden">If true, item will be assumed to be hidden.</param>
        Task RemoveAsync(
            string key,
            bool hidden = false);

        /// <summary>
        /// Returns a single cache entry.
        /// </summary>
        /// <param name="key">Key of item to get.</param>
        /// <param name="hidden">If true, item will be stored hidden.</param>
        /// <returns>Actual item.</returns>
        Task<string> GetAsync(
            string key,
            bool hidden = false);

        /// <summary>
        /// Clears cache entirely, optionally only items matching the specified filter.
        /// </summary>
        /// <param name="filter">Optional filter conditiong items needs to match in order to be removed.</param>
        /// <param name="hidden">If true, only hidden items will be removed.</param>
        Task ClearAsync(
            string filter = null,
            bool hidden = false);

        /// <summary>
        /// Returns all items in cache, optionally only items matching the specified filter.
        /// </summary>
        /// <param name="filter">Optional filter conditiong items needs to match in order to be returned.</param>
        /// <param name="hidden">If true, only hidden items will be returned.</param>
        /// <returns>Enumerable of all items currently stored in cache.</returns>
        Task<IEnumerable<KeyValuePair<string, string>>> ItemsAsync(
            string filter = null,
            bool hidden = false);

        /// <summary>
        /// Retrieves a single item from cache, and if not existing, creates the item,
        /// adds it to the cache, and returns to caller.
        /// </summary>
        /// <param name="key">Key of item to create or retrieve.</param>
        /// <param name="factory">Factory method to invoke if item cannot be found in cache.</param>
        /// <param name="hidden">If true, item will be stored as hidden.</param>
        /// <returns>Object as created and/or found in cache.</returns>
        Task<string> GetOrCreateAsync(
            string key,
            Func<Task<(string, DateTime)>> factory,
            bool hidden = false);
    }
}
