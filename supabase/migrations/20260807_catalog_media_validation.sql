update storage.buckets
set file_size_limit = 8388608,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    ]::text[]
where id = 'package-images';
