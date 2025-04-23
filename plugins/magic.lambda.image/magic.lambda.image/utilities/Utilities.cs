/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using SixLabors.ImageSharp;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;

namespace magic.lambda.image.slots
{
    /*
     * Utility helper class.
     */
    internal static class Utilities
    {
        /*
         * Returns an image given the specified input node.
         */
        public static async Task TransformImageAsync(
            Node input,
            IRootResolver rootResolver,
            Func<Image, Task> functor)
        {
            // Image is either a filename, an Image or a Stream. Retrieving Image somehow.
            var file = input.GetEx<object>();
            Image result = null;
            if (file is Stream str)
                result = await Image.LoadAsync(str);
            else
                result = await Image.LoadAsync(rootResolver.AbsolutePath(file as string));

            // Making sure we dispose image when we're done with it.
            using (result)
            {
                // Invoking callback.
                if (functor != null)
                    await functor(result);

                // Figuring out how caller wants to have image returned.
                var type = input.Children.FirstOrDefault(x => x.Name == "type")?.GetEx<string>() ?? "png";

                // Checking if caller wants to save image to disc.
                var dest = input.Children.FirstOrDefault(x => x.Name == "dest")?.GetEx<string>();
                if (dest != null)
                {
                    using (var fileStream = File.OpenWrite(rootResolver.AbsolutePath(dest)))
                    {
                        await SaveImageAsync(result, fileStream, type);
                        return;
                    }
                }

                // Returning Image as Stream to caller as input's value.
                var stream = new MemoryStream();
                await SaveImageAsync(result, stream, type);
                stream.Position = 0;
                input.Value = stream;
                input.Clear();
            }
        }

        #region [ -- Private methods -- ]

        /*
         * Saves the specified image to the specified stream as the specified type.
         */
        static async Task SaveImageAsync(Image image, Stream destination, string type)
        {
            switch (type)
            {
                case "png":
                    await image.SaveAsPngAsync(destination);
                    break;

                case "jpeg":
                    await image.SaveAsJpegAsync(destination);
                    break;

                case "bmp":
                    await image.SaveAsBmpAsync(destination);
                    break;

                case "gif":
                    await image.SaveAsGifAsync(destination);
                    break;

                case "tga":
                    await image.SaveAsTgaAsync(destination);
                    break;

                case "pbm":
                    await image.SaveAsPbmAsync(destination);
                    break;

                case "tiff":
                    await image.SaveAsTiffAsync(destination);
                    break;

                case "webp":
                    await image.SaveAsWebpAsync(destination);
                    break;
            }
        }

        #endregion
    }
}
