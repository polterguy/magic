/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
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
            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            /*
             * Initializing Magic.
             */
            Initializer.InitializeLog4net(
                string.Concat(
                    AppDomain.CurrentDomain.BaseDirectory, "log4net.config"));
            Initializer.InitializeServices(Configuration, services);
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            /*
             * Making sure we're storing errors into our log file, and that
             * we're abot to return the exception message to client.
             */
            app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";
                var ex = context.Features.Get<IExceptionHandlerPathFeature>();
                var logger = LogManager.GetLogger(ex?.Error.GetType() ?? typeof(Startup));
                var msg = ex?.Error.Message ?? "Unknown error";
                logger.Error("At path: " + ex?.Path);
                logger.Error(msg, ex?.Error);
                var response = new JObject
                {
                    ["message"] = msg,
                };
                await context.Response.WriteAsync(response.ToString(Formatting.Indented));
            }));

            app.UseHttpsRedirection();
            app.UseCors(x => x.AllowAnyHeader().AllowAnyOrigin().AllowAnyMethod());
            app.UseAuthentication();
            app.UseMvc();

            /*
             * Initializing Magic.
             */
            Initializer.InitalizeApp(app);
        }
    }
}
