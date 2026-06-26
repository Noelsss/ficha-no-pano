-- ============================================================
-- Ficha no Pano — schema do Supabase
-- Cole tudo isto no SQL Editor do Supabase e clique em "Run".
-- ============================================================

-- Jogadores
create table if not exists players (
  name text primary key
);

-- Etapas (a Mesa Final é uma linha com num = 'MF')
create table if not exists etapas (
  num         text primary key,         -- '1'..'9' ou 'MF'
  data        date    not null,
  sede        text    default '',
  buyin       integer not null default 80,
  rebuy       integer not null default 70,
  buyins      integer not null default 0,
  rebuys      integer not null default 0,
  total       integer not null default 0,
  fundo_ft    integer not null default 0,
  pool_etapa  integer not null default 0,
  acumulado   integer not null default 0,
  prizes      jsonb   not null default '[]'::jsonb,
  resultados  jsonb   not null default '[]'::jsonb,  -- [{name, pts, rebuys}]
  detalhado   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Segurança (RLS): todos leem, só o admin escreve
-- ------------------------------------------------------------
alter table players enable row level security;
alter table etapas  enable row level security;

-- Leitura pública (ranking, calendário, histórico visíveis a todos)
create policy "leitura publica players" on players for select using (true);
create policy "leitura publica etapas"  on etapas  for select using (true);

-- Escrita apenas para o admin (você).
-- ⚠️ Troque o e-mail abaixo pelo e-mail com que VOCÊ vai fazer login.
create policy "admin escreve players" on players
  for all to authenticated
  using      ((auth.jwt() ->> 'email') = 'glbrpinto@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'glbrpinto@gmail.com');

create policy "admin escreve etapas" on etapas
  for all to authenticated
  using      ((auth.jwt() ->> 'email') = 'glbrpinto@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'glbrpinto@gmail.com');

-- ------------------------------------------------------------
-- Tempo real (opcional, mas recomendado): atualiza a tela de
-- todo mundo quando você salva uma etapa.
-- ------------------------------------------------------------
alter publication supabase_realtime add table etapas;
alter publication supabase_realtime add table players;
