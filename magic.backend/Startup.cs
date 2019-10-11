/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using log4net;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using magic.library;

namespace magic.backend
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            // Adding some basic configurations.
            services.AddSingleton(Configuration);
            services.AddMvc()
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            /*
             * Initializing Magic.
             */
            services.AddMagic(Configuration);
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            /*
             * Initializing Magic.
             */
			app.UseMagic(Configuration);

            app.UseHttpsRedirection();
            app.UseCors(x => x.AllowAnyHeader().AllowAnyOrigin().AllowAnyMethod());
            app.UseAuthentication();
            app.UseMvc();
        }
    }
}
