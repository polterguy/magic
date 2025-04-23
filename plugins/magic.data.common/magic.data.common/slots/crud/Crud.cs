/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.data.common.contracts;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.data.common.slots.crud
{
    /// <summary>
    /// [data.create] slot, for creating a record in your database,
    /// according to your configuration settings.
    /// </summary>
    [Slot(Name = "data.create")]
    [Slot(Name = "data.read")]
    [Slot(Name = "data.update")]
    [Slot(Name = "data.delete")]
    [Slot(Name = "data.scan")]
    public class Crud : ISlotAsync
    {
        readonly IDataSettings _settings;

        /// <summary>
        /// Creates a new instance of your type.
        /// </summary>
        /// <param name="settings">Configuration object.</param>
        public Crud(IDataSettings settings)
        {
            _settings = settings;
        }

        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var databaseType = 
                input.Children.FirstOrDefault(x => x.Name == "database-type")?.GetEx<string>() ??
                _settings.DefaultDatabaseType;
            input.Children.FirstOrDefault(x => x.Name == "database-type")?.UnTie();
            await signaler.SignalAsync($"{databaseType}.{GetCrudSlot(input.Name)}", input);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns create, read, update or delete, according to what slot was actually invoked by caller.
         */
        static string GetCrudSlot(string name)
        {
            return name.Substring(name.IndexOf('.') + 1);
        }

        #endregion
    }
}
