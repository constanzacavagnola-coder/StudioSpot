-- Studio Spot — esquema inicial
-- Catálogo de "espacios" (cafés, coworks, bibliotecas) con atributos de productividad.
-- La red de socios / wallet / wifi dedicado NO se modelan: son conceptuales (solo presentación).

-- Extensión para uuid
create extension if not exists "pgcrypto";

-- Enums de atributos (etiquetas en español, las usa la UI directamente)
do $$ begin
  create type place_type as enum ('cafe', 'coworking', 'biblioteca');
exception when duplicate_object then null; end $$;

do $$ begin
  create type nivel3 as enum ('bajo', 'medio', 'alto');         -- enchufes, wifi, congestión
exception when duplicate_object then null; end $$;

do $$ begin
  create type nivel_ruido as enum ('silencioso', 'moderado', 'animado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type nivel_precio as enum ('gratis', '$', '$$', '$$$');
exception when duplicate_object then null; end $$;

create table if not exists places (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  nombre        text not null,
  tipo          place_type not null,
  comuna        text not null,
  direccion     text not null,
  lat           double precision not null,
  lng           double precision not null,
  descripcion   text,
  -- atributos de productividad
  enchufes      nivel3 not null,
  wifi          nivel3 not null,
  ruido         nivel_ruido not null,
  ambiente      text,                       -- libre: "luminoso, mesas amplias, terraza"
  precio        nivel_precio not null,
  tiene_banos   boolean not null default true,
  horario       text,                       -- libre: "Lun-Vie 08:00-21:00"
  -- congestión por franja horaria (estilo Waze): { "mañana":"bajo", "mediodia":"alto", "tarde":"medio", "noche":"bajo" }
  congestion    jsonb not null default '{}'::jsonb,
  fuente        text,                        -- procedencia del dato (provenance)
  created_at    timestamptz not null default now()
);

create index if not exists places_comuna_idx on places (comuna);
create index if not exists places_tipo_idx on places (tipo);

-- RLS: lectura pública (anon), sin escritura desde el cliente.
alter table places enable row level security;

do $$ begin
  create policy "places_public_read" on places
    for select using (true);
exception when duplicate_object then null; end $$;
