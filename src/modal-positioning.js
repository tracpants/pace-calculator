// Modal Positioning Fix Module
// Ensures all modals are properly positioned at body level with correct styling

export function ensureModalPositioning() {
    console.log('🔧 Ensuring modal positioning...');
    
    // Step 1: Move any modals that are inside the app container to body level
    const appContainer = document.getElementById('app');
    const modals = document.querySelectorAll('.modal-container');
    let moved = 0;
    
    modals.forEach(modal => {
        if (appContainer && appContainer.contains(modal)) {
            console.log(`📦 Moving ${modal.id} to body level...`);
            document.body.appendChild(modal);
            moved++;
        }
    });
    
    if (moved > 0) {
        console.log(`✅ Moved ${moved} modals to body level`);
    }
    
    // Step 2: Apply critical CSS fixes for modal positioning
    applyModalCSS();
    
    // Step 3: Verify positioning
    verifyModalPositioning();
}

function applyModalCSS() {
    // Check if our fix styles already exist
    let styleElement = document.getElementById('modal-positioning-fix');
    if (styleElement) {
        return; // Already applied
    }
    
    styleElement = document.createElement('style');
    styleElement.id = 'modal-positioning-fix';
    styleElement.textContent = `
        /* Critical Modal Positioning Fixes */
        .modal-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
        }
        
        /* Ensure modals are not affected by parent container constraints */
        .modal-container {
            transform: none !important;
            margin: 0 !important;
        }
        
        /* Fix for cases where modals might inherit positioning from parent */
        body > .modal-container {
            position: fixed !important;
        }
    `;
    
    document.head.appendChild(styleElement);
    console.log('✅ Applied modal positioning CSS fixes');
}

function verifyModalPositioning() {
    const modals = document.querySelectorAll('.modal-container');
    const issues = [];
    
    modals.forEach(modal => {
        const computedStyle = window.getComputedStyle(modal);
        
        // Check if positioned correctly
        if (computedStyle.position !== 'fixed') {
            issues.push(`${modal.id}: position is ${computedStyle.position}, should be fixed`);
        }
        
        // Check if at body level
        const isAtBodyLevel = modal.parentElement === document.body;
        if (!isAtBodyLevel) {
            issues.push(`${modal.id}: not at body level (parent: ${modal.parentElement?.tagName})`);
        }
        
        // Check z-index
        const zIndex = parseInt(computedStyle.zIndex);
        if (zIndex < 9999) {
            issues.push(`${modal.id}: z-index is ${zIndex}, should be >= 9999`);
        }
    });
    
    if (issues.length > 0) {
        console.warn('⚠️  Modal positioning issues found:');
        issues.forEach(issue => console.warn(`  ${issue}`));
        return false;
    } else {
        console.log('✅ All modals positioned correctly');
        return true;
    }
}

// Function to fix modal issues on demand
export function fixModalIssues() {
    console.log('🔧 Fixing modal issues...');
    
    // Re-run positioning check and fix
    ensureModalPositioning();
    
    // Additional fixes for common issues
    const modals = document.querySelectorAll('.modal-container');
    
    modals.forEach(modal => {
        // Ensure proper CSS classes
        if (!modal.classList.contains('modal-container')) {
            modal.classList.add('modal-container');
        }
        
        // Ensure initially hidden
        if (!modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
        
        // Fix any inline styles that might interfere
        modal.style.removeProperty('position');
        modal.style.removeProperty('top');
        modal.style.removeProperty('left');
        modal.style.removeProperty('right');
        modal.style.removeProperty('bottom');
        modal.style.removeProperty('width');
        modal.style.removeProperty('height');
        modal.style.removeProperty('z-index');
    });
    
    console.log('✅ Modal fixes applied');
}

// Debug function to inspect modal state
export function debugModalState() {
    console.log('\n🔍 Modal State Debug:');
    
    const modals = document.querySelectorAll('.modal-container');
    
    modals.forEach(modal => {
        const style = window.getComputedStyle(modal);
        const parent = modal.parentElement;
        
        console.log(`\n📋 ${modal.id}:`);
        console.log(`  Parent: ${parent?.tagName}${parent?.id ? '#' + parent.id : ''}`);
        console.log(`  Classes: ${modal.className}`);
        console.log(`  Position: ${style.position}`);
        console.log(`  Display: ${style.display}`);
        console.log(`  Z-index: ${style.zIndex}`);
        console.log(`  Background: ${style.backgroundColor}`);
        console.log(`  Backdrop-filter: ${style.backdropFilter}`);
        console.log(`  Viewport: ${style.top} ${style.left} ${style.right} ${style.bottom}`);
        console.log(`  At body level: ${parent === document.body ? '✅' : '❌'}`);
    });
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    window.ensureModalPositioning = ensureModalPositioning;
    window.fixModalIssues = fixModalIssues;
    window.debugModalState = debugModalState;
}