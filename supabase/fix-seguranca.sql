-- ============================================================
-- Ficha no Pano — fecha o acesso público (rode uma vez)
--
-- Cole tudo isto no SQL Editor do Supabase e clique em "Run".
--
-- Antes: qualquer pessoa na internet lia etapas, players e
-- pagamentos (nome, valor, data e status de pagamento).
-- Depois: só quem estiver na tabela `autorizados` lê etapas e players,
-- só o `admin` lê pagamentos, e só o `admin` escreve.
--
-- Pode rodar de novo com segurança: se uma versão anterior deste
-- arquivo tiver criado a policy "autorizado le pagamentos", o passo 3
-- a remove.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Lista de quem pode acessar o app
-- ------------------------------------------------------------
create table if not exists autorizados (
  email      text primary key,
  nome       text,
  admin      boolean not null default false,
  pix        text,               -- chave Pix do admin (sai do código-fonte)
  created_at timestamptz not null default now()
);

-- Se a tabela já existir de uma execução anterior, garante a coluna.
alter table autorizados add column if not exists pix text;

-- Você entra como admin. Troque o nome se quiser.
insert into autorizados (email, nome, admin, pix)
values ('glbrpinto@gmail.com', 'Glauber', true, 'glbrpinto@gmail.com')
on conflict (email) do update set admin = true, pix = excluded.pix;

-- ------------------------------------------------------------
-- 2) Funções de checagem
--
-- SECURITY DEFINER é obrigatório aqui: sem isso, uma policy da
-- tabela `autorizados` que consulta `autorizados` entra em
-- recursão infinita e o Postgres aborta a query.
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
-- 3) Remove TODA a leitura pública
-- ------------------------------------------------------------
drop policy if exists "leitura publica etapas"     on etapas;
drop policy if exists "leitura publica players"    on players;
drop policy if exists "leitura publica pagamentos" on pagamentos;

drop policy if exists "admin escreve etapas"     on etapas;
drop policy if exists "admin escreve players"    on players;
drop policy if exists "admin escreve pagamentos" on pagamentos;

-- Criada por uma versão anterior deste arquivo, quando pagamentos ainda
-- era legível por qualquer autorizado. Sai fora.
drop policy if exists "autorizado le pagamentos" on pagamentos;

-- ------------------------------------------------------------
-- 4) Novas policies: autorizado lê, admin escreve
-- ------------------------------------------------------------
alter table etapas     enable row level security;
alter table players    enable row level security;
alter table pagamentos enable row level security;
alter table autorizados enable row level security;

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

-- Pagamentos é a exceção: nem os autorizados leem, só o admin.
-- A tabela tem valor devido, data e status de cada jogador, e não há
-- razão para um dos 17 baixar a situação financeira dos outros.
-- A policy "for all" abaixo já cobre o SELECT do admin, então não
-- falta nenhuma policy de leitura aqui.
create policy "admin escreve pagamentos" on pagamentos
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
-- 5) Conferência — nenhuma linha deve ter roles = {public}
-- ------------------------------------------------------------
select tablename, policyname, cmd, roles
from pg_policies
where tablename in ('etapas', 'players', 'pagamentos', 'autorizados')
order by tablename, policyname;
