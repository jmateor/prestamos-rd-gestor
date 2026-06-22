import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Extracts the storage path from either a stored path (new format)
 * or a legacy getPublicUrl() string (old format).
 *
 * Examples:
 *   "abc/foto_123.jpg" => "abc/foto_123.jpg"
 *   "https://xxx.supabase.co/storage/v1/object/public/clientes/abc/foto_123.jpg"
 *     => "abc/foto_123.jpg"
 */
export function extractStoragePath(bucket: string, urlOrPath: string): string {
  if (!urlOrPath) return '';
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = urlOrPath.indexOf(marker);
  if (i >= 0) return urlOrPath.slice(i + marker.length);
  const signedMarker = `/storage/v1/object/sign/${bucket}/`;
  const j = urlOrPath.indexOf(signedMarker);
  if (j >= 0) {
    const rest = urlOrPath.slice(j + signedMarker.length);
    return rest.split('?')[0];
  }
  return urlOrPath;
}

/**
 * Creates a signed URL for an object in a private bucket.
 * Accepts a raw path OR a legacy public URL.
 */
export async function getSignedUrl(
  bucket: string,
  urlOrPath: string | null | undefined,
  expiresIn = 3600
): Promise<string | null> {
  if (!urlOrPath) return null;
  const path = extractStoragePath(bucket, urlOrPath);
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    console.error(`[signedUrl] ${bucket}/${path}:`, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/**
 * React hook: returns a freshly-signed URL for an object.
 * Re-signs every 50 minutes to stay ahead of the 1h expiration.
 */
export function useSignedUrl(bucket: string, urlOrPath: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-url', bucket, urlOrPath],
    enabled: !!urlOrPath,
    staleTime: 50 * 60 * 1000,
    refetchInterval: 50 * 60 * 1000,
    queryFn: () => getSignedUrl(bucket, urlOrPath, 3600),
  });
}

/**
 * Fetches an image and converts it to a data URL (useful for jsPDF.addImage).
 */
export async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
