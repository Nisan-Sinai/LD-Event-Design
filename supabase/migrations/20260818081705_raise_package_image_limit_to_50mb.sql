-- Match the live Storage bucket limit used by the admin catalog uploader.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = null
where id = 'package-images';
