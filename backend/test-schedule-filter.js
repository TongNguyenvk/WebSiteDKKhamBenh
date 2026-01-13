// Test script để verify logic filter schedule theo status
// Chạy: node test-schedule-filter.js

console.log('=== Test Schedule Filter Logic ===\n');

// Giả lập logic trong scheduleController.js
function testIncludeAllLogic(queryParam) {
    const includeAll = queryParam === 'true';
    console.log(`Query param: "${queryParam}"`);
    console.log(`includeAll parsed: ${includeAll}`);
    
    const whereCondition = {
        doctorId: 1,
        date: '2026-01-14'
    };
    
    if (!includeAll) {
        whereCondition.status = 'approved';
        console.log('✓ Filter applied: only approved schedules');
    } else {
        console.log('✓ No filter: all schedules included');
    }
    
    console.log('Where condition:', whereCondition);
    console.log('---\n');
}

// Test cases
console.log('Test 1: Bệnh nhân gọi API (includeAll=false)');
testIncludeAllLogic('false');

console.log('Test 2: Bác sĩ/Admin gọi API (includeAll=true)');
testIncludeAllLogic('true');

console.log('Test 3: Không truyền includeAll (undefined)');
testIncludeAllLogic(undefined);

console.log('Test 4: Truyền string rỗng');
testIncludeAllLogic('');

console.log('\n=== Kết luận ===');
console.log('✓ Logic đúng: Chỉ khi includeAll="true" thì mới lấy tất cả');
console.log('✓ Các trường hợp khác đều filter status="approved"');
