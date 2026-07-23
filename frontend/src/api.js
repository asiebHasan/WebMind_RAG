const API_BASE = '/api';

export async function startIngest(url, maxDepth = 3, maxPages = 50) {
  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, max_depth: maxDepth, max_pages: maxPages }),
  });
  if (!res.ok) throw new Error(`Ingest failed: ${res.statusText}`);
  return res.json();
}

export async function getJobStatus(jobId) {
  const res = await fetch(`${API_BASE}/ingest/${jobId}`);
  if (!res.ok) throw new Error(`Job status failed: ${res.statusText}`);
  return res.json();
}

export async function askQuestion(question, urls = null, topK = 10) {
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, urls, top_k: topK }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Query failed');
  }
  return res.json();
}

export async function getSources() {
  const res = await fetch(`${API_BASE}/sources`);
  if (!res.ok) throw new Error(`Sources failed: ${res.statusText}`);
  return res.json();
}

export async function deleteSource(urlId) {
  const res = await fetch(`${API_BASE}/sources/${encodeURIComponent(urlId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
  return res.json();
}
