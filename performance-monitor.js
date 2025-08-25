// Performance monitoring script for scholarships API
// Run this after deploying the optimizations to measure improvement

const API_BASE_URL = 'https://grantscraper-backend.onrender.com/api/v1/scholarships';

async function testPerformance() {
  console.log('🚀 Testing Scholarships API Performance...\n');
  
  const testCases = [
    { name: 'Basic query (page 1, limit 20)', url: `${API_BASE_URL}?page=1&limit=20` },
    { name: 'Sorted by deadline', url: `${API_BASE_URL}?sort=deadline&page=1&limit=20` },
    { name: 'Sorted by name', url: `${API_BASE_URL}?sort=name&page=1&limit=20` },
    { name: 'Filtered by type', url: `${API_BASE_URL}?filters[type]=Merit&page=1&limit=20` },
    { name: 'Filtered by level', url: `${API_BASE_URL}?filters[level]=College&page=1&limit=20` },
    { name: 'Search endpoint', url: `${API_BASE_URL}/search?keyword=scholarship` }
  ];

  for (const testCase of testCases) {
    try {
      const startTime = Date.now();
      const response = await fetch(testCase.url);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${testCase.name}: ${responseTime}ms (${data.meta?.total_items || 'N/A'} items)`);
      } else {
        console.log(`❌ ${testCase.name}: ${responseTime}ms (HTTP ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: Error - ${error.message}`);
    }
  }
  
  console.log('\n📊 Performance Summary:');
  console.log('- Response times under 500ms are excellent');
  console.log('- Response times under 1000ms are good');
  console.log('- Response times over 2000ms need investigation');
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  testPerformance();
}

export default testPerformance; 