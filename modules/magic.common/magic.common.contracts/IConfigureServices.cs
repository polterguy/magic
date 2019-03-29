/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace magic.common.contracts
{
    public interface IConfigureServices
    {
        void Configure(IServiceCollection services, IConfiguration configuration);
    }
}
