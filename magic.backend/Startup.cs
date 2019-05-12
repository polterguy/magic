using System.Net;
/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using log4net;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Swashbuckle.AspNetCore.Swagger;
using magic.backend.init;

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
            // Giving every module a chance to configure its services.
            Configurator.ConfigureServices(services, Configuration);

            // Dynamically loading up all controllers.
            var assembly = typeof(Startup).GetTypeInfo().Assembly;
            var part = new AssemblyPart(assembly);
            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2)
                .ConfigureApplicationPartManager(apm => apm.ApplicationParts.Add(part));

            // Adding some basic configurations.
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddSingleton<IConfiguration>(Configuration);
            services.Configure<RouteOptions>(options => options.LowercaseUrls = true);

            // Initializing database.
            InitializeDatabase.Initialize(services, Configuration);

            // Configuring swagger.
            services.AddSwaggerGen(swag =>
            {
                swag.SwaggerDoc("v1", new Info
                {
                    Title = "Super DRY Magic",
                    Version = "v1",
                    Description = "An ASP.NET Core web API Starter Kit",
                    License = new License
                    {
                        Name = "Affero GPL + Proprietary commercial (Closed Source)",
                        Url = "https://github.com/polterguy/magic",
                    },
                    Contact = new Contact
                    {
                        Name = "Thomas Hansen",
                        Email = "thomas@gaiasoul.com",
                        Url = "https://github.com/polterguy/magic",
                    },
                });
                foreach (var idxFile in Directory.GetFiles(AppContext.BaseDirectory, "*.xml"))
                {
                    swag.IncludeXmlComments(idxFile);
                }
                swag.OperationFilter<FileUploadOperation>();
            });
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            // Making sure we add some default exception handling.
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

            app.UseMvc();
            app.UseSwagger();
            app.UseSwaggerUI(c =>c.SwaggerEndpoint("/swagger/v1/swagger.json", "TITLE"));

            // Giving each module a chance to configure the application.
            Configurator.ConfigureApplication(app, Configuration);

            // Giving each module a chance to run startup logic.
            Configurator.InitializeStartups(app.ApplicationServices, Configuration);
        }
    }
}
