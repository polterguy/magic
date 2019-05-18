/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace magic.common.contracts
{
    /*
     * Interface allowing you to configure services. If you implement this interface on your
     * own type, your type will be automatically created and its Configure method will be invoked
     * during startup/configuration phase of the application. This allows your modules to
     * configure the services they require for themselves.
     */
    public interface IConfigureServices
    {
        void Configure(IServiceCollection services, IConfiguration configuration);
    }
}
