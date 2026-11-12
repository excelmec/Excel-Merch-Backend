import { BUCKET_NAME } from './env';

const publicBaseUrl = process.env.MERCH_PUBLIC_BASE_URL?.replace(/\/$/, '');

export function getLogoUrl(): string {
  return publicBaseUrl
    ? `${publicBaseUrl}/media/logo`
    : `https://storage.googleapis.com/${BUCKET_NAME}/logotext.png`;
}

export function getItemMediaUrl(itemId: number, fileName: string): string {
  return publicBaseUrl
    ? `${publicBaseUrl}/media/item/${itemId}/${encodeURIComponent(fileName)}`
    : `https://storage.googleapis.com/${BUCKET_NAME}/merch/item/${itemId}/${encodeURIComponent(fileName)}`;
}

