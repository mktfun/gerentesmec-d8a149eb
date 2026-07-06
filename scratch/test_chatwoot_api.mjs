async function run() {
  const url = 'https://chat.tork.services/api/v1/accounts/5/inboxes';
  const token = 'VDiCRLWP13ckmasC5QTH3xgF';
  try {
    const res = await fetch(url, {
      headers: { 'api_access_token': token }
    });
    console.log("Status:", res.status);
    console.log("Status Text:", res.statusText);
    const body = await res.text();
    console.log("Response Body:", body);
    console.log("Headers:");
    for (const [key, value] of res.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
}

run();
