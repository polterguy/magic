/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.image.signatures
{
    public abstract class ImageSignature : ISlotSignature
    {
        public virtual IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();

        protected static SlotChild Option(string name, string type, string description, bool required = false, string defaultValue = null, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = required,
                DefaultValue = defaultValue,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = required ? SlotChildCardinality.ExactlyOne : SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }

        protected static SlotChild Type(bool required = false)
        {
            return Option("type", "string", "Output image format: png, jpeg, bmp, gif, tga, pbm, tiff, or webp", required, "png", "image-format");
        }

        protected static SlotChild Dest()
        {
            return Option("dest", "string", "Optional destination filename; when supplied, the image is saved to disk instead of returned as a stream", kind: "image-file");
        }
    }

    public class ImageResizeSignature : ImageSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Type(),
            Dest(),
            Option("width", "int", "Target width in pixels", kind: "image-dimensions"),
            Option("height", "int", "Target height in pixels", kind: "image-dimensions"),
        };
    }

    public class ImageCropSignature : ImageSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Type(),
            Dest(),
            Option("left", "int", "Pixels to crop from the left edge", defaultValue: "0", kind: ImageSignaturesLiterals.ImageCropPixels),
            Option("top", "int", "Pixels to crop from the top edge", defaultValue: "0", kind: ImageSignaturesLiterals.ImageCropPixels),
            Option("right", "int", "Pixels to crop from the right edge", defaultValue: "0", kind: ImageSignaturesLiterals.ImageCropPixels),
            Option("bottom", "int", "Pixels to crop from the bottom edge", defaultValue: "0", kind: ImageSignaturesLiterals.ImageCropPixels),
        };
    }

    public class ImageTransformSignature : ImageSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Type(true),
            Dest(),
        };
    }

    public class QrSignature : ImageSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("size", "int", "QR module size", defaultValue: "4"),
        };
    }

    public class ChartSignature : ImageSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("width", "int", "Chart width in pixels", true),
            Option("height", "int", "Chart height in pixels", true),
            Option("filename", "string", "Optional destination filename", kind: "image-file"),
            new SlotChild
            {
                Name = "bars",
                Type = "lambda",
                Description = "Chart values keyed by label; grouped and stacked charts use nested numeric values",
                Required = true,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ExactlyOne,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.StructuredTree,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "double|lambda",
                        Description = "Bar value or grouped/stacked bar value collection",
                        Required = true,
                        Mode = SlotChildMode.ValueOrExpression,
                        Cardinality = SlotChildCardinality.OneOrMore,
                        Role = SlotChildRole.DynamicMap,
                        Projection = SlotChildProjection.StructuredTree,
                    },
                },
            },
            new SlotChild
            {
                Name = "legend",
                Type = "lambda",
                Description = "Legend labels required by grouped and stacked charts",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.Children,
                Children =
                {
                    new SlotChild
                    {
                        Name = ".",
                        Type = "string",
                        Kind = "chart-legend-label",
                        Description = "Legend label",
                        Required = false,
                        Mode = SlotChildMode.ValueOrExpression,
                        Cardinality = SlotChildCardinality.ZeroOrMore,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                },
            },
        };
    }

    static class ImageSignaturesLiterals
    {
        public const string ImageCropPixels = "image-crop-pixels";
    }
}
