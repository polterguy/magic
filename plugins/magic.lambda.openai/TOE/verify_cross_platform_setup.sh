#!/bin/bash
#===============================================================================
# CROSS-PLATFORM SETUP VERIFICATION SCRIPT
# Verifies that Mac support has been properly added
#
# Francesco Pedulli, November 3, 2025
#===============================================================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  CROSS-PLATFORM SETUP VERIFICATION                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

ERRORS=0
WARNINGS=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Directory: $1"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Directory not yet created: $1"
        ((WARNINGS++))
        return 1
    fi
}

echo ""
echo "Checking cross-platform files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check new files
check_file "Makefile.cross-platform"
check_file "TOERuntimeLoader_CrossPlatform.cs"
check_file "BUILD_MAC_GUIDE.md"
check_file "build_mac.sh"
check_file "README_CROSS_PLATFORM.md"

echo ""
echo "Checking directory structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check directories
check_dir "binaries"
check_dir "binaries/linux"
check_dir "binaries/mac"

echo ""
echo "Checking Linux binaries (should exist)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "binaries/linux" ]; then
    if [ "$(ls -A binaries/linux/ 2>/dev/null)" ]; then
        echo -e "${GREEN}✓${NC} Linux binaries exist:"
        ls -1 binaries/linux/ | sed 's/^/  /'
    else
        echo -e "${YELLOW}⚠${NC} Linux binaries directory empty"
        echo "  Run: make -f Makefile.cross-platform linux"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} Linux binaries directory missing"
    ((ERRORS++))
fi

echo ""
echo "Checking Mac binaries (will be built on Mac)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "binaries/mac" ]; then
    if [ "$(ls -A binaries/mac/ 2>/dev/null)" ]; then
        echo -e "${GREEN}✓${NC} Mac binaries exist:"
        ls -1 binaries/mac/ | sed 's/^/  /'
    else
        echo -e "${BLUE}ℹ${NC} Mac binaries not yet built (expected)"
        echo "  To build: ./build_mac.sh (requires Mac machine)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Mac binaries directory not created yet"
    echo "  Will be created by: make -f Makefile.cross-platform mac"
    ((WARNINGS++))
fi

echo ""
echo "Checking build script permissions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -x "build_mac.sh" ]; then
    echo -e "${GREEN}✓${NC} build_mac.sh is executable"
else
    echo -e "${YELLOW}⚠${NC} build_mac.sh not executable"
    echo "  Run: chmod +x build_mac.sh"
    ((WARNINGS++))
fi

echo ""
echo "Checking Makefile syntax..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if make -f Makefile.cross-platform help &>/dev/null; then
    echo -e "${GREEN}✓${NC} Makefile.cross-platform syntax valid"
    echo "  Available targets:"
    make -f Makefile.cross-platform help 2>/dev/null | grep "make" | head -5 | sed 's/^/  /'
else
    echo -e "${RED}✗${NC} Makefile.cross-platform has syntax errors"
    ((ERRORS++))
fi

echo ""
echo "Checking source code structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "toe_runtime.c"
check_file "toe_binary_compress.c"

if [ -d "../THOMAS_ALL_3_PHASES_NO_RESIDUE" ]; then
    echo -e "${GREEN}✓${NC} Source directory: ../THOMAS_ALL_3_PHASES_NO_RESIDUE"
else
    echo -e "${RED}✗${NC} Missing: ../THOMAS_ALL_3_PHASES_NO_RESIDUE"
    echo "  This is required for building!"
    ((ERRORS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ PERFECT!${NC} All cross-platform files present and correct."
    echo ""
    echo "Next steps:"
    echo "  • Linux: make -f Makefile.cross-platform linux"
    echo "  • Mac:   ./build_mac.sh (on Mac machine)"
    echo "  • Both:  make -f Makefile.cross-platform package-universal"
    EXIT_CODE=0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ WARNINGS: $WARNINGS${NC}"
    echo "Setup is functional but some optional items missing."
    echo "Linux deployment: Ready ✅"
    echo "Mac deployment: Ready when Mac binaries built ⏳"
    EXIT_CODE=0
else
    echo -e "${RED}✗ ERRORS: $ERRORS${NC}"
    echo -e "${YELLOW}⚠ WARNINGS: $WARNINGS${NC}"
    echo ""
    echo "Some required files are missing!"
    echo "Please check the errors above."
    EXIT_CODE=1
fi

echo ""
exit $EXIT_CODE
