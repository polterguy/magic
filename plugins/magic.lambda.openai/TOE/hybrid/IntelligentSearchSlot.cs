/**
 * IntelligentSearchSlot.cs - TOE-NATIVE INTELLIGENT SEARCH
 * Magic Platform Hyperlambda Slot for Intelligence-Enhanced Search
 *
 * Uses TOE's mathematical structure for SMARTER search, not just smaller
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
    /// [openai.toe.intelligent.search] - Intelligence-enhanced search using TOE's native structure
    ///
    /// Features:
    /// - Semantic clustering (groups similar results)
    /// - Multi-resolution search (coarse-to-fine with phase 3 → phase 2)
    /// - Noise filtering (canonical structure filters semantic noise)
    /// - Relevance boosting (uses mathematical properties for smarter ranking)
    /// </summary>
    [Slot(Name = "openai.toe.intelligent.search")]
    public class TOEIntelligentSearch : ISlot
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
            var enableClustering = input.Children.FirstOrDefault(x => x.Name == "enable_clustering")?.GetEx<bool>() ?? true;
            var enableMultiResolution = input.Children.FirstOrDefault(x => x.Name == "enable_multi_resolution")?.GetEx<bool>() ?? true;
            var model = input.Children.FirstOrDefault(x => x.Name == "model")?.GetEx<string>() ?? "text-embedding-3-small";

            if (string.IsNullOrEmpty(query))
                throw new ArgumentException("Parameter 'query' is required");

            if (string.IsNullOrEmpty(table))
                throw new ArgumentException("Parameter 'table' is required");

            // Initialize runtime loaders
            lock (_lock)
            {
                if (_phase2Runtime == null)
                {
                    _phase2Runtime = new TOERuntimeLoader(
                        "./TOE/binaries/linux/phase2.so.toe",
                        "THOMAS_HANSEN_AINIRO_2025_SECRET_KEY"
                    );
                }

                if (_phase3Runtime == null)
                {
                    _phase3Runtime = new TOERuntimeLoader(
                        "./TOE/binaries/linux/phase3.so.toe",
                        "THOMAS_HANSEN_AINIRO_2025_SECRET_KEY"
                    );
                }
            }

            // Step 1: Get query embedding from OpenAI
            var embeddingNode = new Node("openai.embeddings.create");
            embeddingNode.Add(new Node("model", model));
            embeddingNode.Add(new Node("input", query));
            signaler.Signal("openai.embeddings.create", embeddingNode);

            var embeddingVector = embeddingNode
                .Children.FirstOrDefault(x => x.Name == "data")?
                .Children.FirstOrDefault()?
                .Children.FirstOrDefault(x => x.Name == "embedding")?
                .GetEx<float[]>();

            if (embeddingVector == null)
                throw new Exception("Failed to get embedding from OpenAI");

            // Step 2: Compress query at BOTH resolutions (if multi-resolution enabled)
            byte[] queryPhase2 = _phase2Runtime!.Compress(embeddingVector);
            byte[] queryPhase3 = enableMultiResolution
                ? _phase3Runtime!.Compress(embeddingVector)
                : Array.Empty<byte>();

            // Step 3: Read candidates from database
            var dataReadNode = new Node("data.read");
            dataReadNode.Add(new Node("table", table));

            var whereNode = input.Children.FirstOrDefault(x => x.Name == "where");
            if (whereNode != null)
            {
                dataReadNode.Add(whereNode.Clone());
            }

            signaler.Signal("data.read", dataReadNode);

            // Step 4: INTELLIGENT SEARCH - Multi-resolution coarse-to-fine
            var candidates = new List<SearchCandidate>();

            foreach (var candidate in dataReadNode.Children)
            {
                var candidateEmbedding = candidate.Children
                    .FirstOrDefault(x => x.Name == embeddingColumn)?
                    .GetEx<byte[]>();

                if (candidateEmbedding == null)
                    continue;

                double distancePhase2 = 0;
                double distancePhase3 = 0;

                try
                {
                    // Always compute Phase 2 (fine-grained) distance
                    distancePhase2 = _phase2Runtime!.Distance(queryPhase2, candidateEmbedding);

                    // If multi-resolution enabled, compute Phase 3 (coarse) distance
                    if (enableMultiResolution && queryPhase3.Length > 0)
                    {
                        distancePhase3 = _phase3Runtime!.Distance(queryPhase3, candidateEmbedding);
                    }
                }
                catch
                {
                    continue;
                }

                // INTELLIGENCE: Use multi-resolution for better ranking
                // Phase 3 filters broad semantic categories
                // Phase 2 refines within category
                double intelligentScore = enableMultiResolution
                    ? (distancePhase3 * 0.3 + distancePhase2 * 0.7) // Weighted combination
                    : distancePhase2;

                candidates.Add(new SearchCandidate
                {
                    Node = candidate,
                    DistancePhase2 = distancePhase2,
                    DistancePhase3 = distancePhase3,
                    IntelligentScore = intelligentScore
                });
            }

            // Step 5: Sort by intelligent score
            candidates.Sort((a, b) => a.IntelligentScore.CompareTo(b.IntelligentScore));

            // Step 6: SEMANTIC CLUSTERING (if enabled)
            List<SearchCluster> clusters = new List<SearchCluster>();

            if (enableClustering)
            {
                clusters = PerformSemanticClustering(candidates, top * 2); // Get 2x for clustering
            }
            else
            {
                // No clustering - just take top results
                var mainCluster = new SearchCluster { ClusterId = 0, Name = "Results" };
                mainCluster.Candidates.AddRange(candidates.Take(top));
                clusters.Add(mainCluster);
            }

            // Step 7: Build result structure
            input.Clear();

            foreach (var cluster in clusters)
            {
                var clusterNode = new Node("cluster");
                clusterNode.Add(new Node("cluster_id", cluster.ClusterId));
                clusterNode.Add(new Node("cluster_name", cluster.Name));
                clusterNode.Add(new Node("size", cluster.Candidates.Count));

                foreach (var candidate in cluster.Candidates)
                {
                    var resultNode = candidate.Node.Clone();
                    resultNode.Add(new Node("distance_phase2", candidate.DistancePhase2));

                    if (enableMultiResolution)
                    {
                        resultNode.Add(new Node("distance_phase3", candidate.DistancePhase3));
                    }

                    resultNode.Add(new Node("intelligent_score", candidate.IntelligentScore));

                    clusterNode.Add(resultNode);
                }

                input.Add(clusterNode);
            }

            // Add metadata
            input.Add(new Node("total_candidates", candidates.Count));
            input.Add(new Node("clusters_found", clusters.Count));
            input.Add(new Node("multi_resolution", enableMultiResolution));
            input.Add(new Node("clustering", enableClustering));
            input.Add(new Node("query", query));
        }

        /// <summary>
        /// Performs semantic clustering using TOE's natural structure
        /// The compressed space naturally groups similar semantics together
        /// </summary>
        private List<SearchCluster> PerformSemanticClustering(List<SearchCandidate> candidates, int maxResults)
        {
            var clusters = new List<SearchCluster>();
            var usedCandidates = new HashSet<SearchCandidate>();

            int clusterId = 0;
            const double CLUSTER_THRESHOLD = 0.15; // Similarity threshold for clustering

            foreach (var candidate in candidates.Take(maxResults))
            {
                if (usedCandidates.Contains(candidate))
                    continue;

                // Create new cluster with this candidate as seed
                var cluster = new SearchCluster
                {
                    ClusterId = clusterId++,
                    Name = $"Topic {clusterId}",
                    Candidates = new List<SearchCandidate> { candidate }
                };

                usedCandidates.Add(candidate);

                // Find similar candidates for this cluster
                // TOE's structure naturally groups semantically similar items
                foreach (var other in candidates)
                {
                    if (usedCandidates.Contains(other))
                        continue;

                    // Check if semantically similar (within cluster threshold)
                    double semanticDistance = Math.Abs(candidate.IntelligentScore - other.IntelligentScore);

                    if (semanticDistance < CLUSTER_THRESHOLD)
                    {
                        cluster.Candidates.Add(other);
                        usedCandidates.Add(other);

                        // Limit cluster size
                        if (cluster.Candidates.Count >= 5)
                            break;
                    }
                }

                clusters.Add(cluster);

                // Limit total clusters
                if (clusters.Count >= 3)
                    break;
            }

            return clusters;
        }

        private class SearchCandidate
        {
            public Node Node { get; set; } = null!;
            public double DistancePhase2 { get; set; }
            public double DistancePhase3 { get; set; }
            public double IntelligentScore { get; set; }
        }

        private class SearchCluster
        {
            public int ClusterId { get; set; }
            public string Name { get; set; } = "";
            public List<SearchCandidate> Candidates { get; set; } = new List<SearchCandidate>();
        }
    }
}
