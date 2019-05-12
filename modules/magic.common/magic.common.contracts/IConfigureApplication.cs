/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;

namespace magic.common.contracts
{
    /*
     * Interface allowing you to configure application. If you implement this interface on your
     * own type, your type will be automatically created and its Configure method will be invoked
     * during startup/configuration phase of the application. This allows your modules to
     * configure the application the way they require for themselves.
     */
    public interface IConfigureApplication
    {
        void Configure(IApplicationBuilder app, IConfiguration configuration);
    }
}
