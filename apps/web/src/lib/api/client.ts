const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
}

export const api = {
  searchProducts: (query: string, limit = 5) =>
    apiFetch<{ results: any[] }>(`/api/v1/products?q=${encodeURIComponent(query)}&limit=${limit}`),

  chat: (message: string, history: any[] = []) =>
    apiFetch<{ response: string }>('/api/v1/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  chatStream: async (message: string, history: any[] = [], onChunk: (text: string) => void) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) throw new Error('Streaming failed');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    }
  },

  enrichProduct: (url: string) => apiFetch<any>(`/api/v1/enrich?url=${encodeURIComponent(url)}`),

  compareProduct: (query: string) =>
    apiFetch<{ comparison: any[] }>(`/api/v1/compare?q=${encodeURIComponent(query)}`),

  getSentiment: (url: string) =>
    apiFetch<{ sentiment: string }>(`/api/v1/sentiment?url=${encodeURIComponent(url)}`),

  healthCheck: () => apiFetch<{ status: string; version: string }>('/health'),
};
