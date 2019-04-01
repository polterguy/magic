/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.ViewComponents;
using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace magic.backend.init
{
    public sealed class FileUploadOperation : IOperationFilter
    {
        private const string _mimeType = "multipart/form-data";

        private static readonly string[] formFilePropertyNames = typeof(IFormFile)
            .GetTypeInfo()
            .DeclaredProperties.Select(p => p.Name)
            .ToArray();
    
        public void Apply(Operation operation, OperationFilterContext context)
        {
            if (operation.Parameters == null || operation.Parameters.Count == 0)
                return;
    
            var formFileParameterNames = new List<string>();
            var formFileSubParameterNames = new List<string>();
    
            foreach (var idxParam in context.ApiDescription.ActionDescriptor.Parameters)
            {
                var properties = idxParam.ParameterType.GetProperties()
                        .Where(p => p.PropertyType == typeof(IFormFile))
                        .Select(p => p.Name)
                        .ToArray();
    
                if (properties.Length != 0)
                {
                    formFileParameterNames.AddRange(properties);
                    formFileSubParameterNames.AddRange(properties);
                    continue;
                }
    
                if (idxParam.ParameterType != typeof(IFormFile))
                    continue;
                formFileParameterNames.Add(idxParam.Name);
            }
    
            if (!formFileParameterNames.Any())
                return;
    
            operation.Consumes.Clear();
            operation.Consumes.Add(_mimeType);
    
            foreach (var idxParam in operation.Parameters.ToArray())
            {
                if (!(idxParam is NonBodyParameter) || idxParam.In != "formData")
                    continue;
    
                if (formFileSubParameterNames.Any(p => idxParam.Name.StartsWith(p + ".")) ||
                    formFilePropertyNames.Contains(idxParam.Name))
                    operation.Parameters.Remove(idxParam);
            }
    
            foreach (var idxParam in formFileParameterNames)
            {
                operation.Parameters.Add(new NonBodyParameter
                {
                    Name = idxParam,
                    Type = "file",
                    In = "formData"
                });
            }
        }
    }
}