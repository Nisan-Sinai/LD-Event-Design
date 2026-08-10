alter table public.package_overrides
  add column if not exists image_url_3 text,
  add column if not exists image_url_4 text;

comment on column public.package_overrides.image_url_3 is 'Optional third catalog image for a package or shop product.';
comment on column public.package_overrides.image_url_4 is 'Optional fourth catalog image for a package or shop product.';
