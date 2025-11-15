/**
 * MagicEmbeddingSlot.cs - CORRECTED VERSION
 * Magic Platform Hyperlambda Slot for TOE-Compressed Embeddings
 *
 * Matches Magic's actual slot architecture (ISlot, Signal method, no DI)
 *
 * For Thomas Hansen's Magic Platform
 * Francesco Pedulli, November 2, 2025
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.openai.TOE
{
    /// <summary>
    /// [openai.toe.compress] - Compress OpenAI embedding using TOE
    /// </summary>
    [Slot(Name = "openai.toe.compress")]
    public class TOECompress : ISlot
    {
        private static TOERuntimeLoader? _phase2Runtime;
        private static TOERuntimeLoader? _phase3Runtime;
        private static readonly object _lock = new object();

        public void Signal(ISignaler signaler, Node input)
        {
            // Get parameters from node
            var vector = input.Children.FirstOrDefault(x => x.Name == "vector")?.GetEx<float[]>();
            if (vector == null)
                throw new ArgumentException("No vector provided. Use [vector] node with float array.");

            var phase = input.Children.FirstOrDefault(x => x.Name == "phase")?.GetEx<int>() ?? 2;

            if (phase != 2 && phase != 3)
                throw new ArgumentException($"Invalid phase: {phase}. Must be 2 or 3.");

            // Initialize runtimes (lazy, thread-safe)
            lock (_lock)
            {
                if (_phase2Runtime == null && phase == 2)
                {
                    string toePath = "./plugins/magic.lambda.openai/TOE/binaries/linux/phase2.so.toe";
                    string key = "THOMAS_HANSEN_AINIRO_2025_PHASE2_768X";
                    _phase2Runtime = new TOERuntimeLoader(toePath, key);
                }

                if (_phase3Runtime == null && phase == 3)
                {
                    string toePath = "./plugins/magic.lambda.openai/TOE/binaries/linux/phase3.so.toe";
                    string key = "THOMAS_HANSEN_AINIRO_2025_PHASE3_3072X";
                    _phase3Runtime = new TOERuntimeLoader(toePath, key);
                }
            }

            // Compress
            byte[] compressed;
            try
            {
                compressed = phase == 2
                    ? _phase2Runtime!.Compress(vector)
                    : _phase3Runtime!.Compress(vector);
            }
            catch (Exception ex)
            {
                throw new Exception($"TOE compression failed: {ex.Message}", ex);
            }

            // Return compressed blob
            input.Value = compressed;
            input.Add(new Node("size", compressed.Length));
            input.Add(new Node("phase", phase));
            input.Add(new Node("compression_ratio", phase == 2 ? 768 : 3072));
        }
    }

    /// <summary>
    /// [openai.toe.distance] - Compute distance between two TOE-compressed embeddings
    /// </summary>
    [Slot(Name = "openai.toe.distance")]
    public class TOEDistance : ISlot
    {
        private static TOERuntimeLoader? _phase2Runtime;
        private static TOERuntimeLoader? _phase3Runtime;
        private static readonly object _lock = new object();

        public void Signal(ISignaler signaler, Node input)
        {
            // Get parameters
            var blob_a = input.Children.FirstOrDefault(x => x.Name == "blob_a")?.GetEx<byte[]>();
            var blob_b = input.Children.FirstOrDefault(x => x.Name == "blob_b")?.GetEx<byte[]>();

            if (blob_a == null || blob_b == null)
                throw new ArgumentException("Need both [blob_a] and [blob_b] nodes with byte arrays.");

            var phase = input.Children.FirstOrDefault(x => x.Name == "phase")?.GetEx<int>() ?? 2;

            // Initialize runtimes
            lock (_lock)
            {
                if (_phase2Runtime == null && phase == 2)
                {
                    string toePath = "./plugins/magic.lambda.openai/TOE/binaries/linux/phase2.so.toe";
                    string key = "THOMAS_HANSEN_AINIRO_2025_PHASE2_768X";
                    _phase2Runtime = new TOERuntimeLoader(toePath, key);
                }

                if (_phase3Runtime == null && phase == 3)
                {
                    string toePath = "./plugins/magic.lambda.openai/TOE/binaries/linux/phase3.so.toe";
                    string key = "THOMAS_HANSEN_AINIRO_2025_PHASE3_3072X";
                    _phase3Runtime = new TOERuntimeLoader(toePath, key);
                }
            }

            // Compute distance
            double distance;
            try
            {
                distance = phase == 2
                    ? _phase2Runtime!.Distance(blob_a, blob_b)
                    : _phase3Runtime!.Distance(blob_a, blob_b);
            }
            catch (Exception ex)
            {
                throw new Exception($"TOE distance calculation failed: {ex.Message}", ex);
            }

            // Return distance
            input.Value = distance;
        }
    }
}
