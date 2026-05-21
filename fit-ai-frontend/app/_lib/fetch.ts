import { cookies } from "next/headers";

const getBody = <T>(c: Response | Request): Promise<T> => {
  return c.json() as Promise<T>;
};

const getUrl = (contextUrl: string): string => {
  // Verifica se o código está executando no Servidor ou no Navegador
  const isServer = typeof window === "undefined";
  
  // Se for no servidor, usa a URL interna do Docker. Se for no cliente, usa a pública.
  const baseUrl = isServer 
    ? (process.env.INTERNAL_API_URL || "http://backend:8081") 
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081");

  const newUrl = new URL(`${baseUrl}${contextUrl}`);
  return newUrl.toString();
};

const getHeaders = async (headers?: HeadersInit): Promise<HeadersInit> => {
  const _cookies = await cookies();
  return {
    ...headers,
    cookie: _cookies.toString(),
  };
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
