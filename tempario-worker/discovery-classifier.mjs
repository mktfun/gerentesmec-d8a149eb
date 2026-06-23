import fs from 'fs';
import path from 'path';

function analyzeTraffic(filename) {
  console.log(`Analyzing ${filename}...`);
  const rawData = fs.readFileSync(filename, 'utf-8');
  const traffic = JSON.parse(rawData);

  console.log(`Total Requests Captured: ${traffic.length}`);

  const apiCalls = traffic.filter(call => {
    try {
      const url = new URL(call.url);
      
      // Exclude noise
      if (!url.hostname.includes('tempar.io')) return false;
      if (call.resourceType === 'image' || call.resourceType === 'stylesheet' || call.resourceType === 'font' || call.resourceType === 'script') return false;
      
      // Focus on potential API/GraphQL/JSON endpoints
      if (url.pathname.startsWith('/api') || url.pathname.includes('graphql') || call.resourceType === 'fetch' || call.resourceType === 'xhr') {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  });

  console.log(`Potential API Calls: ${apiCalls.length}`);

  const endpointSummary = {};

  apiCalls.forEach(call => {
    try {
      const url = new URL(call.url);
      const method = call.method;
      const key = `${method} ${url.origin}${url.pathname}`;
      
      if (!endpointSummary[key]) {
        endpointSummary[key] = {
          count: 0,
          methods: new Set(),
          statusCodes: new Set(),
          exampleQuery: url.search,
          examplePayload: call.request.postData || null,
          hasAuthHeader: call.request.headers['authorization'] ? true : false,
          resourceType: call.resourceType
        };
      }

      endpointSummary[key].count++;
      endpointSummary[key].methods.add(method);
      if (call.response) {
        endpointSummary[key].statusCodes.add(call.response.status);
      }
    } catch (e) {}
  });

  console.log('\n--- API Endpoints Discovered ---');
  Object.keys(endpointSummary).sort().forEach(key => {
    const data = endpointSummary[key];
    console.log(`\nEndpoint: ${key}`);
    console.log(`  Count: ${data.count}`);
    console.log(`  Statuses: ${Array.from(data.statusCodes).join(', ')}`);
    console.log(`  Authenticated: ${data.hasAuthHeader ? 'Yes (Bearer Token)' : 'No'}`);
    if (data.exampleQuery) console.log(`  Example Query: ${data.exampleQuery}`);
    if (data.examplePayload && data.examplePayload.length < 500) {
      console.log(`  Example Payload: ${data.examplePayload}`);
    } else if (data.examplePayload) {
      console.log(`  Example Payload: (Large Payload, length: ${data.examplePayload.length})`);
    }
  });
}

analyzeTraffic(path.join(process.cwd(), 'traffic.json'));
