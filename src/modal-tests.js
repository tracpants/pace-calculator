// Modal Test Framework for Pace Calculator
// Validates modal behavior and ensures consistency

export class ModalTester {
    constructor() {
        this.testResults = [];
        this.modalSelectors = [
            { id: 'help-modal', name: 'Help Modal' },
            { id: 'settings-modal', name: 'Settings Modal' },
            { id: 'pr-management-modal', name: 'PR Management Modal' },
            { id: 'pr-modal', name: 'PR Add/Edit Modal' }
        ];
    }

    async runAllTests() {
        console.log('🧪 Running Modal Tests...');
        this.testResults = [];

        for (const modal of this.modalSelectors) {
            await this.testModal(modal);
        }

        this.generateReport();
        return this.testResults;
    }

    async testModal(modalConfig) {
        const { id, name } = modalConfig;
        const element = document.getElementById(id);
        
        if (!element) {
            this.addResult(name, 'Element Exists', false, `Modal element #${id} not found`);
            return;
        }

        this.addResult(name, 'Element Exists', true, 'Modal element found');

        // Test CSS classes
        this.testCSSClasses(element, name);
        
        // Test visibility states
        await this.testVisibilityStates(element, name);
        
        // Test scrim properties
        this.testScrimProperties(element, name);
        
        // Test content properties
        this.testContentProperties(element, name);
        
        // Test positioning
        this.testPositioning(element, name);
    }

    testCSSClasses(element, modalName) {
        const hasModalContainer = element.classList.contains('modal-container');
        const hasHidden = element.classList.contains('hidden');
        
        this.addResult(modalName, 'Has modal-container class', hasModalContainer, 
            hasModalContainer ? 'Has correct base class' : 'Missing modal-container class');
            
        this.addResult(modalName, 'Initially hidden', hasHidden,
            hasHidden ? 'Modal starts hidden' : 'Modal should start with hidden class');
    }

    async testVisibilityStates(element, modalName) {
        // Test hidden state
        element.classList.add('hidden');
        await this.waitForStyleUpdate();
        
        const hiddenDisplay = window.getComputedStyle(element).display;
        this.addResult(modalName, 'Hidden display', hiddenDisplay === 'none',
            `Hidden display: ${hiddenDisplay} (should be none)`);

        // Test visible state
        element.classList.remove('hidden');
        await this.waitForStyleUpdate();
        
        const visibleDisplay = window.getComputedStyle(element).display;
        this.addResult(modalName, 'Visible display', visibleDisplay === 'flex',
            `Visible display: ${visibleDisplay} (should be flex)`);
            
        // Reset to hidden
        element.classList.add('hidden');
    }

    testScrimProperties(element, modalName) {
        const computedStyle = window.getComputedStyle(element);
        
        // Test background color (should be semi-transparent black)
        const backgroundColor = computedStyle.backgroundColor;
        const hasScrim = backgroundColor.includes('rgba') && backgroundColor.includes('0.5');
        this.addResult(modalName, 'Has scrim background', hasScrim,
            `Background: ${backgroundColor}`);
            
        // Test backdrop filter
        const backdropFilter = computedStyle.backdropFilter;
        const hasBlur = backdropFilter.includes('blur');
        this.addResult(modalName, 'Has backdrop blur', hasBlur,
            `Backdrop filter: ${backdropFilter}`);
            
        // Test z-index
        const zIndex = parseInt(computedStyle.zIndex);
        const hasHighZIndex = zIndex >= 50;
        this.addResult(modalName, 'High z-index', hasHighZIndex,
            `Z-index: ${zIndex} (should be >= 50)`);
    }

    testContentProperties(element, modalName) {
        const content = element.querySelector('.modal-content');
        
        if (!content) {
            this.addResult(modalName, 'Has modal content', false, 'No .modal-content found');
            return;
        }

        this.addResult(modalName, 'Has modal content', true, 'Modal content element found');

        // Test content visibility when modal is shown
        element.classList.remove('hidden');
        const contentStyle = window.getComputedStyle(content);
        
        const opacity = parseFloat(contentStyle.opacity);
        this.addResult(modalName, 'Content visible', opacity === 1,
            `Content opacity: ${opacity} (should be 1)`);
            
        const transform = contentStyle.transform;
        const hasCorrectTransform = !transform.includes('scale(0.95)');
        this.addResult(modalName, 'Content not scaled down', hasCorrectTransform,
            `Content transform: ${transform}`);
            
        element.classList.add('hidden'); // Reset
    }

    testPositioning(element, modalName) {
        const computedStyle = window.getComputedStyle(element);
        
        // Test position
        const position = computedStyle.position;
        this.addResult(modalName, 'Fixed position', position === 'fixed',
            `Position: ${position} (should be fixed)`);
            
        // Test full viewport coverage
        const top = computedStyle.top;
        const left = computedStyle.left;
        const right = computedStyle.right;
        const bottom = computedStyle.bottom;
        
        const coversViewport = top === '0px' && left === '0px' && right === '0px' && bottom === '0px';
        this.addResult(modalName, 'Covers full viewport', coversViewport,
            `Positioning: top:${top}, left:${left}, right:${right}, bottom:${bottom}`);
    }

    addResult(modalName, testName, passed, details) {
        this.testResults.push({
            modal: modalName,
            test: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
    }

    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;

        console.log('\n📊 Modal Test Report');
        console.log('===================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

        // Group by modal
        const modalGroups = this.groupBy(this.testResults, 'modal');
        
        Object.entries(modalGroups).forEach(([modalName, tests]) => {
            const modalPassed = tests.filter(t => t.passed).length;
            const modalTotal = tests.length;
            const status = modalPassed === modalTotal ? '✅' : '❌';
            
            console.log(`${status} ${modalName} (${modalPassed}/${modalTotal})`);
            
            tests.forEach(test => {
                const icon = test.passed ? '  ✓' : '  ✗';
                console.log(`${icon} ${test.test}: ${test.details}`);
            });
            console.log('');
        });

        return {
            summary: { totalTests, passedTests, failedTests, successRate: (passedTests / totalTests) * 100 },
            results: this.testResults
        };
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    async waitForStyleUpdate() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                setTimeout(resolve, 10);
            });
        });
    }

    // Diagnostic method to fix common modal issues
    diagnoseAndFix() {
        console.log('🔧 Running Modal Diagnostics...');
        
        const modals = document.querySelectorAll('.modal-container');
        let fixesApplied = 0;

        modals.forEach(modal => {
            const computedStyle = window.getComputedStyle(modal);
            const issues = [];

            // Check for common issues
            if (computedStyle.position !== 'fixed') {
                issues.push('position not fixed');
                modal.style.position = 'fixed';
            }

            if (!computedStyle.backgroundColor.includes('rgba')) {
                issues.push('missing scrim background');
                modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }

            if (!computedStyle.backdropFilter.includes('blur')) {
                issues.push('missing backdrop blur');
                modal.style.backdropFilter = 'blur(4px)';
            }

            if (computedStyle.zIndex < 50) {
                issues.push('low z-index');
                modal.style.zIndex = '9999';
            }

            if (issues.length > 0) {
                console.log(`🔧 Fixed ${modal.id || 'unnamed modal'}: ${issues.join(', ')}`);
                fixesApplied++;
            }
        });

        console.log(`✅ Applied ${fixesApplied} fixes`);
        return fixesApplied;
    }
}

// Export for use in main app
export function createModalTester() {
    return new ModalTester();
}

// Export for browser console debugging
if (typeof window !== 'undefined') {
    window.ModalTester = ModalTester;
    window.createModalTester = createModalTester;
}