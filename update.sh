#!/bin/bash

# update.sh - Repository update and build script for Pace Calculator
# Usage: ./update.sh [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    echo "Pace Calculator - Update & Build Script"
    echo ""
    echo "Usage: ./update.sh [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -p, --pull     Pull latest changes from remote"
    echo "  -i, --install  Install/update dependencies"
    echo "  -b, --build    Build the project"
    echo "  -d, --dev      Start development server"
    echo "  -t, --test     Run build test"
    echo "  -c, --clean    Clean node_modules and reinstall"
    echo "  -a, --all      Pull, install, build, and test (default)"
    echo ""
    echo "Examples:"
    echo "  ./update.sh                    # Full update (pull, install, build, test)"
    echo "  ./update.sh --pull --build    # Pull changes and build"
    echo "  ./update.sh --dev             # Start development server"
    echo "  ./update.sh --clean           # Clean install dependencies"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository!"
        exit 1
    fi
}

# Function to pull latest changes
pull_changes() {
    print_status "Pulling latest changes from remote..."
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes. Stashing them..."
        git stash push -m "Auto-stash before update $(date)"
        STASHED=true
    fi
    
    # Pull changes
    git pull origin master
    
    # Pop stash if we stashed changes
    if [ "$STASHED" = true ]; then
        print_status "Attempting to restore your changes..."
        if git stash pop; then
            print_success "Your changes have been restored"
        else
            print_warning "Conflict while restoring changes. Check 'git stash list'"
        fi
    fi
    
    print_success "Repository updated"
}

# Function to install dependencies
install_deps() {
    print_status "Installing/updating dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found!"
        exit 1
    fi
    
    npm install
    print_success "Dependencies installed"
}

# Function to clean install
clean_install() {
    print_status "Cleaning node_modules and package-lock.json..."
    
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        print_status "Removed node_modules"
    fi
    
    if [ -f "package-lock.json" ]; then
        rm package-lock.json
        print_status "Removed package-lock.json"
    fi
    
    npm install
    print_success "Clean installation completed"
}

# Function to build the project
build_project() {
    print_status "Building the project..."
    
    npm run build
    print_success "Build completed successfully"
    
    # Show build output info
    if [ -d "dist" ]; then
        print_status "Build output in dist/ directory:"
        ls -la dist/
    fi
}

# Function to test build
test_build() {
    print_status "Testing build..."
    
    if [ ! -d "dist" ]; then
        print_error "No dist directory found. Run build first."
        exit 1
    fi
    
    # Check if key files exist
    if [ -f "dist/index.html" ]; then
        print_success "Build test passed - index.html exists"
    else
        print_error "Build test failed - index.html missing"
        exit 1
    fi
    
    # Check for assets
    if ls dist/assets/*.js 1> /dev/null 2>&1; then
        print_success "JavaScript assets found"
    else
        print_warning "No JavaScript assets found"
    fi
    
    if ls dist/assets/*.css 1> /dev/null 2>&1; then
        print_success "CSS assets found"
    else
        print_warning "No CSS assets found"
    fi
}

# Function to start development server
start_dev() {
    print_status "Starting development server..."
    print_status "Press Ctrl+C to stop the server"
    npm run dev
}

# Function to show project status
show_status() {
    print_status "Repository Status:"
    echo ""
    
    # Git status
    print_status "Git Status:"
    git status --short
    echo ""
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        print_success "Dependencies installed"
    else
        print_warning "Dependencies not installed (run --install)"
    fi
    
    # Check if dist exists
    if [ -d "dist" ]; then
        print_success "Project built (dist/ exists)"
    else
        print_warning "Project not built (run --build)"
    fi
    
    echo ""
}

# Main script logic
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "index.html" ]; then
        print_error "Please run this script from the pace-calculator root directory"
        exit 1
    fi
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        # Default: full update
        DO_PULL=true
        DO_INSTALL=true
        DO_BUILD=true
        DO_TEST=true
    else
        DO_PULL=false
        DO_INSTALL=false
        DO_BUILD=false
        DO_TEST=false
        DO_DEV=false
        DO_CLEAN=false
        
        while [[ $# -gt 0 ]]; do
            case $1 in
                -h|--help)
                    show_help
                    exit 0
                    ;;
                -p|--pull)
                    DO_PULL=true
                    ;;
                -i|--install)
                    DO_INSTALL=true
                    ;;
                -b|--build)
                    DO_BUILD=true
                    ;;
                -d|--dev)
                    DO_DEV=true
                    ;;
                -t|--test)
                    DO_TEST=true
                    ;;
                -c|--clean)
                    DO_CLEAN=true
                    ;;
                -a|--all)
                    DO_PULL=true
                    DO_INSTALL=true
                    DO_BUILD=true
                    DO_TEST=true
                    ;;
                --status)
                    show_status
                    exit 0
                    ;;
                *)
                    print_error "Unknown option: $1"
                    show_help
                    exit 1
                    ;;
            esac
            shift
        done
    fi
    
    print_status "Pace Calculator Update Script"
    echo ""
    
    # Execute requested actions
    if [ "$DO_PULL" = true ]; then
        check_git_repo
        pull_changes
        echo ""
    fi
    
    if [ "$DO_CLEAN" = true ]; then
        clean_install
        echo ""
    elif [ "$DO_INSTALL" = true ]; then
        install_deps
        echo ""
    fi
    
    if [ "$DO_BUILD" = true ]; then
        build_project
        echo ""
    fi
    
    if [ "$DO_TEST" = true ]; then
        test_build
        echo ""
    fi
    
    if [ "$DO_DEV" = true ]; then
        start_dev
        exit 0
    fi
    
    print_success "All tasks completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "  - Run './update.sh --dev' to start development server"
    echo "  - Run './update.sh --status' to check project status"
    echo "  - Built files are in the dist/ directory"
}

# Run main function
main "$@"