export async function authFetch(url: string | URL | globalThis.Request, options: RequestInit = {}): Promise<Response> {
  const fetchOptions = {
    ...options,
    credentials: 'include' as RequestCredentials, // Sende Cookies (JWT) bei jedem Request mit
  };

  const response = await fetch(url, fetchOptions);

  if (response.status === 401) {
    // Wenn Token abgelaufen oder ungültig: Zum Login weiterleiten
    if (!['/login', '/register', '/welcome', '/contact', '/impressum', '/about'].includes(window.location.pathname)) {
      window.location.href = '/welcome';
    }
  }

  return response;
}
