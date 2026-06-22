import { useSignedUrl } from '@/lib/signedUrl';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface SignedImageProps {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Renders an image stored in a private Supabase bucket using a signed URL.
 * Handles both new (path-only) and legacy (full public URL) values.
 */
export function SignedImage({ bucket, path, alt, className, fallbackClassName }: SignedImageProps) {
  const { data: signed, isLoading } = useSignedUrl(bucket, path);

  if (!path) {
    return (
      <div className={fallbackClassName ?? 'bg-muted flex items-center justify-center'}>
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }
  if (isLoading || !signed) {
    return (
      <div className={fallbackClassName ?? 'bg-muted flex items-center justify-center'}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <img src={signed} alt={alt} className={className} />;
}
