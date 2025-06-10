// Button Debug Script
// Add this to the browser console to diagnose button issues

console.log('=== BUTTON DEBUGGING SCRIPT ===');

// Test 1: Check if buttons exist
const calculateBtn = document.querySelector('button[type="submit"]');
const clearBtn = document.getElementById('clear-btn');
const tabs = document.querySelectorAll('[data-tab]');

console.log('Calculate button:', calculateBtn);
console.log('Clear button:', clearBtn);
console.log('Tab buttons:', tabs);

// Test 2: Check CSS styles
if (calculateBtn) {
    const styles = window.getComputedStyle(calculateBtn);
    console.log('Calculate button styles:', {
        display: styles.display,
        cursor: styles.cursor,
        pointerEvents: styles.pointerEvents,
        position: styles.position,
        zIndex: styles.zIndex,
        backgroundColor: styles.backgroundColor,
        minHeight: styles.minHeight,
        padding: styles.padding,
        border: styles.border
    });
}

// Test 3: Check event listeners
console.log('Form element:', document.getElementById('calculator-form'));
console.log('Form event listeners:', document.getElementById('calculator-form')?.onclick);

// Test 4: Try manual event attachment
if (calculateBtn) {
    calculateBtn.addEventListener('click', function(e) {
        console.log('MANUAL: Calculate button clicked!', e);
    });
}

if (clearBtn) {
    clearBtn.addEventListener('click', function(e) {
        console.log('MANUAL: Clear button clicked!', e);
    });
}

// Test 5: Check tab functionality
tabs.forEach((tab, index) => {
    console.log(`Tab ${index}:`, tab);
    tab.addEventListener('click', function(e) {
        console.log(`MANUAL: Tab ${index} clicked!`, e);
    });
});

// Test 6: Check if CSS is blocking clicks
function checkClickability(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const elementAtPoint = document.elementFromPoint(x, y);
    
    console.log(`Element at center of button:`, elementAtPoint);
    console.log(`Is same element:`, elementAtPoint === element);
    
    return elementAtPoint === element;
}

if (calculateBtn) {
    console.log('Calculate button clickable:', checkClickability(calculateBtn));
}

if (clearBtn) {
    console.log('Clear button clickable:', checkClickability(clearBtn));
}

// Test 7: Force trigger events
function testFormSubmit() {
    const form = document.getElementById('calculator-form');
    if (form) {
        console.log('Triggering form submit...');
        form.dispatchEvent(new Event('submit'));
    }
}

function testClearClick() {
    if (clearBtn) {
        console.log('Triggering clear button click...');
        clearBtn.click();
    }
}

function testTabClick() {
    if (tabs.length > 0) {
        console.log('Triggering tab click...');
        tabs[1].click(); // Click second tab
    }
}

// Export test functions to window for manual testing
window.debugButtons = {
    testFormSubmit,
    testClearClick,
    testTabClick,
    checkClickability
};

console.log('Debug functions available at window.debugButtons');
console.log('=== END BUTTON DEBUGGING ===');