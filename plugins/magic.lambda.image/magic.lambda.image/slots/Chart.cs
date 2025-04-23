/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using ScottPlot;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using System.Collections.Generic;

namespace magic.lambda.image.slots
{
  /// <summary>
  /// [image.chart] slot for creating charts.
  /// </summary>
  [Slot(Name = "image.chart")]
    public class Chart : ISlot
    {
        readonly IRootResolver _rootResolver;

        /// <summary>
        /// Creates an instance of our type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        public Chart(IRootResolver rootResolver)
        {
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Extracting common arguments.
            var type = input.GetEx<string>() ?? 
                throw new HyperlambdaException("No type provided to [image.chart]");
            var width = input.Children.FirstOrDefault(x => x.Name == "width")?.GetEx<int>() ?? 
                throw new HyperlambdaException("No [width] provided to [image.chart]");
            var height = input.Children.FirstOrDefault(x => x.Name == "height")?.GetEx<int>() ?? 
                throw new HyperlambdaException("No [height] provided to [image.chart]");

            // Buffer for chart.
            var plot = new Plot();

            // Making sure we try to use fonts that are available.
            plot.Font.Automatic();

            // Figuring out what chart to render.
            switch (type)
            {
                case "bars":
                    CreateBars(input, plot);
                    break;

                case "stacked":
                    CreateStacked(input, plot);
                    break;

                case "grouped":
                    CreateGrouped(input, plot);
                    break;

                default:
                    throw new HyperlambdaException($"[image.chart] does not support charts of type '{type}'");
            }

            // House cleaning.
            input.Value = null;

            // Rendering chart to file.
            var filename = input.Children.FirstOrDefault(x => x.Name == "filename")?.GetEx<string>();
            if (filename != null)
            {
                plot.SavePng(_rootResolver.AbsolutePath(filename), width, height);
            }
            else
            {
                using (var image = plot.GetImage(width, height))
                {
                    input.Value = new MemoryStream(image.GetImageBytes(ImageFormat.Png, 100));
                }
            }

            // More house cleaning.
            input.Clear();
        }

        /*
         * Private helper methods.
         */
        private static void CreateBars(Node input, Plot plot)
        {
            // Extracting optional ctor args.
            var bars = input.Children.FirstOrDefault(x => x.Name == "bars")?.Children.Select(x => x.GetEx<double>())?.ToArray() ??
                throw new HyperlambdaException("No [bars] provided to [image.chart]");

            // Creating our instance.
            plot.Add.Bars(bars);
            plot.Axes.Margins(bottom: 0);

            // Creating our ticks.
            var ticks = new List<Tick>();
            var position = 0;
            foreach(var idxTick in input.Children.First(x => x.Name == "bars").Children)
            {
                ticks.Add(new Tick(position++, idxTick.Name));
            }
            plot.Axes.Bottom.TickGenerator = new ScottPlot.TickGenerators.NumericManual(ticks.ToArray());

            // Applying common defaults.
            plot.Axes.Bottom.MajorTickStyle.Length = 10;
            plot.HideGrid();
        }

        private static void CreateStacked(Node input, Plot plot)
        {
            // Extracting optional ctor args.
            if (!input.Children.Any(x => x.Name == "bars"))
                throw new HyperlambdaException("No [bars] provided to [image.chart]");
            if (!input.Children.Any(x => x.Name == "legend"))
                throw new HyperlambdaException("No [legend] provided to [image.chart]");

            // Creating a default color palette.
            ScottPlot.Palettes.Category10 palette = new();

            // Instance we're actually adding to our plot.
            var bars = new List<Bar>();

            // Iterating through each bar.
            var idxNoBar = 1;
            foreach (var idxBar in input.Children.First(x => x.Name == "bars").Children)
            {
                var valueBase = 0D;
                var idxNoY = 0;
                var total = 0D;
                foreach (var idxCell in idxBar.Children)
                {
                    var value = idxCell.GetEx<double>();
                    var bar = new Bar
                    {
                        Position = idxNoBar,
                        ValueBase = valueBase,
                        Value = value + total,
                        FillColor = palette.GetColor(idxNoY++),
                    };
                    total += value;
                    valueBase = total;
                    bars.Add(bar);
                }
                idxNoBar++;
            }

            // Creating our ticks.
            var ticks = new List<Tick>();
            var position = 1;
            foreach(var idxTick in input.Children.First(x => x.Name == "bars").Children)
            {
                ticks.Add(new Tick(position++, idxTick.Name));
            }
            plot.Axes.Bottom.TickGenerator = new ScottPlot.TickGenerators.NumericManual(ticks.ToArray());

            // Creating our legend.
            var idxNo = 0;
            foreach(var idxLegend in input.Children.First(x => x.Name == "legend").Children)
            {
                var idx = new LegendItem
                {
                    LabelText = idxLegend.GetEx<string>(),
                    FillColor = palette.GetColor(idxNo++),
                    LabelOffsetY = 2,
                    
                };
                plot.Legend.ManualItems.Add(idx);
            }
            plot.Legend.Orientation = Orientation.Horizontal;
            plot.ShowLegend(Alignment.UpperRight);

            // Applying common defaults.
            plot.Axes.Bottom.MajorTickStyle.Length = 10;
            plot.HideGrid();

            // Creating our instance.
            plot.Add.Bars(bars);
            plot.Axes.Margins(bottom: 0, top: .3);
        }

        private static void CreateGrouped(Node input, Plot plot)
        {
            // Extracting optional ctor args.
            if (!input.Children.Any(x => x.Name == "bars"))
                throw new HyperlambdaException("No [bars] provided to [image.chart]");
            if (!input.Children.Any(x => x.Name == "legend"))
                throw new HyperlambdaException("No [legend] provided to [image.chart]");

            // Creating a default color palette.
            ScottPlot.Palettes.Category10 palette = new();

            // Instance we're actually adding to our plot.
            var bars = new List<Bar>();

            // Iterating through each bar.
            var idxNoBar = 1;
            var groupCount = 0;
            foreach (var idxBar in input.Children.First(x => x.Name == "bars").Children)
            {
                groupCount = idxBar.Children.Count();
                var idxNoY = 0;
                foreach (var idxCell in idxBar.Children)
                {
                    var value = idxCell.GetEx<double>();
                    var bar = new Bar
                    {
                        Position = idxNoBar,
                        Value = value,
                        FillColor = palette.GetColor(idxNoY++),
                    };
                    bars.Add(bar);
                    idxNoBar++;
                }
                idxNoBar++;
            }

            // Creating our legend.
            plot.Legend.IsVisible = true;
            plot.Legend.Alignment = Alignment.UpperLeft;
            var idxNo = 0;
            foreach(var idxLegend in input.Children.First(x => x.Name == "legend").Children)
            {
                var idx = new LegendItem
                {
                    LabelText = idxLegend.GetEx<string>(),
                    FillColor = palette.GetColor(idxNo++),
                    LabelOffsetY = 2,
                    
                };
                plot.Legend.ManualItems.Add(idx);
            }
            plot.Legend.Orientation = Orientation.Horizontal;
            plot.ShowLegend(Alignment.UpperRight);

            // Applying common defaults.
            plot.Axes.Bottom.MajorTickStyle.Length = 10;
            plot.HideGrid();

            // Creating our ticks.
            var ticks = new List<Tick>();
            var position = 1;
            foreach(var idxTick in input.Children.First(x => x.Name == "bars").Children)
            {
                ticks.Add(new Tick(position, idxTick.Name));
                position += groupCount + 1;
            }
            plot.Axes.Bottom.TickGenerator = new ScottPlot.TickGenerators.NumericManual(ticks.ToArray());

            // Creating our instance.
            plot.Add.Bars(bars);
            plot.Axes.Margins(bottom: 0);
        }
    }
}
