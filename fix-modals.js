// Comprehensive Modal Fix Script
// This script will systematically diagnose and fix all modal issues

console.log('🔧 Starting comprehensive modal fix...');

// Step 1: Verify modal elements exist and are positioned correctly
function verifyModalStructure() {
    console.log('\n📋 Step 1: Verifying modal structure...');
    
    const expectedModals = [
        'help-modal',
        'settings-modal', 
        'pr-management-modal',
        'pr-modal'
    ];
    
    const issues = [];
    
    expectedModals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (!modal) {
            issues.push(`❌ Modal ${modalId} not found`);
            return;
        }
        
        console.log(`✅ Found modal: ${modalId}`);
        
        // Check if modal is at body level (not nested in app container)
        const appContainer = document.getElementById('app');
        const isInsideApp = appContainer && appContainer.contains(modal);
        
        if (isInsideApp) {
            issues.push(`⚠️  Modal ${modalId} is inside app container (should be at body level)`);
        } else {
            console.log(`✅ Modal ${modalId} correctly positioned at body level`);
        }
        
        // Check CSS classes
        if (!modal.classList.contains('modal-container')) {
            issues.push(`❌ Modal ${modalId} missing modal-container class`);
        }
        
        // Check if initially hidden
        if (!modal.classList.contains('hidden')) {
            issues.push(`⚠️  Modal ${modalId} not initially hidden`);
        }
    });
    
    return issues;
}

// Step 2: Fix modal positioning by moving them to body level if needed
function fixModalPositioning() {
    console.log('\n🔧 Step 2: Fixing modal positioning...');
    
    const modals = document.querySelectorAll('.modal-container');
    let moved = 0;
    
    modals.forEach(modal => {
        const appContainer = document.getElementById('app');
        const isInsideApp = appContainer && appContainer.contains(modal);
        
        if (isInsideApp) {
            console.log(`📦 Moving ${modal.id} to body level...`);
            document.body.appendChild(modal);
            moved++;
        }
    });
    
    console.log(`✅ Moved ${moved} modals to body level`);
}

// Step 3: Fix CSS positioning and scrim styles
function fixModalCSS() {
    console.log('\n🎨 Step 3: Fixing modal CSS...');
    
    // Add style element with correct modal CSS if not present
    let styleElement = document.getElementById('modal-fix-styles');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'modal-fix-styles';
        document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
        /* Enhanced Modal Fixes */
        .modal-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 1rem !important;
            overflow-y: auto !important;
            background-color: rgba(0, 0, 0, 0.5) !important;
            backdrop-filter: blur(4px) !important;
            transition: opacity 0.3s ease, backdrop-filter 0.3s ease !important;
        }
        
        .modal-container.hidden {
            display: none !important;
        }
        
        .modal-content {
            position: relative !important;
            z-index: 10000 !important;
            max-width: 90vw !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
        }
    `;
    
    console.log('✅ Applied enhanced modal CSS fixes');
}

// Step 4: Test modal functionality
function testModalFunctionality() {
    console.log('\n🧪 Step 4: Testing modal functionality...');
    
    const testResults = [];
    
    // Test PR Management Modal
    const prMenuBtn = document.getElementById('pr-menu-item');
    const prManagementModal = document.getElementById('pr-management-modal');
    
    if (prMenuBtn && prManagementModal) {
        console.log('🔄 Testing PR Management modal...');
        
        // Simulate click
        prMenuBtn.click();
        
        setTimeout(() => {
            const isVisible = !prManagementModal.classList.contains('hidden');
            const computedStyle = window.getComputedStyle(prManagementModal);
            
            if (isVisible && computedStyle.display !== 'none') {
                console.log('✅ PR Management modal opens correctly');
                testResults.push('PR Management: ✅');
                
                // Test scrim
                const hasScrim = computedStyle.backgroundColor.includes('rgba') && 
                                computedStyle.backgroundColor.includes('0.5');
                if (hasScrim) {
                    console.log('✅ PR Management modal scrim working');
                    testResults.push('PR Management Scrim: ✅');
                } else {
                    console.log('❌ PR Management modal scrim not working');
                    testResults.push('PR Management Scrim: ❌');
                }
                
                // Close modal
                const closeBtn = prManagementModal.querySelector('.modal-close');
                if (closeBtn) closeBtn.click();
            } else {
                console.log('❌ PR Management modal not opening');
                testResults.push('PR Management: ❌');
            }
        }, 100);
    } else {
        console.log('❌ PR Management modal elements not found');
        testResults.push('PR Management: ❌ (Elements not found)');
    }
    
    // Test other modals
    const modalTests = [
        { id: 'help-modal', buttonId: 'help-btn', name: 'Help' },
        { id: 'settings-modal', buttonId: 'settings-menu-item', name: 'Settings' }
    ];
    
    modalTests.forEach(({ id, buttonId, name }, index) => {
        setTimeout(() => {
            const modal = document.getElementById(id);
            const button = document.getElementById(buttonId);
            
            if (modal && button) {
                console.log(`🔄 Testing ${name} modal...`);
                
                button.click();
                
                setTimeout(() => {
                    const isVisible = !modal.classList.contains('hidden');
                    if (isVisible) {
                        console.log(`✅ ${name} modal opens correctly`);
                        testResults.push(`${name}: ✅`);
                        
                        // Close modal
                        const closeBtn = modal.querySelector('.modal-close');
                        if (closeBtn) closeBtn.click();
                    } else {
                        console.log(`❌ ${name} modal not opening`);
                        testResults.push(`${name}: ❌`);
                    }
                }, 100);
            } else {
                console.log(`❌ ${name} modal elements not found`);
                testResults.push(`${name}: ❌ (Elements not found)`);
            }
        }, (index + 2) * 200);
    });
    
    // Show final results
    setTimeout(() => {
        console.log('\n📊 Final Test Results:');
        testResults.forEach(result => console.log(`  ${result}`));
    }, 1000);
}

// Step 5: Create prevention measures
function createPreventionMeasures() {
    console.log('\n🛡️  Step 5: Creating prevention measures...');
    
    // Add a function to the global scope for easy debugging
    window.debugModals = function() {
        console.log('\n🔍 Modal Debug Information:');
        
        document.querySelectorAll('.modal-container').forEach(modal => {
            const style = window.getComputedStyle(modal);
            console.log(`\n📋 ${modal.id}:`);
            console.log(`  Display: ${style.display}`);
            console.log(`  Position: ${style.position}`);
            console.log(`  Z-index: ${style.zIndex}`);
            console.log(`  Background: ${style.backgroundColor}`);
            console.log(`  Backdrop-filter: ${style.backdropFilter}`);
            console.log(`  Viewport coverage: ${style.top} ${style.left} ${style.right} ${style.bottom}`);
            
            const appContainer = document.getElementById('app');
            const isInApp = appContainer && appContainer.contains(modal);
            console.log(`  Inside app container: ${isInApp ? 'YES (⚠️  ISSUE)' : 'NO (✅)'}`);
        });
    };
    
    // Add a function to quickly fix modals
    window.fixModals = function() {
        console.log('🔧 Quick fixing modals...');
        fixModalPositioning();
        fixModalCSS();
        console.log('✅ Quick fix complete');
    };
    
    console.log('✅ Added window.debugModals() and window.fixModals() functions');
    console.log('💡 Use these functions in console to debug or fix modal issues');
}

// Main execution
function runComprehensiveFix() {
    console.log('🚀 Running comprehensive modal fix...');
    
    const structureIssues = verifyModalStructure();
    
    if (structureIssues.length > 0) {
        console.log('\n⚠️  Found issues:');
        structureIssues.forEach(issue => console.log(`  ${issue}`));
    }
    
    fixModalPositioning();
    fixModalCSS();
    testModalFunctionality();
    createPreventionMeasures();
    
    console.log('\n🎉 Comprehensive modal fix complete!');
    console.log('📝 Try opening modals now to verify they work correctly');
}

// Run automatically when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runComprehensiveFix);
} else {
    runComprehensiveFix();
}

// Also make available for manual execution
window.runComprehensiveFix = runComprehensiveFix;