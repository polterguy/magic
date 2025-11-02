/**
 * HybridSearchSlot.cs - FULL IMPLEMENTATION
 * Magic Platform Hyperlambda Slot for Hybrid Vector Search
 *
 * Combines compressed vector similarity with optional metadata filtering
 *
 * For Thomas Hansen's Magic Platform
 * Francesco Pedulli, November 2, 2025
 */

using System;
using System.Collections.Generic;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.openai.TOE
{
    /// <summary>
    /// [openai.toe.hybrid.search] - Hybrid vector search with compressed embeddings
    /// Combines metadata filtering + vector similarity using TOE compression
    /// </summary>
    [Slot(Name = "openai.toe.hybrid.search")]
    public class TOEHybridSearch : ISlot
    {
        private static TOERuntimeLoader? _phase2Runtime;
        private static TOERuntimeLoader? _phase3Runtime;
        private static readonly object _lock = new object();

        public void Signal(ISignaler signaler, Node input)
        {
            // Get parameters
            var query = input.Children.FirstOrDefault(x => x.Name == "query")?.GetEx<string>();
            var table = input.Children.FirstOrDefault(x => x.Name == "table")?.GetEx<string>();
            var embeddingColumn = input.Children.FirstOrDefault(x => x.Name == "embedding_column")?.GetEx<string>() ?? "embedding_compressed";
            var top = input.Children.FirstOrDefault(x => x.Name == "top")?.GetEx<int>() ?? 10;
            var phase = input.Children.FirstOrDefault(x => x.Name == "phase")?.GetEx<int>() ?? 2;
            var model = input.Children.FirstOrDefault(x => x.Name == "model")?.GetEx<string>() ?? "text-embedding-3-small";

            if (string.IsNullOrEmpty(query))
                throw new ArgumentException("Parameter 'query' is required");

            if (string.IsNullOrEmpty(table))
                throw new ArgumentException("Parameter 'table' is required");

            if (phase != 2 && phase != 3)
                throw new ArgumentException($"Invalid phase: {phase}. Must be 2 or 3.");

            // Initialize runtime loaders (lazy, thread-safe)
            lock (_lock)
            {
                if (_phase2Runtime == null && phase == 2)
                {
                    string toePath = "./plugins/magic.lambda.openai/TOE/binaries/phase2.so.toe";
                    string key = "THOMAS_HANSEN_AINIRO_2025_PHASE2_768X";
                    _phase2Runtime = new TOERuntimeLoader(toePath, key);
                }

                if (_phase3Runtime == null && phase == 3)
                {
                    string toePath = "./plugins/magic.lambda.openai/TOE/binaries/phase3.so.toe";
                    string key = "THOMAS_HANSEN_AINIRO_2025_PHASE3_3072X";
                    _phase3Runtime = new TOERuntimeLoader(toePath, key);
                }
            }

            // Step 1: Get query embedding from OpenAI
            var embeddingNode = new Node("openai.embeddings.create");
            embeddingNode.Add(new Node("model", model));
            embeddingNode.Add(new Node("input", query));
            signaler.Signal("openai.embeddings.create", embeddingNode);

            // Extract embedding vector
            var embeddingVector = embeddingNode
                .Children.FirstOrDefault(x => x.Name == "data")?
                .Children.FirstOrDefault()?
                .Children.FirstOrDefault(x => x.Name == "embedding")?
                .GetEx<float[]>();

            if (embeddingVector == null)
                throw new Exception("Failed to get embedding from OpenAI");

            // Step 2: Compress query embedding
            byte[] queryCompressed;
            try
            {
                queryCompressed = phase == 2
                    ? _phase2Runtime!.Compress(embeddingVector)
                    : _phase3Runtime!.Compress(embeddingVector);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to compress query embedding: {ex.Message}", ex);
            }

            // Step 3: Read candidates from database
            var dataReadNode = new Node("data.read");
            dataReadNode.Add(new Node("table", table));

            // Copy any where clauses from input (metadata filtering)
            var whereNode = input.Children.FirstOrDefault(x => x.Name == "where");
            if (whereNode != null)
            {
                dataReadNode.Add(whereNode.Clone());
            }

            signaler.Signal("data.read", dataReadNode);

            // Step 4: Compute distances for all candidates
            var results = new List<(Node candidate, double distance)>();

            foreach (var candidate in dataReadNode.Children)
            {
                var candidateEmbedding = candidate.Children
                    .FirstOrDefault(x => x.Name == embeddingColumn)?
                    .GetEx<byte[]>();

                if (candidateEmbedding == null)
                    continue; // Skip if no embedding

                // Compute distance
                double distance;
                try
                {
                    distance = phase == 2
                        ? _phase2Runtime!.Distance(queryCompressed, candidateEmbedding)
                        : _phase3Runtime!.Distance(queryCompressed, candidateEmbedding);
                }
                catch
                {
                    continue; // Skip on error
                }

                // Add distance to candidate node
                candidate.Add(new Node("distance", distance));
                results.Add((candidate, distance));
            }

            // Step 5: Sort by distance (ascending = most similar)
            results.Sort((a, b) => a.distance.CompareTo(b.distance));

            // Step 6: Return top K results
            input.Clear();
            foreach (var result in results.Take(top))
            {
                input.Add(result.candidate);
            }

            // Add metadata
            input.Add(new Node("total_candidates", results.Count));
            input.Add(new Node("returned", Math.Min(top, results.Count)));
            input.Add(new Node("query", query));
            input.Add(new Node("phase", phase));
        }
    }
}
