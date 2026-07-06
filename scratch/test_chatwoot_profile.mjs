async function run() {
  const url = 'https://chat.tork.services/api/v1/profile';
  const token = 'VDiCRLWP13ckmasC5QTH3xgF';
  try {
    const res = await fetch(url, {
      headers: { 'api_access_token': token }
    });
    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Response Body:");
    try {
      const data = JSON.parse(body);
      console.log(JSON.stringify(data, null, 2));
    } catch {
      console.log(body);
    }
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
}

run();
