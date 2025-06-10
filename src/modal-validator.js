// Modal Validation System
// Prevents modal positioning issues and validates modal structure

export class ModalValidator {
    constructor() {
        this.validationRules = [
            { name: 'body-level-positioning', check: this.checkBodyLevelPositioning },
            { name: 'css-positioning', check: this.checkCSSPositioning },
            { name: 'z-index-hierarchy', check: this.checkZIndexHierarchy },
            { name: 'scrim-background', check: this.checkScrimBackground },
            { name: 'modal-structure', check: this.checkModalStructure }
        ];
        
        this.warnings = [];
        this.errors = [];
    }
    
    // Validation Rules
    checkBodyLevelPositioning(modal) {
        const isAtBodyLevel = modal.parentElement === document.body;
        if (!isAtBodyLevel) {
            return {
                level: 'error',
                message: `Modal ${modal.id} is not at body level (parent: ${modal.parentElement?.tagName})`
            };
        }
        return { level: 'pass', message: `Modal ${modal.id} correctly positioned at body level` };
    }
    
    checkCSSPositioning(modal) {
        const style = window.getComputedStyle(modal);
        const issues = [];
        
        if (style.position !== 'fixed') {
            issues.push(`position is '${style.position}' (should be 'fixed')`);
        }
        
        if (style.top !== '0px') {
            issues.push(`top is '${style.top}' (should be '0px')`);
        }
        
        if (style.left !== '0px') {
            issues.push(`left is '${style.left}' (should be '0px')`);
        }
        
        if (style.right !== '0px') {
            issues.push(`right is '${style.right}' (should be '0px')`);
        }
        
        if (style.bottom !== '0px') {
            issues.push(`bottom is '${style.bottom}' (should be '0px')`);
        }
        
        if (issues.length > 0) {
            return {
                level: 'error',
                message: `Modal ${modal.id} CSS positioning issues: ${issues.join(', ')}`
            };
        }
        
        return { level: 'pass', message: `Modal ${modal.id} CSS positioning correct` };
    }
    
    checkZIndexHierarchy(modal) {
        const style = window.getComputedStyle(modal);
        const zIndex = parseInt(style.zIndex);
        
        if (zIndex < 9999) {
            return {
                level: 'warning',
                message: `Modal ${modal.id} z-index is ${zIndex} (recommended >= 9999)`
            };
        }
        
        return { level: 'pass', message: `Modal ${modal.id} z-index correct (${zIndex})` };
    }
    
    checkScrimBackground(modal) {
        const style = window.getComputedStyle(modal);
        const backgroundColor = style.backgroundColor;
        
        if (!backgroundColor.includes('rgba') || !backgroundColor.includes('0.5')) {
            return {
                level: 'warning',
                message: `Modal ${modal.id} may not have proper scrim (background: ${backgroundColor})`
            };
        }
        
        return { level: 'pass', message: `Modal ${modal.id} has proper scrim background` };
    }
    
    checkModalStructure(modal) {
        const issues = [];
        
        if (!modal.classList.contains('modal-container')) {
            issues.push('missing modal-container class');
        }
        
        const content = modal.querySelector('.modal-content');
        if (!content) {
            issues.push('missing .modal-content element');
        }
        
        const header = modal.querySelector('.modal-header');
        if (!header) {
            issues.push('missing .modal-header element');
        }
        
        const closeBtn = modal.querySelector('.modal-close');
        if (!closeBtn) {
            issues.push('missing .modal-close button');
        }
        
        if (issues.length > 0) {
            return {
                level: 'warning',
                message: `Modal ${modal.id} structure issues: ${issues.join(', ')}`
            };
        }
        
        return { level: 'pass', message: `Modal ${modal.id} structure correct` };
    }
    
    // Main validation method
    validateAllModals() {
        console.log('🔍 Running modal validation...');
        
        this.warnings = [];
        this.errors = [];
        
        const modals = document.querySelectorAll('.modal-container');
        
        if (modals.length === 0) {
            console.warn('⚠️  No modals found to validate');
            return { passed: false, errors: ['No modals found'], warnings: [] };
        }
        
        console.log(`📋 Validating ${modals.length} modals...`);
        
        modals.forEach(modal => {
            this.validationRules.forEach(rule => {
                try {
                    const result = rule.check.call(this, modal);
                    
                    switch (result.level) {
                        case 'pass':
                            console.log(`✅ ${result.message}`);
                            break;
                        case 'warning':
                            console.warn(`⚠️  ${result.message}`);
                            this.warnings.push(result.message);
                            break;
                        case 'error':
                            console.error(`❌ ${result.message}`);
                            this.errors.push(result.message);
                            break;
                    }
                } catch (error) {
                    console.error(`❌ Error running rule '${rule.name}' on ${modal.id}:`, error);
                    this.errors.push(`Rule '${rule.name}' failed for ${modal.id}: ${error.message}`);
                }
            });
        });
        
        const passed = this.errors.length === 0;
        
        console.log('\n📊 Validation Summary:');
        console.log(`  Modals checked: ${modals.length}`);
        console.log(`  Errors: ${this.errors.length}`);
        console.log(`  Warnings: ${this.warnings.length}`);
        console.log(`  Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (!passed) {
            console.log('\n❌ Errors found:');
            this.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        
        return {
            passed,
            errors: this.errors,
            warnings: this.warnings,
            modalCount: modals.length
        };
    }
    
    // Auto-fix common issues
    autoFix() {
        console.log('🔧 Running auto-fix for modal issues...');
        
        const modals = document.querySelectorAll('.modal-container');
        let fixCount = 0;
        
        modals.forEach(modal => {
            // Fix positioning: move to body level if needed
            if (modal.parentElement !== document.body) {
                console.log(`📦 Moving ${modal.id} to body level...`);
                document.body.appendChild(modal);
                fixCount++;
            }
            
            // Fix CSS classes
            if (!modal.classList.contains('modal-container')) {
                console.log(`🎨 Adding modal-container class to ${modal.id}...`);
                modal.classList.add('modal-container');
                fixCount++;
            }
            
            // Ensure initially hidden
            if (!modal.classList.contains('hidden')) {
                console.log(`👁️  Adding hidden class to ${modal.id}...`);
                modal.classList.add('hidden');
                fixCount++;
            }
        });
        
        console.log(`✅ Auto-fix complete: ${fixCount} fixes applied`);
        return fixCount;
    }
    
    // Continuous monitoring
    startMonitoring(interval = 5000) {
        console.log(`🔍 Starting modal monitoring (every ${interval}ms)...`);
        
        const monitor = () => {
            const result = this.validateAllModals();
            if (!result.passed && result.errors.length > 0) {
                console.warn('🚨 Modal validation failed during monitoring!');
                console.warn('🔧 Running auto-fix...');
                this.autoFix();
            }
        };
        
        return setInterval(monitor, interval);
    }
}

// Create singleton instance
export const modalValidator = new ModalValidator();

// Export convenience functions
export function validateModals() {
    return modalValidator.validateAllModals();
}

export function autoFixModals() {
    return modalValidator.autoFix();
}

export function startModalMonitoring(interval) {
    return modalValidator.startMonitoring(interval);
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.validateModals = validateModals;
    window.autoFixModals = autoFixModals;
    window.modalValidator = modalValidator;
}