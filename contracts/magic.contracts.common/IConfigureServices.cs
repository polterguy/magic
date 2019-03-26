/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.Extensions.DependencyInjection;

namespace magic.contracts.common
{
    public interface IConfigureServices
    {
        void Configure(IServiceCollection services);
    }
}
