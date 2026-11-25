-- ========================================================
-- 1. Product name/description translations
-- 2. Camera search: CLIP image embeddings (pgvector + HNSW)
-- Run once in the Supabase SQL editor.
-- ========================================================

-- 1. { "en": { "name": "...", "description": "..." }, "es": {...}, "zh": {...}, "fr": {...} }
--    The plain name/description columns stay the default text.
alter table public.products
  add column if not exists translations jsonb not null default '{}'::jsonb;

-- 2. Visual search. Kept out of `products` so select('*') stays light.
create extension if not exists vector with schema extensions;

create table if not exists public.product_image_embeddings (
  product_id uuid primary key references public.products(id) on delete cascade,
  embedding extensions.vector(512) not null,
  image_url text not null, -- the photo the embedding was computed from
  updated_at timestamptz not null default now()
);

-- Written only by the server (service role); nobody reads it directly.
alter table public.product_image_embeddings enable row level security;

create index if not exists product_image_embeddings_hnsw
  on public.product_image_embeddings using hnsw (embedding extensions.vector_cosine_ops);

-- Nearest active products to a photo, best first (similarity 1 = identical).
create or replace function public.match_products_by_image(
  query_embedding extensions.vector(512),
  match_count int default 24,
  min_similarity float default 0.2
)
returns table (id uuid, similarity float)
language sql stable
security definer
set search_path = public, extensions
as $$
  select e.product_id, 1 - (e.embedding <=> query_embedding) as similarity
  from public.product_image_embeddings e
  join public.products p on p.id = e.product_id and p.is_active
  where 1 - (e.embedding <=> query_embedding) >= min_similarity
  order by e.embedding <=> query_embedding
  limit least(match_count, 60);
$$;

revoke all on function public.match_products_by_image(extensions.vector, int, float) from public;
grant execute on function public.match_products_by_image(extensions.vector, int, float) to anon, authenticated, service_role;
