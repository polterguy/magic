/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using Microsoft.Extensions.Configuration;

namespace magic.common.contracts
{
    /*
     * Interface intended for invoking startup logic, such as setting initial default state of
     * application, or insert default items into database, etc. If you implement this interface
     * on your type, it will be automatically created and invoked during startup of application.
     */
    public interface IStartup
    {
        void Initialize(IServiceProvider kernel, IConfiguration configuration);
    }
}
