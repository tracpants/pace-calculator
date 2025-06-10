// Test script for calculation precision improvements
import * as calc from './src/calculator.js';

console.log('=== CALCULATION PRECISION TESTS ===\n');

// Test 1: Time parsing precision
console.log('1. Time Parsing Tests:');
console.log('4.5 minutes:', calc.parseTime('4.5'), 'seconds (should be 270)');
console.log('4:30:', calc.parseTime('4:30'), 'seconds (should be 270)');
console.log('1:23:45:', calc.parseTime('1:23:45'), 'seconds (should be 5025)');
console.log();

// Test 2: Pace calculation precision
console.log('2. Pace Calculation Tests:');
const paceTest = calc.calculatePace(1800, 5, 'km'); // 30 minutes for 5K
console.log('30 min 5K pace per km:', calc.formatTime(paceTest.pacePerKm), '/km (should be 06:00/km)');
console.log('30 min 5K pace per mile:', calc.formatTime(paceTest.pacePerMile), '/mile (should be ~09:39/mile)');
console.log();

// Test 3: Time calculation precision
console.log('3. Time Calculation Tests:');
const timeTest = calc.calculateTime(360, 10, 'km', 'km'); // 6:00/km pace for 10K
console.log('6:00/km pace for 10K:', calc.formatTime(timeTest, true), '(should be 01:00:00)');
console.log();

// Test 4: Distance calculation precision
console.log('4. Distance Calculation Tests:');
const distTest = calc.calculateDistance(3600, 300, 'km'); // 1 hour at 5:00/km pace
console.log('1 hour at 5:00/km pace:');
console.log('- Kilometers:', calc.formatDistance(distTest.km), 'km (should be 12.00 km)');
console.log('- Miles:', calc.formatDistance(distTest.miles), 'miles (should be ~7.46 miles)');
console.log();

// Test 5: Conversion factor consistency
console.log('5. Conversion Factor Tests:');
const mile1 = calc.calculatePace(1800, 1, 'miles'); // 30 min mile
const mile2 = calc.calculateDistance(1800, 1800, 'miles'); // 30 min at 30:00/mile pace
console.log('30 min mile pace per mile:', calc.formatTime(mile1.pacePerMile), '/mile (should be 30:00/mile)');
console.log('Distance covered in 30 min at 30:00/mile pace:', calc.formatDistance(mile2.miles), 'miles (should be 1.00 miles)');
console.log();

// Test 6: Edge cases
console.log('6. Edge Case Tests:');
console.log('Zero distance handling:', calc.calculatePace(1800, 0, 'km'));
console.log('Very small time:', calc.formatTime(0.7), '(should handle sub-second properly)');
console.log('Large time:', calc.formatTime(7323, true), '(should be 02:02:03)');
console.log();

console.log('=== END TESTS ===');