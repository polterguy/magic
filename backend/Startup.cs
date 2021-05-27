/*
 * Magic, Copyright(c) Thomas Hansen 2019 - 2021, thomas@servergardens.com, all rights reserved.
 * See the enclosed LICENSE file for details.
 */

using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.library;
using magic.lambda.signalr;
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
             * Initializing Magic.
             *
             * Notice, must be done AFTER you invoke "AddControllers".
             */
            services.AddMagic(Configuration);
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

            // Needed to make SignalR work.
            app.UseCors(x => x
                .AllowAnyHeader()
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowCredentials()
                .WithOrigins("http://localhost:4200")); // TODO: Fix this!!
            app.UseAuthentication();
            app.UseRouting().UseEndpoints(conf =>
            {
                conf.MapControllers();
                conf.MapHub<MagicHub>("/signalr");
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
