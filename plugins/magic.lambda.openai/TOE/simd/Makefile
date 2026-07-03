# Makefile for TOE SIMD/OpenMP Optimized Build
# Francesco Pedulli - November 1, 2025

CC = gcc
CFLAGS = -O3 -Wall -Wextra -std=c11
LDFLAGS = -lm

# SIMD flags (AVX2 + FMA)
SIMD_FLAGS = -mavx2 -mfma -mpopcnt

# OpenMP flags
OPENMP_FLAGS = -fopenmp

# Combined optimization flags
OPT_FLAGS = $(SIMD_FLAGS) $(OPENMP_FLAGS)

# Source files
SRC_DIR = src
BENCH_DIR = benchmarks
BUILD_DIR = build

# Targets
LIBSIMD = $(BUILD_DIR)/libtoe_simd.so
BENCHMARK = $(BUILD_DIR)/benchmark_simd

.PHONY: all clean benchmark test install help

# Default target
all: $(LIBSIMD) $(BENCHMARK)

# Build shared library with full optimizations
$(LIBSIMD): $(SRC_DIR)/toe_simd_optimized.c | $(BUILD_DIR)
	@echo "Building SIMD-optimized library..."
	$(CC) $(CFLAGS) $(OPT_FLAGS) -fPIC -shared -o $@ $< $(LDFLAGS)
	@echo "✓ Built: $@"
	@echo "  - AVX2 vectorization: Enabled"
	@echo "  - OpenMP multi-threading: Enabled"
	@echo "  - Expected speedup: 10-30×"

# Build benchmark program
$(BENCHMARK): $(BENCH_DIR)/benchmark_simd.c $(SRC_DIR)/toe_simd_optimized.c | $(BUILD_DIR)
	@echo "Building benchmark..."
	$(CC) $(CFLAGS) $(OPT_FLAGS) -o $@ $^ $(LDFLAGS)
	@echo "✓ Built: $@"

# Create build directory
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# Run benchmark
benchmark: $(BENCHMARK)
	@echo ""
	@echo "Running SIMD/OpenMP benchmark..."
	@echo "================================"
	@$(BENCHMARK)

# Build without SIMD (baseline comparison)
baseline: $(SRC_DIR)/toe_simd_optimized.c | $(BUILD_DIR)
	@echo "Building baseline (no SIMD/OpenMP)..."
	$(CC) $(CFLAGS) -fPIC -shared -o $(BUILD_DIR)/libtoe_baseline.so $< $(LDFLAGS)
	@echo "✓ Built: $(BUILD_DIR)/libtoe_baseline.so"

# Compare SIMD vs baseline
compare: all baseline
	@echo ""
	@echo "╔═══════════════════════════════════════════════════════════╗"
	@echo "║  Performance Comparison: SIMD vs Baseline                ║"
	@echo "╚═══════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Run benchmark to see performance difference:"
	@echo "  make benchmark"

# Clean build artifacts
clean:
	rm -rf $(BUILD_DIR)
	@echo "✓ Cleaned build directory"

# Install to system (requires sudo)
install: $(LIBSIMD)
	@echo "Installing to /usr/local/lib..."
	sudo cp $(LIBSIMD) /usr/local/lib/
	sudo ldconfig
	@echo "✓ Installed: /usr/local/lib/libtoe_simd.so"

# Show help
help:
	@echo "TOE SIMD/OpenMP Build System"
	@echo "============================"
	@echo ""
	@echo "Targets:"
	@echo "  make all        - Build library and benchmark (default)"
	@echo "  make benchmark  - Build and run performance benchmark"
	@echo "  make baseline   - Build baseline version (no optimizations)"
	@echo "  make compare    - Build both and show comparison instructions"
	@echo "  make install    - Install library to /usr/local/lib (requires sudo)"
	@echo "  make clean      - Remove build artifacts"
	@echo "  make help       - Show this help message"
	@echo ""
	@echo "Performance Flags:"
	@echo "  AVX2:    $(SIMD_FLAGS)"
	@echo "  OpenMP:  $(OPENMP_FLAGS)"
	@echo ""
	@echo "Expected Performance:"
	@echo "  Single-thread SIMD:  6-10× faster"
	@echo "  Multi-thread OpenMP: 4-8× faster (4-8 cores)"
	@echo "  Combined:            10-30× faster"
	@echo ""
	@echo "Requirements:"
	@echo "  - CPU with AVX2 support (Intel Haswell+, AMD Excavator+)"
	@echo "  - GCC 4.9+ or Clang 3.5+"
	@echo "  - OpenMP library"
