#!/bin/bash

# AgentPayKit Comprehensive Test Suite
# Runs all tests: contracts, unit, integration, e2e, and performance

set -e

echo "🧪 AgentPayKit Comprehensive Test Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
START_TIME=$(date +%s)

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $message${NC}"
        ((TESTS_PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $message${NC}"
        ((TESTS_FAILED++))
    elif [ "$status" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  $message${NC}"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    fi
}

# Function to run test with error handling
run_test() {
    local test_name=$1
    local test_command=$2
    
    print_status "INFO" "Running $test_name..."
    
    if eval "$test_command"; then
        print_status "PASS" "$test_name completed successfully"
        return 0
    else
        print_status "FAIL" "$test_name failed"
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_status "FAIL" "Node.js is required but not installed"
        exit 1
    fi
    
    # Check Foundry
    if ! command -v forge &> /dev/null; then
        print_status "FAIL" "Foundry is required but not installed"
        exit 1
    fi
    
    # Check if Anvil is available
    if ! command -v anvil &> /dev/null; then
        print_status "FAIL" "Anvil (Foundry) is required but not installed"
        exit 1
    fi
    
    print_status "PASS" "All prerequisites are available"
}

# Install dependencies
install_dependencies() {
    print_status "INFO" "Installing dependencies..."
    
    if npm install; then
        print_status "PASS" "Dependencies installed successfully"
    else
        print_status "FAIL" "Failed to install dependencies"
        exit 1
    fi
}

# Start services
start_services() {
    print_status "INFO" "Starting test services..."
    
    # Start Anvil in background
    anvil --fork-url https://mainnet.base.org --port 8545 &
    ANVIL_PID=$!
    
    # Wait for Anvil to start
    sleep 5
    
    # Start gateway in background
    (cd gateway && npm run dev) &
    GATEWAY_PID=$!
    
    # Wait for gateway to start
    sleep 10
    
    print_status "PASS" "Test services started (Anvil PID: $ANVIL_PID, Gateway PID: $GATEWAY_PID)"
}

# Stop services
stop_services() {
    print_status "INFO" "Stopping test services..."
    
    if [ ! -z "$ANVIL_PID" ]; then
        kill $ANVIL_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$GATEWAY_PID" ]; then
        kill $GATEWAY_PID 2>/dev/null || true
    fi
    
    print_status "PASS" "Test services stopped"
}

# Cleanup function
cleanup() {
    stop_services
    exit 0
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Parse command line arguments
SKIP_SETUP=false
SKIP_CONTRACTS=false
SKIP_UNIT=false
SKIP_INTEGRATION=false
SKIP_E2E=false
SKIP_PERFORMANCE=false
ONLY_CONTRACTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-setup)
            SKIP_SETUP=true
            shift
            ;;
        --skip-contracts)
            SKIP_CONTRACTS=true
            shift
            ;;
        --skip-unit)
            SKIP_UNIT=true
            shift
            ;;
        --skip-integration)
            SKIP_INTEGRATION=true
            shift
            ;;
        --skip-e2e)
            SKIP_E2E=true
            shift
            ;;
        --skip-performance)
            SKIP_PERFORMANCE=true
            shift
            ;;
        --only-contracts)
            ONLY_CONTRACTS=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-setup        Skip dependency installation and service startup"
            echo "  --skip-contracts    Skip smart contract tests"
            echo "  --skip-unit         Skip unit tests"
            echo "  --skip-integration  Skip integration tests"
            echo "  --skip-e2e          Skip end-to-end tests"
            echo "  --skip-performance  Skip performance tests"
            echo "  --only-contracts    Run only smart contract tests"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Main test execution
main() {
    echo ""
    echo "🚀 Starting AgentPayKit Test Suite..."
    echo "Time: $(date)"
    echo ""
    
    # Prerequisites and setup
    if [ "$SKIP_SETUP" = false ]; then
        check_prerequisites
        install_dependencies
        start_services
    fi
    
    # 1. Smart Contract Tests
    if [ "$SKIP_CONTRACTS" = false ]; then
        echo ""
        echo "📄 Smart Contract Tests"
        echo "========================"
        
        run_test "Contract Compilation" "cd contracts && forge build"
        run_test "Contract Unit Tests" "cd contracts && forge test"
        run_test "Contract Comprehensive Tests" "cd contracts && forge test --match-path '*comprehensive*'"
        run_test "Contract Gas Report" "cd contracts && forge test --gas-report"
    fi
    
    # If only contracts, exit here
    if [ "$ONLY_CONTRACTS" = true ]; then
        print_summary
        return
    fi
    
    # 2. Unit Tests
    if [ "$SKIP_UNIT" = false ]; then
        echo ""
        echo "🔧 Unit Tests"
        echo "============="
        
        run_test "SDK Unit Tests" "npm run test:sdk"
        run_test "Gateway Unit Tests" "npm run test:gateway"
        run_test "CLI Unit Tests" "npm run test:cli"
    fi
    
    # 3. Integration Tests
    if [ "$SKIP_INTEGRATION" = false ]; then
        echo ""
        echo "🔗 Integration Tests"
        echo "==================="
        
        run_test "Contract-SDK Integration" "npm run test:integration:contracts"
        run_test "SDK-Gateway Integration" "npm run test:integration:sdk"
        run_test "Full Stack Integration" "npm run test:integration:gateway"
    fi
    
    # 4. End-to-End Tests
    if [ "$SKIP_E2E" = false ]; then
        echo ""
        echo "🌐 End-to-End Tests"
        echo "=================="
        
        run_test "User Workflow Tests" "npm run test:e2e:workflows"
        run_test "Multichain E2E Tests" "npm run test:e2e:multichain"
    fi
    
    # 5. Performance Tests
    if [ "$SKIP_PERFORMANCE" = false ]; then
        echo ""
        echo "⚡ Performance Tests"
        echo "==================="
        
        run_test "Load Testing" "npm run test:performance"
    fi
    
    # Generate final report
    print_summary
}

# Print test summary
print_summary() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    echo ""
    echo "📊 Test Suite Summary"
    echo "====================="
    echo "Duration: ${minutes}m ${seconds}s"
    echo "Tests Passed: $TESTS_PASSED"
    echo "Tests Failed: $TESTS_FAILED"
    echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_status "PASS" "All tests passed! 🎉"
        exit 0
    else
        print_status "FAIL" "Some tests failed 😞"
        exit 1
    fi
}

# Run main function
main 