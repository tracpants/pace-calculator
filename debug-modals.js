// Modal Debug Script
// Run this in the browser console to debug modal issues

function debugModals() {
    console.log('🔍 Modal Debug Report\n==================');
    
    const modals = [
        { id: 'help-modal', name: 'Help Modal' },
        { id: 'settings-modal', name: 'Settings Modal' },
        { id: 'pr-management-modal', name: 'PR Management Modal' },
        { id: 'pr-modal', name: 'PR Add/Edit Modal' }
    ];
    
    modals.forEach(modal => {
        const element = document.getElementById(modal.id);
        if (!element) {
            console.error(`❌ ${modal.name}: Element not found`);
            return;
        }
        
        const computedStyle = window.getComputedStyle(element);
        const isHidden = element.classList.contains('hidden');
        
        console.log(`\n📋 ${modal.name} (${modal.id}):`);
        console.log(`   Classes: ${element.className}`);
        console.log(`   Display: ${computedStyle.display}`);
        console.log(`   Position: ${computedStyle.position}`);
        console.log(`   Z-Index: ${computedStyle.zIndex}`);
        console.log(`   Background: ${computedStyle.backgroundColor}`);
        console.log(`   Backdrop Filter: ${computedStyle.backdropFilter}`);
        console.log(`   Visibility: ${isHidden ? 'Hidden' : 'Visible'}`);
        
        // Check if modal is properly positioned
        const rect = element.getBoundingClientRect();
        console.log(`   Dimensions: ${rect.width}x${rect.height}`);
        console.log(`   Position: (${rect.left}, ${rect.top})`);
        
        // Test modal content
        const content = element.querySelector('.modal-content');
        if (content) {
            const contentStyle = window.getComputedStyle(content);
            console.log(`   Content Opacity: ${contentStyle.opacity}`);
            console.log(`   Content Transform: ${contentStyle.transform}`);
        } else {
            console.warn(`   ⚠️  No .modal-content found`);
        }
    });
    
    console.log('\n🎯 Quick Tests:');
    console.log('   Run testModal("help-modal") to test help modal');
    console.log('   Run testModal("settings-modal") to test settings modal');
    console.log('   Run testAllModals() to test all modals');
}

function testModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`❌ Modal ${modalId} not found`);
        return;
    }
    
    console.log(`🧪 Testing ${modalId}...`);
    
    // Test showing
    modal.classList.remove('hidden');
    const visibleStyle = window.getComputedStyle(modal);
    console.log(`   When visible: display=${visibleStyle.display}, background=${visibleStyle.backgroundColor}`);
    
    // Test hiding
    modal.classList.add('hidden');
    const hiddenStyle = window.getComputedStyle(modal);
    console.log(`   When hidden: display=${hiddenStyle.display}`);
    
    console.log(`✅ Test complete for ${modalId}`);
}

function testAllModals() {
    const modalIds = ['help-modal', 'settings-modal', 'pr-management-modal', 'pr-modal'];
    modalIds.forEach(id => {
        if (document.getElementById(id)) {
            testModal(id);
        }
    });
}

function fixModalScrim() {
    console.log('🔧 Attempting to fix modal scrim...');
    
    const modals = document.querySelectorAll('.modal-container');
    modals.forEach((modal, index) => {
        const currentStyle = window.getComputedStyle(modal);
        console.log(`Modal ${index + 1}: ${modal.id || 'unnamed'}`);
        console.log(`  Current background: ${currentStyle.backgroundColor}`);
        
        // Force the scrim styles
        modal.style.cssText += `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-color: rgba(0, 0, 0, 0.5) !important;
            backdrop-filter: blur(4px) !important;
            z-index: 9999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        `;
        
        console.log(`  ✅ Applied fix to ${modal.id || 'unnamed'}`);
    });
    
    console.log('🎉 Modal scrim fix applied. Try opening a modal now.');
}

// Auto-run debug on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', debugModals);
} else {
    debugModals();
}

// Make functions available globally
window.debugModals = debugModals;
window.testModal = testModal;
window.testAllModals = testAllModals;
window.fixModalScrim = fixModalScrim;

console.log('🚀 Modal debug tools loaded! Run debugModals() to start debugging.');