/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
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

            // Applying CORS.
            var origins = Configuration["magic:frontend:urls"];
            if (!string.IsNullOrEmpty(origins))
                app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod().AllowCredentials().WithOrigins(origins.Split(',')));
            else
                app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());

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

            // Creating a log entry for having started application, but only if system has beeen setup.
            if (Configuration["magic:auth:secret"] != "THIS-IS-NOT-A-GOOD-SECRET-PLEASE-CHANGE-IT")
            {
                var logger = app.ApplicationServices.GetService(typeof(ILogger)) as ILogger;
                logger.Info("Magic was successfully started");
            }
        }
    }
}
