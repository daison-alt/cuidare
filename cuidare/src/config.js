export const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : `https://${window.location.hostname.replace(
        /-5173\.app\.github\.dev$/,
        "-8000.app.github.dev"
      )}`;


// O token é anexado automaticamente às chamadas da API.
// Isso mantém as páginas existentes protegidas sem precisar duplicar
// a mesma lógica de autenticação em cada fetch.
if (!window.__cuidareFetchProtegido) {
  const fetchOriginal = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const url =
      typeof input === "string"
        ? input
        : input?.url || "";

    const isApiRequest = url.startsWith(API_URL);
    const token = localStorage.getItem("cuidare_token");

    if (!isApiRequest || !token) {
      return fetchOriginal(input, init);
    }

    const headers = new Headers(
      init.headers ||
        (typeof input !== "string" ? input.headers : undefined)
    );

    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetchOriginal(input, {
      ...init,
      headers,
    });
  };

  window.__cuidareFetchProtegido = true;
}
