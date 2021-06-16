/*
 * Magic, Copyright(c) Thomas Hansen 2019 - 2021, thomas@servergardens.com, all rights reserved.
 * See the enclosed LICENSE file for details.
 */

using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Server.IISIntegration;
using magic.library;
using magic.lambda.sockets;
using magic.lambda.logging.helpers;

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
            services.AddSingleton(Configuration);
            services.AddControllers().AddNewtonsoftJson();

            /*
             * Checking if we should add IIS authentication scheme, which we
             * only do if configuration has declared an "auto login slot".
             */
            if (!string.IsNullOrEmpty(Configuration["magic:auth:auto-auth"]))
                services.AddAuthentication(IISDefaults.AuthenticationScheme);

            /*
             * Initializing Magic.
             *
             * Notice, must be done AFTER you invoke "AddControllers".
             */
            services.AddMagic(Configuration);

            /*
             * Checking if SignalR is enabled, and if so, making sure we
             * add support for it.
             */
            if (Configuration["magic:sockets:url"] != null)
                services.AddSignalR();
        }

        public void Configure(IApplicationBuilder app)
        {
            /*
             * Initializing Magic.
             *
             * Notice, must be done BEFORE you invoke "UseEndpoints".
             */
            app.UseMagic(Configuration);

            app.UseHttpsRedirection();

            // Necessary to make SignalR work.
            app.UseCors(x => x.AllowAnyHeader().AllowAnyOrigin().AllowAnyMethod());
            app.UseAuthentication();
            app.UseRouting().UseEndpoints(conf =>
            {
                conf.MapControllers();

                /*
                 * Checking if SignalR is enabled, and if so, making sure we
                 * resolve the "/sockets" endpoint as SignalR invocations.
                 */
                if (Configuration["magic:sockets:url"] != null)
                    conf.MapHub<MagicHub>("/sockets");
            });

            var origins = Configuration["magic:frontends:urls"];
            if (!string.IsNullOrEmpty(origins))
            {
                app.UseCors((builder) =>
                {
                    builder.AllowAnyHeader().AllowAnyMethod().WithOrigins(origins.Split(',')).AllowCredentials();
                });
            }

            // Creating a log entry for having started application, but only if system has beeen setup.
            if (Configuration["magic:auth:secret"] != "THIS-IS-NOT-A-GOOD-SECRET-PLEASE-CHANGE-IT")
            {
                var logger = app.ApplicationServices.GetService(typeof(ILogger)) as ILogger;
                logger.Info("Magic was successfully started");
            }
        }
    }
}
