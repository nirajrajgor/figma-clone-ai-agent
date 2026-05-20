export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function uploadTooLargeMessage(): string {
  const mb = MAX_UPLOAD_BYTES / (1024 * 1024);
  return `Image must be ${mb} MB or smaller`;
}

export function isUploadTooLarge(size: number): boolean {
  return size > MAX_UPLOAD_BYTES;
}
