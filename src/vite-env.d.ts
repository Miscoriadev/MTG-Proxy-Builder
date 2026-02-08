/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}

// Google Identity Services
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        requestAccessToken(overrides?: { prompt?: string }): void;
      }
      interface TokenResponse {
        access_token: string;
        expires_in: number;
        error?: string;
        error_description?: string;
      }
      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }): TokenClient;
      function revoke(token: string, callback?: () => void): void;
    }
  }
}
