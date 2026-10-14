'use client';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

interface GoogleTokenClient {
  callback: (response: GoogleTokenResponse) => void;
  requestAccessToken: (options: { prompt: string }) => void;
}

let tokenClient: GoogleTokenClient | null = null;
let accessToken: string | null = null;
let gapiReady = false;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    const script = existing || document.createElement('script');
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      error ? reject(error) : resolve();
    };
    const onLoad = () => finish();
    const onError = () => finish(new Error(`Failed to load ${src}`));
    const timeout = setTimeout(() => finish(new Error(`Timeout loading ${src}`)), 30000);

    if (existing) {
      const googleReady = src.includes('gsi/client') && (window as any).google?.accounts?.oauth2?.initTokenClient;
      const gapiReadyNow = src.includes('apis.google.com/js/api.js') && (window as any).gapi?.load;
      if (googleReady || gapiReadyNow) {
        finish();
        return;
      }
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      return;
    }

    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    document.head.appendChild(script);
  });
}

function waitForGoogleIdentityServices(): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      const googleApi = (window as any).google;
      if (googleApi?.accounts?.oauth2?.initTokenClient) {
        resolve();
        return;
      }
      if (Date.now() - startedAt >= 30000) {
        reject(new Error('Google Identity Services did not finish loading.'));
        return;
      }
      window.setTimeout(check, 50);
    };
    check();
  });
}

export async function initGoogleDrive(): Promise<void> {
  if (gapiReady && tokenClient) return;
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Drive client ID is not configured.');
  }

  await loadScript('https://apis.google.com/js/api.js');
  await loadScript('https://accounts.google.com/gsi/client');
  await waitForGoogleIdentityServices();

  const gapi = (window as any).gapi;
  if (!gapi?.load || !gapi?.client) {
    throw new Error('Google API client did not finish loading.');
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Google API client initialization timed out.')), 30000);
    gapi.load('client', () => {
      window.clearTimeout(timeout);
      resolve();
    });
  });

  await gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });

  const googleApi = (window as any).google;
  tokenClient = googleApi.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: () => {},
  });

  if (!tokenClient) {
    throw new Error('Google Identity Services token client could not be created.');
  }

  gapiReady = true;
}

export function isGoogleDriveConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID;
}

export async function requestDriveAccess(): Promise<string> {
  if (!gapiReady) await initGoogleDrive();

  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google client not initialized'));
      return;
    }
    const client = tokenClient;

    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Google Drive authentication timed out. Please try again.'));
      }
    }, 60000);

    tokenClient.callback = (resp: GoogleTokenResponse) => {
      const safeResponse = resp
        ? { ...resp, access_token: resp.access_token ? '[redacted]' : undefined }
        : resp;
      console.log('GIS Response:', safeResponse);

      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (!resp) {
        reject(new Error('Google returned no authentication response. The popup may have been closed.'));
        return;
      }

      if (resp.error) {
        const errorMessage = resp.error === 'origin_mismatch'
          ? 'Google OAuth origin mismatch. Add this website origin to Authorized JavaScript origins in Google Cloud Console.'
          : `Google sign-in failed: ${resp.error_description || resp.error}`;
        reject(new Error(errorMessage));
        return;
      }

      if (!resp.access_token) {
        reject(new Error('Google authentication completed without an access token.'));
        return;
      }

      accessToken = resp.access_token;
      resolve(resp.access_token);
    };

    try {
      client.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error('GIS requestAccessToken failed:', error);
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(new Error('Failed to open Google sign-in popup. Please check your popup blocker settings.'));
      }
    }
  });
}

export async function uploadToDrive(
  blob: Blob,
  fileName: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!accessToken) {
    await requestDriveAccess();
  }

  const metadata = {
    name: fileName,
    mimeType: blob.type || 'video/mp4',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const arrayBuffer = await blob.arrayBuffer();
  const byteArrays = new Uint8Array(arrayBuffer);

  const body =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${metadata.mimeType}\r\n\r\n`;

  const bodyBlob = new Blob([body, byteArrays, closeDelim], { type: `multipart/mixed; boundary="${boundary}"` });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      true,
    );
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', `multipart/mixed; boundary="${boundary}"`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded / e.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const resp = JSON.parse(xhr.responseText);
        resolve(resp.id);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(bodyBlob);
  });
}

export function hasDriveAccess(): boolean {
  return !!accessToken;
}
