/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using SixLabors.ImageSharp;
using magic.node;
using magic.signals.contracts;
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
            ISignaler signaler,
            Func<Image, Task> functor)
        {
            /*
             * Image is either a filename, an Image or a Stream. Retrieving Image somehow.
             *
             * Notice, a filename is opened through its slot rather than the file service, and
             * deliberately WITHOUT exempting it from the whitelist, since the path came from the
             * caller - the same is true for the [dest] we might save to further down.
             */
            var file = input.GetEx<object>();
            Image result = null;
            if (file is Stream str)
            {
                result = await Image.LoadAsync(str);
            }
            else
            {
                var source = new Node("", file as string);
                await signaler.SignalAsync("io.stream.open-file", source);
                using (var sourceStream = (Stream)source.Value)
                {
                    result = await Image.LoadAsync(sourceStream);
                }
            }

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
                    using (var destStream = new MemoryStream())
                    {
                        await SaveImageAsync(result, destStream, type);
                        destStream.Position = 0;
                        var save = new Node("", dest);
                        save.Add(new Node("", destStream));
                        await signaler.SignalAsync("io.stream.save-file", save);
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
