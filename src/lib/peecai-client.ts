import type { ApiResponse } from "./types";

const BASE_URL = "https://api.peec.ai/customer/v1";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ERROR_LENGTH = 500;

export class PeecApiClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const response = await this.request(path, { method: "GET", params });
    const json = (await response.json()) as ApiResponse<T>;
    return json.data;
  }

  async getRaw<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const response = await this.request(path, { method: "GET", params });
    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: Record<string, unknown>, params?: Record<string, string | undefined>): Promise<T> {
    const response = await this.request(path, {
      method: "POST",
      params,
      body: JSON.stringify(body),
      extraHeaders: { "Content-Type": "application/json" },
    });
    const json = (await response.json()) as ApiResponse<T>;
    return json.data;
  }

  private async request(
    path: string,
    options: {
      method: "GET" | "POST";
      params?: Record<string, string | number | undefined>;
      body?: string;
      extraHeaders?: Record<string, string>;
    },
  ): Promise<Response> {
    const url = new URL(`${BASE_URL}${path}`);
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: options.method,
      headers: {
        "X-API-Key": this.apiKey,
        Accept: "application/json",
        ...options.extraHeaders,
      },
      body: options.body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(await this.formatError(response));
    }

    return response;
  }

  private async formatError(response: Response): Promise<string> {
    const text = await response.text();
    let message: string;
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || text;
    } catch {
      message = text;
    }
    if (typeof message !== "string") {
      message = JSON.stringify(message);
    }
    if (message.length > MAX_ERROR_LENGTH) {
      message = message.slice(0, MAX_ERROR_LENGTH) + "…";
    }
    return `Peec AI API error ${response.status}: ${message}`;
  }
}
