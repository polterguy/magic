/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using SkiaSharp;
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
         * Largest width or height in pixels a caller can ask for, since the value becomes the size of
         * a bitmap allocation, and callers are not trusted to choose it.
         */
        public const int MaxDimension = 8192;

        /*
         * Throws if the specified width or height is not between 1 and MaxDimension.
         */
        public static void CheckDimension(int value, string name)
        {
            if (value < 1 || value > MaxDimension)
                throw new HyperlambdaException($"[{name}] must be between 1 and {MaxDimension} pixels, but was {value}");
        }

        /*
         * Returns an image given the specified input node.
         */
        public static async Task TransformImageAsync(
            Node input,
            ISignaler signaler,
            Func<SKBitmap, SKBitmap> functor)
        {
            /*
             * Image is either a filename, an Image or a Stream. Retrieving Image somehow.
             *
             * Notice, a filename is opened through its slot rather than the file service, and
             * deliberately WITHOUT exempting it from the whitelist, since the path came from the
             * caller - the same is true for the [dest] we might save to further down.
             */
            var file = input.GetEx<object>();
            SKBitmap result;
            if (file is Stream str)
            {
                result = Decode(str);
            }
            else
            {
                var source = new Node("", file as string);
                await signaler.SignalAsync("io.stream.open-file", source);
                using (var sourceStream = (Stream)source.Value)
                {
                    result = Decode(sourceStream);
                }
            }

            // Invoking callback, which returns the transformed image, a new one or the same.
            if (functor != null)
            {
                SKBitmap transformed;
                try
                {
                    transformed = functor(result);
                }
                catch
                {
                    result.Dispose();
                    throw;
                }
                if (!ReferenceEquals(transformed, result))
                {
                    result.Dispose();
                    result = transformed;
                }
            }

            // Making sure we dispose image when we're done with it.
            using (result)
            {

                // Figuring out how caller wants to have image returned.
                var type = input.Children.FirstOrDefault(x => x.Name == "type")?.GetEx<string>() ?? "png";

                // Checking if caller wants to save image to disc.
                var dest = input.Children.FirstOrDefault(x => x.Name == "dest")?.GetEx<string>();
                if (dest != null)
                {
                    using (var destStream = new MemoryStream())
                    {
                        SaveImage(result, destStream, type);
                        destStream.Position = 0;
                        var save = new Node("", dest);
                        save.Add(new Node("", destStream));
                        await signaler.SignalAsync("io.stream.save-file", save);
                        return;
                    }
                }

                // Returning Image as Stream to caller as input's value.
                var stream = new MemoryStream();
                SaveImage(result, stream, type);
                stream.Position = 0;
                input.Value = stream;
                input.Clear();
            }
        }

        #region [ -- Private methods -- ]

        /*
         * Decodes the image in the specified stream, throwing if it is not an image Skia can decode.
         */
        static SKBitmap Decode(Stream stream)
        {
            return SKBitmap.Decode(stream) ?? throw new HyperlambdaException("The input is not an image that could be decoded");
        }

        /*
         * Saves the specified image to the specified stream as the specified type.
         */
        static void SaveImage(SKBitmap bitmap, Stream destination, string type)
        {
            var format = type switch
            {
                "png" => SKEncodedImageFormat.Png,
                "jpeg" => SKEncodedImageFormat.Jpeg,
                "webp" => SKEncodedImageFormat.Webp,
                _ => throw new HyperlambdaException($"Unsupported image type '{type}', supported types are png, jpeg and webp")
            };
            using (var image = SKImage.FromBitmap(bitmap))
            using (var data = image.Encode(format, 75))
            {
                if (data == null)
                    throw new HyperlambdaException($"Could not encode the image as '{type}'");
                data.SaveTo(destination);
            }
        }

        #endregion
    }
}
