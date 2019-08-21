/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;
using magic.node;
using magic.signals.contracts;

namespace magic.backend.init
{
    public sealed class DynamicEndpointOperation : IDocumentFilter
    {
        readonly ISignaler _signaler;

        public DynamicEndpointOperation(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Apply(SwaggerDocument swaggerDoc, DocumentFilterContext context)
        {
            foreach (var idx in _signaler.Slots.Where((ix) => ix.StartsWith(".swagger-dox.")))
            {
                var node = new Node("", swaggerDoc);
                _signaler.Signal(idx, node);
            }
        }
    }
}