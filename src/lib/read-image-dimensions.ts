async function readPngDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  const header = new DataView(await file.slice(0, 24).arrayBuffer());
  const signature = header.getUint32(0);
  if (signature !== 0x89504e47) return null;
  return {
    width: header.getUint32(16),
    height: header.getUint32(20),
  };
}

function readDimensionsFromImageElement(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image dimensions"));
    };
    img.src = url;
  });
}

export async function readFileImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const png = await readPngDimensions(file);
  if (png) return png;
  return readDimensionsFromImageElement(file);
}
