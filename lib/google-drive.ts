'use client';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient: any = null;
let accessToken: string | null = null;
let gapiReady = false;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export async function initGoogleDrive(): Promise<void> {
  if (gapiReady) return;
  await loadScript('https://apis.google.com/js/api.js');
  await loadScript('https://accounts.google.com/gsi/client');

  await new Promise<void>((resolve) => {
    (window as any).gapi.load('client', () => resolve());
  });

  await (window as any).gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });

  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: () => {},
  });

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

    tokenClient.callback = (resp: any) => {
      if (resp.error) {
        reject(new Error(resp.error));
        return;
      }
      accessToken = resp.access_token;
      resolve(resp.access_token);
    };

    tokenClient.requestAccessToken({ prompt: 'consent' });
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
