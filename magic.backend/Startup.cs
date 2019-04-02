using System.Net;
/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Threading;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using log4net;
using Ninject;
using Ninject.Activation;
using Ninject.Infrastructure.Disposal;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Swashbuckle.AspNetCore.Swagger;
using magic.backend.init;

namespace magic.backend
{
    public class Startup
    {
        readonly AsyncLocal<Scope> scopeProvider = new AsyncLocal<Scope>();

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
            Kernel = new StandardKernel();
        }

        IKernel Kernel { get; set; }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            Configurator.ConfigureServices(services, Configuration);

            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddRequestScopingMiddleware(() => scopeProvider.Value = new Scope());
            services.AddCustomControllerActivation(Resolve);
            services.AddCustomViewComponentActivation(Resolve);
            services.Configure<RouteOptions>(options => options.LowercaseUrls = true);

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
            foreach (var ctrlType in app.GetControllerTypes())
            {
                Kernel.Bind(ctrlType).ToSelf().InScope(RequestScope);
            }

            Kernel.Bind<IConfiguration>().ToConstant(Configuration);
            InitializeDatabase.Initialize(Kernel, Configuration, RequestScope);
            Configurator.ConfigureNinject(Kernel, Configuration);

            app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";
                var ex = context.Features.Get<IExceptionHandlerPathFeature>();
                var logger = LogManager.GetLogger(ex?.Error.GetType() ?? typeof(Startup));
                var msg = ex?.Error.Message ?? "Unhandled exception";
                logger.Error("At path: " + ex?.Path);
                logger.Error(msg, ex?.Error);
                var response = new JObject
                {
                    ["message"] = msg,
                };
                await context.Response.WriteAsync(response.ToString(Formatting.Indented));
            }));

            app.UseHttpsRedirection();
            app.UseCors(x => x.AllowAnyHeader().AllowAnyOrigin().AllowAnyHeader());

            Configurator.ConfigureApplication(app, Configuration);

            app.UseMvc();
            app.UseSwagger();
            app.UseSwaggerUI(c =>c.SwaggerEndpoint("/swagger/v1/swagger.json", "TITLE"));

            Configurator.ExecuteStartups(Kernel, Configuration);
        }

        object Resolve(Type type) => Kernel.Get(type);

        object RequestScope(IContext context) => scopeProvider.Value;

        sealed class Scope : DisposableObject { }
    }
}
