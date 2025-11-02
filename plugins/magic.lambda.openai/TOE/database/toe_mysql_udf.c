/**
 * toe_mysql_udf.c - MySQL User-Defined Functions for TOE Compression
 *
 * Database-native TOE compression functions:
 * - toe_compress_phase2(BLOB vector) → BINARY(4)
 * - toe_compress_phase3(BLOB vector) → TINYINT
 * - toe_distance_phase2(BINARY(4) a, BINARY(4) b) → DOUBLE
 *
 * Universal integration: Works with ANY language (C#, Python, Java, PHP, etc.)
 *
 * Francesco Pedulli - November 1, 2025
 */

#include <mysql.h>
#include <stdint.h>
#include <string.h>
#include <math.h>

// Import TOE compression functions
extern uint32_t toe_compress_phase2_simd(const float* vector, uint32_t dim);
extern uint8_t toe_compress_phase3_simd(const float* vector, uint32_t dim);

// ═══════════════════════════════════════════════════════════════════════
// UDF 1: toe_compress_phase2
// Compresses 768-d vector to 4 bytes
// ═══════════════════════════════════════════════════════════════════════

my_bool toe_compress_phase2_init(UDF_INIT *initid, UDF_ARGS *args, char *message)
{
    if (args->arg_count != 1) {
        strcpy(message, "toe_compress_phase2() requires exactly 1 argument (vector BLOB)");
        return 1;
    }

    if (args->arg_type[0] != STRING_RESULT) {
        strcpy(message, "toe_compress_phase2() argument must be BLOB");
        return 1;
    }

    initid->max_length = 4;  // Returns 4 bytes
    initid->maybe_null = 0;
    return 0;
}

char* toe_compress_phase2(UDF_INIT *initid, UDF_ARGS *args,
                           char *result, unsigned long *length,
                           char *is_null, char *error)
{
    // Get input vector (as binary blob)
    const char* vector_blob = args->args[0];
    unsigned long vector_len = args->lengths[0];

    // Expect 768 floats = 3,072 bytes
    if (vector_len != 3072) {
        *error = 1;
        return NULL;
    }

    const float* vector = (const float*)vector_blob;
    uint32_t dim = 768;

    // Compress to 4 bytes
    uint32_t quotient = toe_compress_phase2_simd(vector, dim);

    // Return as 4-byte binary
    memcpy(result, &quotient, 4);
    *length = 4;

    return result;
}

void toe_compress_phase2_deinit(UDF_INIT *initid) {}

// ═══════════════════════════════════════════════════════════════════════
// UDF 2: toe_distance_phase2
// Computes distance between two 4-byte compressed vectors
// ═══════════════════════════════════════════════════════════════════════

my_bool toe_distance_phase2_init(UDF_INIT *initid, UDF_ARGS *args, char *message)
{
    if (args->arg_count != 2) {
        strcpy(message, "toe_distance_phase2() requires 2 arguments");
        return 1;
    }

    initid->maybe_null = 0;
    initid->decimals = 6;
    return 0;
}

double toe_distance_phase2(UDF_INIT *initid, UDF_ARGS *args,
                            char *is_null, char *error)
{
    const char* a_blob = args->args[0];
    const char* b_blob = args->args[1];

    if (!a_blob || !b_blob || args->lengths[0] != 4 || args->lengths[1] != 4) {
        *error = 1;
        return 0.0;
    }

    uint32_t a = *(uint32_t*)a_blob;
    uint32_t b = *(uint32_t*)b_blob;

    // Hamming distance
    uint32_t xor_val = a ^ b;
    uint32_t hamming = __builtin_popcount(xor_val);

    // Normalize to [0, 1]
    return (double)hamming / 32.0;
}

void toe_distance_phase2_deinit(UDF_INIT *initid) {}

// ═══════════════════════════════════════════════════════════════════════
// UDF 3: toe_compress_phase3
// Compresses vector to 1 byte (ultra-quotient)
// ═══════════════════════════════════════════════════════════════════════

my_bool toe_compress_phase3_init(UDF_INIT *initid, UDF_ARGS *args, char *message)
{
    if (args->arg_count != 1) {
        strcpy(message, "toe_compress_phase3() requires 1 argument");
        return 1;
    }

    initid->max_length = 1;
    initid->maybe_null = 0;
    return 0;
}

long long toe_compress_phase3(UDF_INIT *initid, UDF_ARGS *args,
                               char *is_null, char *error)
{
    const char* vector_blob = args->args[0];
    unsigned long vector_len = args->lengths[0];

    if (vector_len != 3072) {
        *error = 1;
        return 0;
    }

    const float* vector = (const float*)vector_blob;
    uint8_t ultra = toe_compress_phase3_simd(vector, 768);

    return (long long)ultra;
}

void toe_compress_phase3_deinit(UDF_INIT *initid) {}

/*
 * ═══════════════════════════════════════════════════════════════════════
 * COMPILATION & INSTALLATION
 * ═══════════════════════════════════════════════════════════════════════
 *
 * # Build UDF library
 * gcc -shared -fPIC -o toe_mysql_udf.so toe_mysql_udf.c \
 *     toe_simd_optimized.c \
 *     -I/usr/include/mysql -lm -mavx2 -mfma
 *
 * # Install to MySQL plugin directory
 * sudo cp toe_mysql_udf.so /usr/lib/mysql/plugin/
 *
 * # Load functions in MySQL
 * mysql> CREATE FUNCTION toe_compress_phase2 RETURNS STRING
 *        SONAME 'toe_mysql_udf.so';
 *
 * mysql> CREATE FUNCTION toe_distance_phase2 RETURNS REAL
 *        SONAME 'toe_mysql_udf.so';
 *
 * mysql> CREATE FUNCTION toe_compress_phase3 RETURNS INTEGER
 *        SONAME 'toe_mysql_udf.so';
 *
 * ═══════════════════════════════════════════════════════════════════════
 * USAGE EXAMPLES
 * ═══════════════════════════════════════════════════════════════════════
 *
 * -- Compress embedding and store
 * INSERT INTO embeddings (text, embedding_compressed)
 * VALUES ('hello world', toe_compress_phase2(@openai_embedding));
 *
 * -- Search by similarity
 * SELECT text, toe_distance_phase2(embedding_compressed, @query_compressed) AS dist
 * FROM embeddings
 * ORDER BY dist ASC
 * LIMIT 10;
 *
 * -- Use from ANY language (Python example)
 * cursor.execute("""
 *     SELECT text, toe_distance_phase2(embedding_compressed, %s) AS dist
 *     FROM embeddings
 *     ORDER BY dist ASC
 *     LIMIT 10
 * """, (query_compressed,))
 *
 * ═══════════════════════════════════════════════════════════════════════
 */
