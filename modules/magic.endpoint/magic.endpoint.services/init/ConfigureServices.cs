
/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.IO;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using magic.common.contracts;
using magic.endpoint.contracts;

namespace magic.endpoint.services.init
{
    class ConfigureServices : IConfigureServices, IConfigureApplication
    {
        public void Configure(IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IExecutor, Executor>();

            Root = (configuration["io:root-folder"] ?? "~/files")
                .Replace("~", Directory.GetCurrentDirectory())
                .TrimEnd('/') + "/modules/";

            var secret = configuration["auth:secret"];
            var key = Encoding.ASCII.GetBytes(secret);
            services.AddAuthentication(x =>
            {
                x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(x =>
            {
                x.RequireHttpsMetadata = false;
                x.SaveToken = true;
                x.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                };
            });
        }

        public void Configure(IApplicationBuilder app, IConfiguration configuration)
        {
            app.UseAuthentication();
        }

        public static string Root { get; private set; }
    }
}
