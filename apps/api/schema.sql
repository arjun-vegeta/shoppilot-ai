-- Clean Slate: Delete everything first to ensure a fresh start
DROP FUNCTION IF EXISTS match_products;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS products;

-- Enable the pgvector extension
create extension if not exists vector;

-- Products table
create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price numeric not null,
  category text,
  image_url text,
  specs jsonb default '{}'::jsonb,
  rating numeric default 0,
  review_count integer default 0,
  embedding vector(768), -- Dimensions for Gemini gemini-embedding-001 (Truncated)
  search_vector tsvector, -- For Full-Text Search
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to automatically update search_vector
create function products_search_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.category, '')), 'C');
  return new;
end
$$ language plpgsql;

create trigger tr_products_search_update
before insert or update on products
for each row execute function products_search_trigger();

-- Reviews table
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  user_id uuid, -- Optional if you have auth
  rating integer check (rating >= 1 and rating <= 5),
  content text,
  sentiment text check (sentiment in ('positive', 'negative', 'neutral')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indices
create index on products using hnsw (embedding vector_cosine_ops);
create index on products using gin (search_vector); -- GIN index for Full-Text Search

-- Function for hybrid search
create or replace function match_products (
  query_text text,
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  full_text_weight float default 0.4,
  vector_weight float default 0.6
)
returns table (
  id uuid,
  title text,
  description text,
  price numeric,
  category text,
  image_url text,
  specs jsonb,
  rating numeric,
  review_count integer,
  similarity float,
  fts_rank float,
  hybrid_score float
)
language plpgsql
as $$
begin
  return query
  with fts as (
    select
      p.id,
      ts_rank_cd(p.search_vector, websearch_to_tsquery('english', query_text)) as rank
    from products p
    where p.search_vector @@ websearch_to_tsquery('english', query_text)
  ),
  vs as (
    select
      p.id,
      1 - (p.embedding <=> query_embedding) as similarity
    from products p
    where 1 - (p.embedding <=> query_embedding) > match_threshold
  )
  select
    p.id,
    p.title,
    p.description,
    p.price,
    p.category,
    p.image_url,
    p.specs,
    p.rating,
    p.review_count,
    coalesce(vs.similarity, 0)::float as similarity,
    coalesce(fts.rank, 0)::float as fts_rank,
    (
      coalesce(fts.rank, 0) * full_text_weight +
      coalesce(vs.similarity, 0) * vector_weight
    )::float as hybrid_score
  from products p
  left join fts on p.id = fts.id
  left join vs on p.id = vs.id
  where fts.id is not null or vs.id is not null
  order by hybrid_score desc
  limit match_count;
end;
$$;
