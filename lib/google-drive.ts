"use client";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let accessToken: string | null = null;
let tokenClient: any = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

export function isGoogleDriveConfigured(): boolean {
  return Boolean(CLIENT_ID && API_KEY);
}

export function hasDriveAccess(): boolean {
  return Boolean(accessToken);
}

async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load script: " + src));
    document.head.appendChild(script);
  });
}

export async function initGoogleDrive(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!isGoogleDriveConfigured()) {
      throw new Error("Google Drive not configured: missing CLIENT_ID or API_KEY");
    }

    try {
      await loadScript("https://apis.google.com/js/api.js");
    } catch {
      throw new Error("Failed to load Google API script");
    }

    await new Promise<void>((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error("GAPI not available after script load"));
        return;
      }

      window.gapi.load("client", {
        callback: () => resolve(),
        onerror: () => reject(new Error("Failed to load GAPI client")),
        timeout: 10000,
        ontimeout: () => reject(new Error("GAPI client load timeout")),
      });
    });

    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID!,
      scope: SCOPES,
      callback: "",
    });

    isInitialized = true;
  })();

  return initPromise;
}

export async function requestDriveAccess(): Promise<void> {
  if (!isInitialized) await initGoogleDrive();

  return new Promise((resolve, reject) => {
    const originalOpen = window.open;
    let popupOpened = false;
    let popupClosed = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let tokenResolved = false;

    const cleanup = () => {
      window.open = originalOpen;
      clearTimeout(timeoutId);
    };

    const handleResult = (tokenResponse: any) => {
      if (tokenResolved) return;
      tokenResolved = true;
      cleanup();

      if (tokenResponse.error) {
        const error = tokenResponse.error;
        if (error === "popup_closed_by_user" || popupClosed) {
          reject(new Error("Authorization popup was closed. Please try again and allow the popup."));
        } else if (error === "access_denied") {
          reject(new Error("Access denied. Please grant permission to upload to Google Drive."));
        } else {
          reject(new Error("Authorization failed: " + error));
        }
        return;
      }

      if (!tokenResponse.access_token) {
        reject(new Error("No access token received"));
        return;
      }

      accessToken = tokenResponse.access_token;
      resolve();
    };

    tokenClient.callback = handleResult;

    window.open = function (url?: string | URL, target?: string, features?: string) {
      popupOpened = true;
      const popup = originalOpen.call(window, url, target, features);

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        setTimeout(() => {
          if (!tokenResolved && !popupOpened) {
            reject(new Error("Popup blocked by browser. Please allow popups for this site and try again."));
          }
        }, 1000);
      } else {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            popupClosed = true;
            clearInterval(checkClosed);
            if (!tokenResolved) {
              reject(new Error("Authorization popup was closed. Please try again and allow the popup."));
            }
          }
        }, 500);
      }

      return popup;
    };

    timeoutId = setTimeout(() => {
      if (!tokenResolved) {
        cleanup();
        reject(new Error("Authorization timeout (60s). Please try again."));
      }
    }, 60000);

    tokenClient.requestAccessToken();
  });
}

export async function uploadToDrive(
  blob: Blob,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!accessToken) {
    throw new Error("No access token. Call requestDriveAccess() first.");
  }

  const metadata = {
    name: fileName,
    mimeType: blob.type,
  };

  const boundary = "-------multipartboundary";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelim = "\r\n--" + boundary + "--";

  const base64Data = await blobToBase64(blob);

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: " + blob.type + "\r\n" +
    "Content-Transfer-Encoding: base64\r\n\r\n" +
    base64Data +
    closeDelim;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.timeout = 600000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.webViewLink || "https://drive.google.com/file/d/" + response.id + "/view");
        } catch {
          resolve("Upload successful");
        }
      } else if (xhr.status === 401) {
        accessToken = null;
        reject(new Error("TOKEN_EXPIRED"));
      } else if (xhr.status === 0) {
        reject(new Error("Network error: Unable to reach Google Drive. Check your internet connection."));
      } else {
        let errorMsg = "Upload failed (" + xhr.status + ")";
        try {
          const error = JSON.parse(xhr.responseText);
          errorMsg += ": " + (error.error?.message || xhr.statusText);
        } catch {
          errorMsg += ": " + xhr.statusText;
        }
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error: Upload failed. Check your internet connection."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload timeout (10 minutes). The file may be too large or the connection too slow."));
    };

    xhr.open("POST", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart");
    xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
    xhr.setRequestHeader("Content-Type", "multipart/related; boundary=\"" + boundary + "\"");
    xhr.send(multipartRequestBody);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}