/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using Microsoft.Extensions.Configuration;

namespace magic.common.contracts
{
    public interface IStartup
    {
        void Configure(IServiceProvider kernel, IConfiguration configuration);
    }
}
