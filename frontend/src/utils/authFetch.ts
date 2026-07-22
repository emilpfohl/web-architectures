const API_URL = import.meta.env.VITE_API_URL || '';

export async function authFetch(url: string | URL | globalThis.Request, options: RequestInit = {}): Promise<Response> {
  const fetchOptions = {
    ...options,
    credentials: 'include' as RequestCredentials, // Sende Cookies (JWT) bei jedem Request mit
  };

  const resolvedUrl = typeof url === 'string' && url.startsWith('/') ? `${API_URL}${url}` : url;

  const response = await fetch(resolvedUrl, fetchOptions);

  if (response.status === 401) {
    // Wenn Token abgelaufen oder ungültig: Zum Login weiterleiten
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
  }

  return response;
}
