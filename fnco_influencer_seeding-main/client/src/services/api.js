const rawBase = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawBase
  ? (
    rawBase.endsWith('/api/v2')
      ? rawBase
      : rawBase.endsWith('/api')
        ? `${rawBase}/v2`
        : `${rawBase}/api/v2`
  )
  : '/api/v2';

class ApiClient {
  async request(method, path, { body, params } = {}) {
    const url = new URL(`${API_BASE}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value);
        }
      });
    }

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
      throw new Error(error.message || error.error || `Request failed: ${response.status}`);
    }
    const json = await response.json();
    // 서버가 { success, data } 형태로 감싸서 반환하면 data 필드를 추출
    if (json && typeof json === 'object' && json.success !== undefined && 'data' in json) {
      return json.data;
    }
    return json;
  }

  // FormData 업로드 (multipart/form-data) — Content-Type을 브라우저가 자동 설정
  async upload(path, formData) {
    const url = new URL(`${API_BASE}${path}`, window.location.origin);
    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
      throw new Error(error.message || error.error || `Request failed: ${response.status}`);
    }
    const json = await response.json();
    if (json && typeof json === 'object' && json.success !== undefined && 'data' in json) {
      return json.data;
    }
    return json;
  }

  get(path, params) { return this.request('GET', path, { params }); }
  post(path, body) { return this.request('POST', path, { body }); }
  put(path, body) { return this.request('PUT', path, { body }); }
  patch(path, body) { return this.request('PATCH', path, { body }); }
  delete(path) { return this.request('DELETE', path); }
}

export const api = new ApiClient();
