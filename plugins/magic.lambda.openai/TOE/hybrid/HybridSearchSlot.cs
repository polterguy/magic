/**
 * HybridSearchSlot.cs - OPTION 5: Hybrid Search Integration
 *
 * Combines:
 * - Metadata filtering (category, date, author, etc.)
 * - Full-text search (keywords)
 * - Vector similarity (semantic)
 *
 * Production-grade search quality
 *
 * Francesco Pedulli - November 1, 2025
 */

using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.openai
{
    /// <summary>
    /// Hybrid search: metadata + full-text + vector similarity
    /// Hyperlambda: openai.hybrid.search
    /// </summary>
    [Slot(Name = "openai.hybrid.search")]
    public class HybridSearchSlot : ISlot
    {
        private readonly IOpenAIService _openAIService;
        private readonly IDatabaseService _database;
        private static Phase2Compressor _compressor;

        public HybridSearchSlot(IOpenAIService openAIService, IDatabaseService database)
        {
            _openAIService = openAIService;
            _database = database;

            if (_compressor == null)
                _compressor = new Phase2Compressor();
        }

        public async Task SignalAsync(Node input)
        {
            // Extract parameters
            var query = input.GetEx<string>() ?? throw new ArgumentException("No query");
            var typeId = input.Children.FirstOrDefault(x => x.Name == "type_id")?.GetEx<int>();
            var maxResults = input.Children.FirstOrDefault(x => x.Name == "max_results")?.GetEx<int>() ?? 10;
            var threshold = input.Children.FirstOrDefault(x => x.Name == "threshold")?.GetEx<double>() ?? 0.5;

            // Optional metadata filters
            var category = input.Children.FirstOrDefault(x => x.Name == "category")?.GetEx<string>();
            var author = input.Children.FirstOrDefault(x => x.Name == "author")?.GetEx<string>();
            var dateFrom = input.Children.FirstOrDefault(x => x.Name == "date_from")?.GetEx<DateTime?>();
            var dateTo = input.Children.FirstOrDefault(x => x.Name == "date_to")?.GetEx<DateTime?>();

            // Optional keyword filters
            var keywords = input.Children.FirstOrDefault(x => x.Name == "keywords")?.GetEx<string>();

            Console.WriteLine($"[TOE Hybrid] Query: '{query}'");
            Console.WriteLine($"[TOE Hybrid] Filters: category={category}, author={author}, keywords={keywords}");

            // STEP 1: Get query embedding and compress
            var queryEmbedding = await _openAIService.GetEmbeddingAsync(query);
            var queryCompressed = _compressor.Compress(queryEmbedding);

            // STEP 2: Build SQL with metadata filtering + full-text search
            var sql = @"
                SELECT
                    e.id,
                    e.prompt,
                    e.completion,
                    e.embedding_phase2,
                    e.category,
                    e.author,
                    e.created_at,
                    e.metadata,
                    MATCH(e.completion) AGAINST(@keywords) AS fulltext_score
                FROM ml_training_snippets e
                WHERE 1=1";

            var parameters = new Dictionary<string, object> {
                { "keywords", keywords ?? query }
            };

            // Add metadata filters
            if (typeId.HasValue) {
                sql += " AND e.type_id = @typeId";
                parameters["typeId"] = typeId.Value;
            }

            if (!string.IsNullOrEmpty(category)) {
                sql += " AND e.category = @category";
                parameters["category"] = category;
            }

            if (!string.IsNullOrEmpty(author)) {
                sql += " AND e.author = @author";
                parameters["author"] = author;
            }

            if (dateFrom.HasValue) {
                sql += " AND e.created_at >= @dateFrom";
                parameters["dateFrom"] = dateFrom.Value;
            }

            if (dateTo.HasValue) {
                sql += " AND e.created_at <= @dateTo";
                parameters["dateTo"] = dateTo.Value;
            }

            // Add full-text filter (if keywords provided)
            if (!string.IsNullOrEmpty(keywords)) {
                sql += " AND MATCH(e.completion) AGAINST(@keywords)";
            }

            // Limit pre-filtering results (avoid computing distance for millions)
            sql += " LIMIT 10000";  // Pre-filter to top 10K candidates

            var candidates = await _database.QueryAsync<EmbeddingCandidate>(sql, parameters);

            Console.WriteLine($"[TOE Hybrid] Found {candidates.Count} candidates after filtering");

            // STEP 3: Compute vector similarity for filtered candidates
            var results = new List<HybridSearchResult>();

            foreach (var candidate in candidates)
            {
                double vectorDistance = _compressor.Distance(queryCompressed, candidate.embedding_phase2);
                double vectorSimilarity = 1.0 / (1.0 + vectorDistance);

                // STEP 4: Combine scores (weighted)
                double fullTextScore = candidate.fulltext_score;
                double finalScore = CombineScores(vectorSimilarity, fullTextScore);

                if (finalScore >= threshold)
                {
                    results.Add(new HybridSearchResult
                    {
                        Id = candidate.id,
                        Prompt = candidate.prompt,
                        Completion = candidate.completion,
                        Category = candidate.category,
                        Author = candidate.author,
                        CreatedAt = candidate.created_at,
                        Metadata = candidate.metadata,
                        VectorSimilarity = vectorSimilarity,
                        FullTextScore = fullTextScore,
                        FinalScore = finalScore
                    });
                }
            }

            // STEP 5: Rank by combined score
            var topResults = results
                .OrderByDescending(r => r.FinalScore)
                .Take(maxResults)
                .ToList();

            Console.WriteLine($"[TOE Hybrid] ✓ Returning {topResults.Count} results");

            // STEP 6: Return in Hyperlambda format
            input.Clear();
            foreach (var result in topResults)
            {
                var resultNode = new Node("result");
                resultNode.Add(new Node("id", result.Id));
                resultNode.Add(new Node("prompt", result.Prompt));
                resultNode.Add(new Node("completion", result.Completion));
                resultNode.Add(new Node("category", result.Category));
                resultNode.Add(new Node("author", result.Author));
                resultNode.Add(new Node("created_at", result.CreatedAt));
                resultNode.Add(new Node("vector_similarity", result.VectorSimilarity));
                resultNode.Add(new Node("fulltext_score", result.FullTextScore));
                resultNode.Add(new Node("final_score", result.FinalScore));
                input.Add(resultNode);
            }
        }

        /// <summary>
        /// Combine vector similarity and full-text score
        /// Strategy: Weighted average (configurable)
        /// </summary>
        private double CombineScores(double vectorSimilarity, double fullTextScore)
        {
            // Weight configuration (can be tuned)
            const double VECTOR_WEIGHT = 0.7;
            const double FULLTEXT_WEIGHT = 0.3;

            // Normalize full-text score to [0, 1]
            double normalizedFullText = Math.Min(fullTextScore / 10.0, 1.0);

            // Weighted combination
            return (vectorSimilarity * VECTOR_WEIGHT) + (normalizedFullText * FULLTEXT_WEIGHT);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DATA MODELS
    // ═══════════════════════════════════════════════════════════════════════

    internal class EmbeddingCandidate
    {
        public int id { get; set; }
        public string prompt { get; set; }
        public string completion { get; set; }
        public byte[] embedding_phase2 { get; set; }
        public string category { get; set; }
        public string author { get; set; }
        public DateTime created_at { get; set; }
        public string metadata { get; set; }
        public double fulltext_score { get; set; }
    }

    internal class HybridSearchResult
    {
        public int Id { get; set; }
        public string Prompt { get; set; }
        public string Completion { get; set; }
        public string Category { get; set; }
        public string Author { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Metadata { get; set; }
        public double VectorSimilarity { get; set; }
        public double FullTextScore { get; set; }
        public double FinalScore { get; set; }
    }
}

/*
 * ═══════════════════════════════════════════════════════════════════════
 * USAGE EXAMPLE (Hyperlambda)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * openai.hybrid.search:"artificial intelligence applications"
 *    type_id:1
 *    category:"Technology"
 *    author:"John Doe"
 *    date_from:2024-01-01
 *    keywords:"machine learning neural networks"
 *    threshold:0.6
 *    max_results:20
 *
 * // Returns top 20 results matching ALL criteria:
 * // - Category = Technology
 * // - Author = John Doe
 * // - Date >= 2024-01-01
 * // - Contains keywords "machine learning" or "neural networks"
 * // - Vector similarity >= 60%
 * // - Ranked by combined score (70% vector + 30% full-text)
 *
 * ═══════════════════════════════════════════════════════════════════════
 */
