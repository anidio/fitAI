const getBody = <T>(c: Response | Request): Promise<T> => {
  return c.json() as Promise<T>;
};

const getUrl = (contextUrl: string): string => {
  // Verifica se o código está executando no Servidor ou no Navegador
  const isServer = typeof window === "undefined";
  
  // Se for no servidor, usa a URL interna do Docker. Se for no cliente, usa a pública.
  const baseUrl = isServer 
    ? (process.env.INTERNAL_API_URL || "http://backend:8081") 
    : (process.env.NEXT_PUBLIC_API_URL || "https://fitai-backend-fdgf.onrender.com");

  const newUrl = new URL(`${baseUrl}${contextUrl}`);
  return newUrl.toString();
};

const getHeaders = async (headers?: HeadersInit): Promise<HeadersInit> => {
  // Se estiver no navegador, não precisamos manipular cookies manualmente, 
  // o browser já envia automaticamente com credentials: "include"
  if (typeof window !== "undefined") {
    return headers || {};
  }

  // Se estiver no servidor, precisamos repassar os cookies da requisição original para o backend
  try {
    const { cookies } = await import("next/headers");
    const _cookies = await cookies();
    return {
      ...headers,
      cookie: _cookies.toString(),
    };
  } catch (e) {
    // Caso ocorra erro ao importar next/headers em contexto não esperado
    return headers || {};
  }
};

export const customFetch = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const requestUrl = getUrl(url);
  const requestHeaders = await getHeaders(options.headers);

  const requestInit: RequestInit = {
    ...options,
    headers: requestHeaders,
    credentials: "include",
  };

  const response = await fetch(requestUrl, requestInit);
  const data = await getBody<T>(response);

  return { status: response.status, data, headers: response.headers } as T;
};
