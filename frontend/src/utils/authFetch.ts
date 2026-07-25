export async function authFetch(url: string | URL | globalThis.Request, options: RequestInit = {}): Promise<Response> {
  const fetchOptions = {
    ...options,
    credentials: 'include' as RequestCredentials, // Sende Cookies (JWT) bei jedem Request mit
  };

  const response = await fetch(url, fetchOptions);

  if (response.status === 401) {
    // Wenn Token abgelaufen oder ungültig: Zum Login weiterleiten
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
  }

  return response;
}
