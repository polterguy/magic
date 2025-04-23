/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.data.common.contracts;

namespace magic.data.common.helpers
{
    /// <summary>
    /// Abstract base class for generic slots simply invoking specialized slot for database type.
    /// </summary>
    public abstract class DataSlotBase : ISlotAsync
    {
        readonly string _slot;
        readonly IDataSettings _settings;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="slot">Last parts of the name of slot to signal.</param>
        /// <param name="settings">Configuration object.</param>
        protected DataSlotBase(string slot, IDataSettings settings)
        {
            _settings = settings;
            _slot = slot;
        }

        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var databaseType = GetDefaultDatabaseType(_settings, input);
            await signaler.SignalAsync($"{databaseType}{_slot}", input);
        }

        #region [ -- Private helper methods -- ]

        static string GetDefaultDatabaseType(IDataSettings settings, Node input)
        {
            var databaseType = 
                input.Children.FirstOrDefault(x => x.Name == "database-type")?.GetEx<string>() ??
                settings.DefaultDatabaseType;
            input.Children.FirstOrDefault(x => x.Name == "database-type")?.UnTie();
            return databaseType;
        }

        #endregion
    }
}
