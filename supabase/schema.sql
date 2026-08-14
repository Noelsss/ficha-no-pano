-- ============================================================
-- Ficha no Pano — schema do Supabase (estado final)
--
-- Este arquivo monta um projeto do zero já com o RLS fechado.
-- Cole tudo no SQL Editor do Supabase e clique em "Run". Pode rodar
-- de novo sem erro: as policies são recriadas.
--
-- Regra de acesso, em uma linha:
--   • nada é público — sem login, a API não devolve uma linha sequer;
--   • quem está em `autorizados` lê etapas e players;
--   • pagamentos só o admin lê, porque é dinheiro (ver seção 5);
--   • só o admin escreve em qualquer tabela.
--
-- Arquivos irmãos, para bancos que já existem:
--   fix-seguranca.sql             — fecha o acesso público de um banco antigo
--   2026-08-14-pagamentos-so-admin.sql — tira a leitura de pagamentos dos não-admin
--   solicitacoes.sql              — pedidos de acesso pelo app
--   autorizar.sql                 — libera gente na mão, sem passar pelo app
-- ============================================================

-- ------------------------------------------------------------
-- 1) Tabelas
-- ------------------------------------------------------------

-- Quem pode entrar no app. Sem estar aqui, o login funciona mas não
-- se enxerga nada.
create table if not exists autorizados (
  email      text primary key,
  nome       text,
  admin      boolean not null default false,
  pix        text,               -- chave Pix do admin (sai do código-fonte)
  created_at timestamptz not null default now()
);

-- Se a tabela vier de uma versão anterior, garante a coluna.
alter table autorizados add column if not exists pix text;

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

-- Pagamentos (status pago/pendente por jogador em cada etapa)
create table if not exists pagamentos (
  etapa_num  text not null,
  player     text not null,
  pago       boolean not null default false,
  valor      numeric,
  data_pago  date,
  fonte      text default 'manual',   -- 'manual' | 'extrato'
  created_at timestamptz not null default now(),
  primary key (etapa_num, player)
);

-- ------------------------------------------------------------
-- 2) Funções de checagem
--
-- SECURITY DEFINER é obrigatório aqui: sem isso, uma policy da tabela
-- `autorizados` que consulta `autorizados` entra em recursão infinita
-- e o Postgres aborta a query.
-- ------------------------------------------------------------
create or replace function public.is_autorizado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from autorizados
    where email = (auth.jwt() ->> 'email')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from autorizados
    where email = (auth.jwt() ->> 'email') and admin
  );
$$;

-- ------------------------------------------------------------
-- 3) Liga o RLS e limpa policies de execuções anteriores
-- ------------------------------------------------------------
alter table autorizados enable row level security;
alter table players     enable row level security;
alter table etapas      enable row level security;
alter table pagamentos  enable row level security;

drop policy if exists "leitura publica players"    on players;
drop policy if exists "leitura publica etapas"     on etapas;
drop policy if exists "leitura publica pagamentos" on pagamentos;

drop policy if exists "autorizado le players"    on players;
drop policy if exists "autorizado le etapas"     on etapas;
drop policy if exists "autorizado le pagamentos" on pagamentos;

drop policy if exists "admin escreve players"    on players;
drop policy if exists "admin escreve etapas"     on etapas;
drop policy if exists "admin escreve pagamentos" on pagamentos;

drop policy if exists "ve proprio autorizado"    on autorizados;
drop policy if exists "admin gerencia autorizados" on autorizados;

-- ------------------------------------------------------------
-- 4) Policies — autorizado lê, admin escreve
-- ------------------------------------------------------------
create policy "autorizado le etapas" on etapas
  for select to authenticated using (public.is_autorizado());
create policy "admin escreve etapas" on etapas
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "autorizado le players" on players
  for select to authenticated using (public.is_autorizado());
create policy "admin escreve players" on players
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Cada um enxerga só o próprio registro; o admin enxerga e gerencia todos.
create policy "ve proprio autorizado" on autorizados
  for select to authenticated
  using (email = (auth.jwt() ->> 'email') or public.is_admin());
create policy "admin gerencia autorizados" on autorizados
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 5) Pagamentos — só o admin, nem os autorizados
--
-- Aqui NÃO existe "autorizado le pagamentos", e a diferença é de
-- propósito: a tabela tem valor devido, data e status de cada jogador.
-- Um autorizado é qualquer um dos 17 do grupo, e não há razão para um
-- deles baixar a situação financeira dos outros.
--
-- Uma policy "for all" já cobre o SELECT, então a linha abaixo é tudo
-- que o admin precisa — não falta nada aqui.
--
-- Não quebra a tela de ninguém: `pagamentos` só alimenta a aba Acerto,
-- que o App.jsx renderiza sob `isAdmin`. Para os outros o RLS devolve
-- lista vazia, sem erro.
-- ------------------------------------------------------------
create policy "admin escreve pagamentos" on pagamentos
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 6) Admin
--    Troque o e-mail se quiser entrar no app com outro.
--    A chave Pix vem daqui, não do código-fonte.
-- ------------------------------------------------------------
insert into autorizados (email, nome, admin, pix)
values ('glbrpinto@gmail.com', 'Glauber', true, 'glbrpinto@gmail.com')
on conflict (email) do update set admin = true, pix = excluded.pix;

-- ------------------------------------------------------------
-- 7) Tempo real: atualiza a tela de todo mundo quando o admin salva.
--    O RLS continua valendo no realtime — quem não pode ler pagamentos
--    também não recebe os eventos dele.
-- ------------------------------------------------------------
alter publication supabase_realtime add table etapas;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table pagamentos;

-- ------------------------------------------------------------
-- 8) Conferência — nenhuma linha pode ter roles = {public},
--    e pagamentos deve ter uma policy só.
-- ------------------------------------------------------------
select tablename, policyname, cmd, roles
from pg_policies
where tablename in ('etapas', 'players', 'pagamentos', 'autorizados')
order by tablename, policyname;
