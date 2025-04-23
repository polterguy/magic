/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using magic.node.contracts;

namespace magic.lambda.config.services
{
    /// <summary>
    /// Custom configuration class for Magic using the IFileService to save and load the "appsettings.json"
    /// configuration file.
    /// </summary>
    public class MagicConfiguration : IMagicConfiguration
    {
        readonly IConfiguration _configuration;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="configuration">Actual configuration object.</param>
        public MagicConfiguration(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <inheritdoc />
        public string this[string key]
        {
            get => _configuration[key];
        }

        /// <inheritdoc />
        public Dictionary<string, string> GetSection(string key)
        {
            return _configuration.GetSection(key)
                .GetChildren()
                .ToDictionary(x => x.Key, x => x.Value);
        }
    }
}
