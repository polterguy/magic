/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.backend.init;
using magic.backend.init.internals;

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
            services.AddMvc((x) => x.OutputFormatters.Add(new ContentFormatters()))
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            // Adding some basic configurations.
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddSingleton(Configuration);
            services.Configure<RouteOptions>(options => options.LowercaseUrls = true);

            // Giving every module a chance to configure its services.
            Configurator.ConfigureServices(services, Configuration);
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            app.UseHttpsRedirection();
            app.UseCors(x => x.AllowAnyHeader().AllowAnyOrigin().AllowAnyMethod());

            app.UseMvc();

            // Giving each module a chance to configure the application.
            Configurator.ConfigureApplication(app, Configuration);

            // Giving each module a chance to run startup logic.
            Configurator.InitializeStartups(app.ApplicationServices, Configuration);
        }
    }
}
