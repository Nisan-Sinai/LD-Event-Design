-- Allow the admin catalogue to receive any browser-declared image format up to 30 MB.
-- SVG/XML stays blocked in the client because public SVG can contain active content.
update storage.buckets
set file_size_limit = 31457280,
    allowed_mime_types = null
where id = 'package-images';
