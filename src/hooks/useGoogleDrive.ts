import { useState, useEffect, useCallback, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const STORAGE_KEY = "mtg-proxy-builder-gdrive-token";
const FOLDER_NAME = "Uploads - mtgproxies.tabletop.cloud";

/** Cache the folder ID for the session so we don't query every upload. */
let cachedFolderId: string | null = null;

interface StoredToken {
  access_token: string;
  expiresAt: number;
}

function saveToken(token: string, expiresIn: number) {
  const data: StoredToken = {
    access_token: token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredToken = JSON.parse(raw);
    // Consider expired if less than 60 seconds remaining
    if (Date.now() >= data.expiresAt - 60_000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data.access_token;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function clearStoredToken() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${src}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error(`Failed to load script: ${src}`)),
        );
      }
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function getOrCreateFolder(token: string): Promise<string> {
  if (cachedFolderId) return cachedFolderId;

  // Search for existing folder created by this app
  const query = `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (searchResponse.ok) {
    const data = await searchResponse.json();
    if (data.files?.length > 0) {
      cachedFolderId = data.files[0].id;
      return cachedFolderId!;
    }
  }

  // Create the folder
  const createResponse = await fetch(
    "https://www.googleapis.com/drive/v3/files",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      }),
    },
  );

  if (!createResponse.ok) {
    throw new Error("Failed to create upload folder");
  }

  const folder = await createResponse.json();
  cachedFolderId = folder.id;
  return cachedFolderId!;
}

export function useGoogleDrive() {
  const restoredToken = loadToken();
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(!!restoredToken);
  const [accessToken, setAccessToken] = useState<string | null>(restoredToken);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(
    null,
  );
  const accessTokenRef = useRef<string | null>(restoredToken);

  // Load Google Identity Services script
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await loadScript("https://accounts.google.com/gsi/client");
        if (!cancelled) setScriptsLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load Google APIs");
          console.error("Google scripts load error:", err);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize token client once scripts are loaded
  useEffect(() => {
    if (!scriptsLoaded || !CLIENT_ID) return;

    tokenClientRef.current = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          setError(response.error_description ?? response.error);
          return;
        }
        accessTokenRef.current = response.access_token;
        setAccessToken(response.access_token);
        setIsSignedIn(true);
        setError(null);
        saveToken(response.access_token, response.expires_in);
      },
    });
  }, [scriptsLoaded]);

  const signIn = useCallback(() => {
    if (!tokenClientRef.current) {
      setError("Google API not ready. Please try again.");
      return;
    }
    setError(null);
    tokenClientRef.current.requestAccessToken({ prompt: "consent" });
  }, []);

  const signOut = useCallback(() => {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken);
    }
    setAccessToken(null);
    setIsSignedIn(false);
    setLastUploadedUrl(null);
    setError(null);
    clearStoredToken();
    cachedFolderId = null;
  }, [accessToken]);

  const uploadAndShareFile = useCallback(async (file: File, baseName?: string): Promise<void> => {
    const token = accessTokenRef.current;
    if (!token) {
      setError("Not authenticated");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Get or create the upload folder
      const folderId = await getOrCreateFolder(token);

      // Step 2: Upload to Google Drive via multipart upload
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const dotIndex = file.name.lastIndexOf(".");
      const ext = dotIndex > 0 ? file.name.slice(dotIndex) : "";
      const namePrefix = baseName ?? (dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name);
      const timestampedName = `${namePrefix}_${timestamp}${ext}`;

      const metadata: Record<string, unknown> = {
        name: timestampedName,
        mimeType: file.type,
        parents: [folderId],
      };

      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      );
      form.append("file", file);

      const uploadResponse = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );

      if (!uploadResponse.ok) {
        if (uploadResponse.status === 401) {
          clearStoredToken();
          accessTokenRef.current = null;
          setAccessToken(null);
          setIsSignedIn(false);
          throw new Error("Session expired. Please sign in again.");
        }
        const errData = await uploadResponse.json().catch(() => null);
        throw new Error(
          errData?.error?.message ?? `Upload failed (${uploadResponse.status})`,
        );
      }

      const uploadedFile = await uploadResponse.json();

      // Step 3: Share publicly
      const shareResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: "reader", type: "anyone" }),
        },
      );

      if (!shareResponse.ok) {
        const errData = await shareResponse.json().catch(() => null);
        throw new Error(
          errData?.error?.message ??
            `Failed to share file (${shareResponse.status})`,
        );
      }

      // Step 4: Build public URL (routed through CORS proxy at render time)
      const publicUrl = `https://drive.google.com/uc?export=view&id=${uploadedFile.id}`;
      setLastUploadedUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearLastUrl = useCallback(() => setLastUploadedUrl(null), []);

  return {
    scriptsLoaded,
    isSignedIn,
    isProcessing,
    lastUploadedUrl,
    error,
    signIn,
    signOut,
    uploadAndShareFile,
    clearError,
    clearLastUrl,
  };
}
