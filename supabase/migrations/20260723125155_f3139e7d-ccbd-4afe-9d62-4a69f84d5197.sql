
-- Public read on both buckets, authenticated write only to own folder ({user_id}/...)
CREATE POLICY "public read post-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "auth upload own post-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "auth update own post-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "auth delete own post-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "auth upload own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "auth update own avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "auth delete own avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
