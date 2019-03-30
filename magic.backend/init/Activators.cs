/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.ViewComponents;

namespace magic.backend.init
{
    public sealed class DelegatingControllerActivator : IControllerActivator
    {
        readonly Func<ControllerContext, object> _controllerCreator;

        readonly Action<ControllerContext, object> _controllerReleaser;

        public DelegatingControllerActivator(
            Func<ControllerContext, object> controllerCreator,
            Action<ControllerContext, object> controllerReleaser = null)
        {
            _controllerCreator = controllerCreator ?? throw new ArgumentNullException(nameof(controllerCreator));
            _controllerReleaser = controllerReleaser ?? ((x1, x2) => { });
        }

        public object Create(ControllerContext context) => _controllerCreator(context);

        public void Release(ControllerContext context, object controller) => _controllerReleaser(context, controller);
    }

    public sealed class DelegatingViewComponentActivator : IViewComponentActivator
    {
        readonly Func<Type, object> _viewComponentCreator;
        readonly Action<object> _viewComponentReleaser;

        public DelegatingViewComponentActivator(
            Func<Type, object> viewComponentCreator,
            Action<object> viewComponentReleaser = null)
        {
            _viewComponentCreator = viewComponentCreator ?? throw new ArgumentNullException(nameof(viewComponentCreator));
            _viewComponentReleaser = viewComponentReleaser ?? (_ => { });
        }

        public object Create(ViewComponentContext context) => _viewComponentCreator(context.ViewComponentDescriptor.TypeInfo.AsType());

        public void Release(ViewComponentContext context, object viewComponent) => _viewComponentReleaser(viewComponent);
    }
}