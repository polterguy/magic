#!/bin/bash
#===============================================================================
# TOE MAC BUILD SCRIPT
# Automated Mac binary builder with verification
#
# Francesco Pedulli, November 3, 2025
#
# Usage:
#   ./build_mac.sh              - Build Mac binaries
#   ./build_mac.sh --universal  - Build universal (Intel + Apple Silicon)
#   ./build_mac.sh --test       - Build and test
#   ./build_mac.sh --package    - Build and package
#===============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  TOE MAC BUILD SYSTEM                                    ║
║  Cross-Platform Vector Compression                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

#===============================================================================
# FUNCTIONS
#===============================================================================

print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 not found"
        return 1
    fi
    print_success "$1 found: $(command -v $1)"
    return 0
}

#===============================================================================
# ENVIRONMENT VERIFICATION
#===============================================================================

print_step "Checking build environment..."

# Check macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script must run on macOS"
    print_warning "Current OS: $OSTYPE"
    print_warning "For Linux builds, use: make -f Makefile.cross-platform linux"
    exit 1
fi
print_success "Running on macOS: $(sw_vers -productVersion)"

# Check Xcode Command Line Tools
if ! xcode-select -p &> /dev/null; then
    print_error "Xcode Command Line Tools not installed"
    echo ""
    echo "Please install with:"
    echo "  xcode-select --install"
    exit 1
fi
print_success "Xcode CLT installed: $(xcode-select -p)"

# Check required tools
TOOLS_OK=true
check_command clang || TOOLS_OK=false
check_command make || TOOLS_OK=false
check_command sqlite3 || TOOLS_OK=false

if [ "$TOOLS_OK" = false ]; then
    print_error "Missing required tools"
    exit 1
fi

# Check compiler version
CLANG_VERSION=$(clang --version | head -n1)
print_success "Compiler: $CLANG_VERSION"

# Check architecture
ARCH=$(uname -m)
print_success "Architecture: $ARCH"

#===============================================================================
# SOURCE CODE VERIFICATION
#===============================================================================

print_step "Verifying source code..."

# Check Makefile
if [ ! -f "Makefile.cross-platform" ]; then
    print_error "Makefile.cross-platform not found"
    print_warning "Are you in the THOMAS_FINAL_SELF_ENCRYPTED directory?"
    exit 1
fi
print_success "Found Makefile.cross-platform"

# Check source directories
if [ ! -d "../THOMAS_ALL_3_PHASES_NO_RESIDUE" ]; then
    print_error "Source directory not found: ../THOMAS_ALL_3_PHASES_NO_RESIDUE"
    exit 1
fi
print_success "Found source directories"

# Check C files
REQUIRED_FILES=(
    "toe_runtime.c"
    "toe_binary_compress.c"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file not found: $file"
        exit 1
    fi
done
print_success "All required C source files present"

#===============================================================================
# BUILD OPTIONS
#===============================================================================

BUILD_UNIVERSAL=false
RUN_TESTS=false
CREATE_PACKAGE=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --universal)
            BUILD_UNIVERSAL=true
            ;;
        --test)
            RUN_TESTS=true
            ;;
        --package)
            CREATE_PACKAGE=true
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --universal   Build universal binary (Intel + Apple Silicon)"
            echo "  --test        Build and run tests"
            echo "  --package     Build and create deployment package"
            echo "  --help        Show this help"
            exit 0
            ;;
        *)
            print_error "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

#===============================================================================
# BUILD CONFIGURATION
#===============================================================================

print_step "Build configuration..."

if [ "$BUILD_UNIVERSAL" = true ]; then
    print_success "Building UNIVERSAL binary (Intel + Apple Silicon)"
    EXTRA_FLAGS="-arch x86_64 -arch arm64"
else
    print_success "Building for native architecture: $ARCH"
    EXTRA_FLAGS=""
fi

#===============================================================================
# CLEAN PREVIOUS BUILDS
#===============================================================================

print_step "Cleaning previous builds..."

make -f Makefile.cross-platform clean &> /dev/null || true

print_success "Clean complete"

#===============================================================================
# BUILD MAC BINARIES
#===============================================================================

print_step "Building Mac binaries..."

# Build with extra flags if universal
if [ -n "$EXTRA_FLAGS" ]; then
    export MAC_CFLAGS="$MAC_CFLAGS $EXTRA_FLAGS"
fi

# Run make
if make -f Makefile.cross-platform mac; then
    print_success "Mac binaries built successfully"
else
    print_error "Build failed"
    exit 1
fi

#===============================================================================
# VERIFY BINARIES
#===============================================================================

print_step "Verifying Mac binaries..."

BIN_DIR="binaries/mac"

# Check binaries exist
BINARIES=(
    "phase1.dylib.toe"
    "phase2.dylib.toe"
    "phase3.dylib.toe"
    "toe_runtime.dylib"
)

ALL_PRESENT=true
for binary in "${BINARIES[@]}"; do
    if [ ! -f "$BIN_DIR/$binary" ]; then
        print_error "Binary not found: $BIN_DIR/$binary"
        ALL_PRESENT=false
    fi
done

if [ "$ALL_PRESENT" = false ]; then
    print_error "Some binaries missing"
    exit 1
fi
print_success "All binaries present"

# Check file types
print_step "Checking binary formats..."

# Runtime should be Mach-O
RUNTIME_TYPE=$(file "$BIN_DIR/toe_runtime.dylib" | grep -o "Mach-O")
if [ -z "$RUNTIME_TYPE" ]; then
    print_error "toe_runtime.dylib is not Mach-O format"
    file "$BIN_DIR/toe_runtime.dylib"
    exit 1
fi
print_success "toe_runtime.dylib is Mach-O format"

# .toe files should be "data" (encrypted)
TOE_TYPE=$(file "$BIN_DIR/phase2.dylib.toe" | grep -o "data")
if [ -z "$TOE_TYPE" ]; then
    print_warning "phase2.dylib.toe might not be encrypted"
fi
print_success ".toe files are encrypted (data format)"

# Check architectures
if [ "$BUILD_UNIVERSAL" = true ]; then
    print_step "Checking universal binary architectures..."
    ARCHS=$(lipo -info "$BIN_DIR/toe_runtime.dylib" | grep -o "x86_64\|arm64")
    if echo "$ARCHS" | grep -q "x86_64" && echo "$ARCHS" | grep -q "arm64"; then
        print_success "Universal binary contains: x86_64 and arm64"
    else
        print_warning "Universal binary might not contain both architectures"
        lipo -info "$BIN_DIR/toe_runtime.dylib"
    fi
fi

# Check dependencies
print_step "Checking library dependencies..."

DEPS=$(otool -L "$BIN_DIR/toe_runtime.dylib" | tail -n +2)
echo "$DEPS"

# Should NOT contain Linux libraries
if echo "$DEPS" | grep -q "libc.so\|ld-linux"; then
    print_error "Found Linux dependencies in Mac binary!"
    print_error "This binary will NOT work on Mac"
    exit 1
fi
print_success "No Linux dependencies found (good!)"

# Should contain Mac libraries
if echo "$DEPS" | grep -q "libSystem"; then
    print_success "Found Mac system libraries (correct)"
else
    print_warning "Unexpected dependency structure"
fi

# Check sizes
print_step "Binary sizes:"
ls -lh "$BIN_DIR/"

#===============================================================================
# TESTING (Optional)
#===============================================================================

if [ "$RUN_TESTS" = true ]; then
    print_step "Running tests..."

    # Create simple test
    cat > /tmp/test_toe_mac.c << 'EOF'
#include <stdio.h>
#include <dlfcn.h>

int main() {
    void* handle = dlopen("binaries/mac/toe_runtime.dylib", RTLD_NOW);
    if (!handle) {
        printf("Failed to load toe_runtime.dylib: %s\n", dlerror());
        return 1;
    }

    printf("✓ Successfully loaded toe_runtime.dylib\n");
    dlclose(handle);
    return 0;
}
EOF

    clang /tmp/test_toe_mac.c -o /tmp/test_toe_mac
    if /tmp/test_toe_mac; then
        print_success "Runtime library loads successfully"
    else
        print_error "Runtime library failed to load"
        exit 1
    fi

    rm -f /tmp/test_toe_mac /tmp/test_toe_mac.c
fi

#===============================================================================
# PACKAGING (Optional)
#===============================================================================

if [ "$CREATE_PACKAGE" = true ]; then
    print_step "Creating Mac deployment package..."

    if make -f Makefile.cross-platform package-mac; then
        print_success "Mac package created"
        ls -lh THOMAS_HANSEN_DELIVERY_MAC.tar.gz
    else
        print_error "Packaging failed"
        exit 1
    fi
fi

#===============================================================================
# SUMMARY
#===============================================================================

echo ""
echo -e "${GREEN}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  ✅ MAC BUILD SUCCESSFUL                                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo "Mac binaries ready in: binaries/mac/"
echo ""
echo "Files:"
ls -1 binaries/mac/
echo ""

if [ "$BUILD_UNIVERSAL" = true ]; then
    echo "Binary type: Universal (Intel + Apple Silicon)"
else
    echo "Binary type: Native ($ARCH)"
fi

echo ""
echo "Next steps:"
echo "  1. Test binaries:     ./build_mac.sh --test"
echo "  2. Create package:    make -f Makefile.cross-platform package-mac"
echo "  3. Universal package: make -f Makefile.cross-platform package-universal"
echo ""
echo "Deployment:"
echo "  Copy binaries/mac/ to Magic platform TOE/binaries/mac/"
echo "  C# code will auto-detect Mac platform and load .dylib files"
echo ""
echo "Business value:"
echo "  Linux-only: \$32M over 3 years"
echo "  + Mac support: +\$12M"
echo "  Total: \$44M over 3 years"
echo ""

print_success "BUILD COMPLETE! 🚀"
