/**
 * MaximumSearchSlot.cs - TOE MAXIMUM CAPABILITIES UNLEASHED
 * Magic Platform Hyperlambda Slot for Maximum Intelligence
 *
 * Features:
 * - Adaptive phase selection (automatic optimization)
 * - Explainable AI (why these results?)
 * - Semantic drift detection (prevents nonsense)
 * - Multi-query synthesis (complex constraints)
 * - Real-time adaptation (dynamic strategy)
 *
 * For Thomas Hansen's Magic Platform
 * Francesco Pedulli, November 2, 2025
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.openai.TOE
{
    /// <summary>
    /// [openai.toe.maximum.search] - TOE at full power
    /// Adaptive, explainable, drift-detecting, multi-query, real-time optimizing search
    /// </summary>
    [Slot(Name = "openai.toe.maximum.search")]
    public class TOEMaximumSearch : ISlot
    {
        private static TOERuntimeLoader? _phase2Runtime;
        private static TOERuntimeLoader? _phase3Runtime;
        private static readonly object _lock = new object();

        public void Signal(ISignaler signaler, Node input)
        {
            var startTime = DateTime.UtcNow;

            // Get parameters
            var queries = GetQueries(input);
            var table = input.Children.FirstOrDefault(x => x.Name == "table")?.GetEx<string>();
            var embeddingColumn = input.Children.FirstOrDefault(x => x.Name == "embedding_column")?.GetEx<string>() ?? "embedding_compressed";
            var top = input.Children.FirstOrDefault(x => x.Name == "top")?.GetEx<int>() ?? 10;
            var maxLatencyMs = input.Children.FirstOrDefault(x => x.Name == "max_latency_ms")?.GetEx<int>() ?? 500;
            var enableExplanations = input.Children.FirstOrDefault(x => x.Name == "explain")?.GetEx<bool>() ?? true;
            var detectDrift = input.Children.FirstOrDefault(x => x.Name == "detect_drift")?.GetEx<bool>() ?? true;
            var model = input.Children.FirstOrDefault(x => x.Name == "model")?.GetEx<string>() ?? "text-embedding-3-small";

            if (queries.Count == 0)
                throw new ArgumentException("At least one query is required");

            if (string.IsNullOrEmpty(table))
                throw new ArgumentException("Parameter 'table' is required");

            // Initialize runtimes
            lock (_lock)
            {
                if (_phase2Runtime == null)
                {
                    _phase2Runtime = new TOERuntimeLoader(
                        "./plugins/magic.lambda.openai/TOE/binaries/linux/phase2.so.toe",
                        "THOMAS_HANSEN_AINIRO_2025_PHASE2_768X"
                    );
                }

                if (_phase3Runtime == null)
                {
                    _phase3Runtime = new TOERuntimeLoader(
                        "./plugins/magic.lambda.openai/TOE/binaries/linux/phase3.so.toe",
                        "THOMAS_HANSEN_AINIRO_2025_PHASE3_3072X"
                    );
                }
            }

            // Step 1: ADAPTIVE PHASE SELECTION - Analyze query complexity
            var selectedPhases = new List<int>();
            var queryEmbeddings = new List<(string query, float[] embedding, byte[] compressed2, byte[] compressed3, int selectedPhase)>();

            foreach (var query in queries)
            {
                // Get embedding
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
                    continue;

                // ADAPTIVE: Analyze query complexity to select optimal phase
                int selectedPhase = AnalyzeQueryComplexity(query, maxLatencyMs);
                selectedPhases.Add(selectedPhase);

                // Compress at both phases for flexibility
                byte[] compressed2 = _phase2Runtime!.Compress(embeddingVector);
                byte[] compressed3 = _phase3Runtime!.Compress(embeddingVector);

                queryEmbeddings.Add((query, embeddingVector, compressed2, compressed3, selectedPhase));
            }

            // Step 2: Read candidates from database
            var dataReadNode = new Node("data.read");
            dataReadNode.Add(new Node("table", table));

            var whereNode = input.Children.FirstOrDefault(x => x.Name == "where");
            if (whereNode != null)
            {
                dataReadNode.Add(whereNode.Clone());
            }

            signaler.Signal("data.read", dataReadNode);

            var candidates = dataReadNode.Children.ToList();

            // Step 3: SEMANTIC DRIFT DETECTION
            if (detectDrift && candidates.Count > 0)
            {
                var driftScore = DetectSemanticDrift(queryEmbeddings, candidates, embeddingColumn);

                if (driftScore > 0.8) // High drift = wrong database
                {
                    input.Clear();
                    input.Add(new Node("semantic_mismatch", true));
                    input.Add(new Node("drift_score", driftScore));
                    input.Add(new Node("message",
                        "Query semantics don't match database content. Results would be low quality."));
                    input.Add(new Node("suggestion",
                        "Check if you're searching the correct table/database."));
                    return;
                }
            }

            // Step 4: MULTI-QUERY SYNTHESIS - Combine all queries intelligently
            var synthesizedResults = new List<MaximumSearchResult>();

            foreach (var candidate in candidates)
            {
                var candidateEmbedding = candidate.Children
                    .FirstOrDefault(x => x.Name == embeddingColumn)?
                    .GetEx<byte[]>();

                if (candidateEmbedding == null)
                    continue;

                var result = new MaximumSearchResult
                {
                    Node = candidate,
                    Distances = new List<double>(),
                    Explanations = new List<string>()
                };

                // Compute distance for each query
                foreach (var queryData in queryEmbeddings)
                {
                    try
                    {
                        double distance;
                        string phaseUsed;

                        // REAL-TIME ADAPTATION: Check remaining time budget
                        var elapsedSoFar = (DateTime.UtcNow - startTime).TotalMilliseconds;
                        var remainingTime = maxLatencyMs - elapsedSoFar;

                        if (remainingTime < 100 && queryData.selectedPhase == 2)
                        {
                            // Running out of time - fall back to Phase 3
                            distance = _phase3Runtime!.Distance(queryData.compressed3, candidateEmbedding);
                            phaseUsed = "Phase 3 (time-adapted)";
                        }
                        else if (queryData.selectedPhase == 2)
                        {
                            distance = _phase2Runtime!.Distance(queryData.compressed2, candidateEmbedding);
                            phaseUsed = "Phase 2 (selected)";
                        }
                        else
                        {
                            distance = _phase3Runtime!.Distance(queryData.compressed3, candidateEmbedding);
                            phaseUsed = "Phase 3 (selected)";
                        }

                        result.Distances.Add(distance);

                        // EXPLAINABLE AI: Generate explanation
                        if (enableExplanations)
                        {
                            var explanation = GenerateExplanation(queryData.query, distance, phaseUsed, candidate);
                            result.Explanations.Add(explanation);
                        }
                    }
                    catch
                    {
                        result.Distances.Add(double.MaxValue);
                        result.Explanations.Add("Distance computation failed");
                    }
                }

                // MULTI-QUERY SYNTHESIS: Combine distances intelligently
                // For multiple queries, we want ALL to match (intersection, not union)
                result.SynthesizedScore = queries.Count > 1
                    ? result.Distances.Max() // Worst match determines overall score (all must match)
                    : result.Distances.FirstOrDefault();

                synthesizedResults.Add(result);
            }

            // Step 5: Sort by synthesized score
            synthesizedResults.Sort((a, b) => a.SynthesizedScore.CompareTo(b.SynthesizedScore));

            // Step 6: Build result structure with explanations
            input.Clear();

            var topResults = synthesizedResults.Take(top).ToList();

            foreach (var result in topResults)
            {
                var resultNode = result.Node.Clone();
                resultNode.Add(new Node("synthesized_score", result.SynthesizedScore));

                if (enableExplanations)
                {
                    var explanationNode = new Node("explanation");

                    for (int i = 0; i < queries.Count; i++)
                    {
                        var queryExplanation = new Node($"query_{i + 1}");
                        queryExplanation.Add(new Node("query_text", queries[i]));
                        queryExplanation.Add(new Node("distance", result.Distances[i]));
                        queryExplanation.Add(new Node("explanation", result.Explanations[i]));
                        explanationNode.Add(queryExplanation);
                    }

                    resultNode.Add(explanationNode);
                }

                input.Add(resultNode);
            }

            // Add metadata
            var elapsed = (DateTime.UtcNow - startTime).TotalMilliseconds;
            input.Add(new Node("total_candidates", candidates.Count));
            input.Add(new Node("returned", topResults.Count));
            input.Add(new Node("elapsed_ms", elapsed));
            input.Add(new Node("adaptive_phases", string.Join(", ", selectedPhases.Select(p => $"Phase {p}"))));
            input.Add(new Node("multi_query_mode", queries.Count > 1 ? "intersection" : "single"));
            input.Add(new Node("explanations_enabled", enableExplanations));
            input.Add(new Node("drift_detection", detectDrift));
        }

        /// <summary>
        /// ADAPTIVE PHASE SELECTION: Analyzes query complexity to choose optimal phase
        /// </summary>
        private int AnalyzeQueryComplexity(string query, int maxLatencyMs)
        {
            // Simple heuristics for phase selection:

            // 1. Query length
            if (query.Length < 20)
                return 3; // Short query = simple concept = Phase 3

            // 2. Word count
            var wordCount = query.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
            if (wordCount <= 3)
                return 3; // Few words = simple = Phase 3

            // 3. Latency requirement
            if (maxLatencyMs < 200)
                return 3; // Need speed = Phase 3

            // 4. Domain-specific keywords (medical, legal = need accuracy)
            var criticalKeywords = new[] {
                "medical", "diagnosis", "legal", "contract", "regulation",
                "surgery", "treatment", "court", "law", "compliance"
            };

            if (criticalKeywords.Any(k => query.ToLower().Contains(k)))
                return 2; // Critical domain = Phase 2

            // 5. Complex queries (technical terms, multi-concept)
            var complexIndicators = new[] {
                "and", "but", "however", "specifically", "particularly",
                "distinguish", "compare", "contrast", "analyze"
            };

            var complexityCount = complexIndicators.Count(k => query.ToLower().Contains(k));
            if (complexityCount >= 2)
                return 2; // Complex query = Phase 2

            // Default: Phase 2 (balanced)
            return 2;
        }

        /// <summary>
        /// SEMANTIC DRIFT DETECTION: Checks if query semantics match database content
        /// </summary>
        private double DetectSemanticDrift(
            List<(string query, float[] embedding, byte[] compressed2, byte[] compressed3, int selectedPhase)> queries,
            List<Node> candidates,
            string embeddingColumn)
        {
            if (candidates.Count == 0)
                return 0.0;

            // Sample random candidates to check semantic match
            var sampleSize = Math.Min(10, candidates.Count);
            var random = new Random();
            var sampledCandidates = candidates.OrderBy(x => random.Next()).Take(sampleSize).ToList();

            var distances = new List<double>();

            foreach (var candidate in sampledCandidates)
            {
                var candidateEmbedding = candidate.Children
                    .FirstOrDefault(x => x.Name == embeddingColumn)?
                    .GetEx<byte[]>();

                if (candidateEmbedding == null)
                    continue;

                foreach (var queryData in queries)
                {
                    try
                    {
                        // Use Phase 3 for quick drift check
                        var distance = _phase3Runtime!.Distance(queryData.compressed3, candidateEmbedding);
                        distances.Add(distance);
                    }
                    catch { }
                }
            }

            if (distances.Count == 0)
                return 0.0;

            // If average distance is very high, there's semantic drift
            var avgDistance = distances.Average();

            // Normalize to 0-1 range (distance > 0.5 is typically poor match)
            return Math.Min(1.0, avgDistance / 0.5);
        }

        /// <summary>
        /// EXPLAINABLE AI: Generates human-readable explanation for result ranking
        /// </summary>
        private string GenerateExplanation(string query, double distance, string phaseUsed, Node candidate)
        {
            var sb = new StringBuilder();

            // 1. Overall match quality
            if (distance < 0.1)
                sb.Append("Excellent match. ");
            else if (distance < 0.2)
                sb.Append("Good match. ");
            else if (distance < 0.3)
                sb.Append("Moderate match. ");
            else
                sb.Append("Weak match. ");

            // 2. Distance score
            sb.Append($"Distance: {distance:F3}. ");

            // 3. Phase used
            sb.Append($"{phaseUsed}. ");

            // 4. Key terms (simple keyword overlap)
            var queryWords = query.ToLower()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(w => w.Length > 3) // Skip short words
                .ToHashSet();

            var matchedTerms = new List<string>();

            // Check candidate node for text fields
            foreach (var child in candidate.Children)
            {
                var value = child.Value?.ToString()?.ToLower();
                if (string.IsNullOrEmpty(value))
                    continue;

                foreach (var word in queryWords)
                {
                    if (value.Contains(word))
                    {
                        matchedTerms.Add(word);
                    }
                }
            }

            if (matchedTerms.Any())
            {
                sb.Append($"Matched terms: {string.Join(", ", matchedTerms.Distinct().Take(5))}. ");
            }

            return sb.ToString();
        }

        /// <summary>
        /// Extracts queries from input (supports single or multiple)
        /// </summary>
        private List<string> GetQueries(Node input)
        {
            var queries = new List<string>();

            // Check for single query
            var singleQuery = input.Children.FirstOrDefault(x => x.Name == "query")?.GetEx<string>();
            if (!string.IsNullOrEmpty(singleQuery))
            {
                queries.Add(singleQuery);
            }

            // Check for multiple queries
            var queriesNode = input.Children.FirstOrDefault(x => x.Name == "queries");
            if (queriesNode != null)
            {
                foreach (var queryChild in queriesNode.Children)
                {
                    var queryText = queryChild.GetEx<string>();
                    if (!string.IsNullOrEmpty(queryText))
                    {
                        queries.Add(queryText);
                    }
                }
            }

            return queries;
        }

        private class MaximumSearchResult
        {
            public Node Node { get; set; } = null!;
            public List<double> Distances { get; set; } = new List<double>();
            public List<string> Explanations { get; set; } = new List<string>();
            public double SynthesizedScore { get; set; }
        }
    }
}
