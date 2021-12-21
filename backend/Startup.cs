/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.library;

namespace magic.backend
{
    public class Startup
    {
        public Startup()
        {
            var builder = new ConfigurationBuilder();
            builder.AddJsonFile("config/appsettings.json");
            Configuration = builder.Build();
        }

        IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton(Configuration);
            services.AddControllers().AddNewtonsoftJson();
            services.AddSingleton<IConfiguration>(p => Configuration);

            /*
             * Initializing Magic.
             *
             * Notice, must be done AFTER you invoke "AddControllers".
             */
            services.AddMagic(Configuration);
        }

        public void Configure(IApplicationBuilder app)
        {
            /*
             * Initializing Magic.
             *
             * Notice, must be done BEFORE you invoke "UseEndpoints".
             */
            app.UseMagic(Configuration);
        }
    }
}
