/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Microsoft.Extensions.Configuration;
using magic.data.common.contracts;

namespace magic.library.internals
{
    /*
     * Internal helper class to handle settings for magic.data.common.
     */
    internal class AppSettingsDataSettings : IDataSettings
    {
        readonly IConfiguration _configuration;

        public AppSettingsDataSettings(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        #region [ -- Interface implementations -- ]

        public string DefaultDatabaseType { get => _configuration["magic:databases:default"]; }

        public string ConnectionString(string name, string databaseType = null)
        {
            return _configuration[$"magic:databases:{databaseType ?? DefaultDatabaseType}:{name}"];
        }

        #endregion
    }
}