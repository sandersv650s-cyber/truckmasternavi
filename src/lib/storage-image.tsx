import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImage } from "@/components/ui/avatar";

/** Resolve a stored value (either a full URL or a bucket path) to a displayable URL. */
export function useResolvedStorageUrl(bucket: string, value: string | null | undefined) {
  return useQuery({
    queryKey: ["storage-url", bucket, value ?? null],
    enabled: !!value,
    staleTime: 55 * 60 * 1000,
    queryFn: async () => {
      if (!value) return null;
      if (/^https?:\/\//i.test(value)) return value;
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(value, 60 * 60);
      if (error) return null;
      return data.signedUrl;
    },
  });
}

export function StorageImg({
  bucket,
  path,
  className,
  alt = "",
  loading = "lazy",
}: {
  bucket: string;
  path: string | null | undefined;
  className?: string;
  alt?: string;
  loading?: "eager" | "lazy";
}) {
  const { data: url } = useResolvedStorageUrl(bucket, path);
  if (!url) return null;
  return <img src={url} alt={alt} className={className} loading={loading} />;
}

export function StorageAvatarImage({
  bucket,
  path,
  alt = "",
}: {
  bucket: string;
  path: string | null | undefined;
  alt?: string;
}) {
  const { data: url } = useResolvedStorageUrl(bucket, path);
  if (!url) return null;
  return <AvatarImage src={url} alt={alt} />;
}