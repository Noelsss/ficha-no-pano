-- ============================================================
-- Batimento do keep-alive (2026-10-21)
--
-- Cole no SQL Editor do Supabase e clique em "Run". Pode rodar mais
-- de uma vez.
--
-- Por quê: o projeto foi pausado de novo no começo de outubro mesmo
-- com o workflow `supabase-keepalive.yml` passando a cada 3 dias. O
-- ping era um SELECT anônimo em `etapas` que o RLS devolvia vazio — e
-- o Supabase só conta "atividade de banco suficiente", que pela equipe
-- deles significa de preferência uma escrita. Agora o workflow chama
-- `keepalive()`, que faz um UPDATE de verdade, uma vez por dia.
--
-- Segurança: a tabela `keepalive` fica com RLS ligado e sem policy,
-- então ninguém lê nem escreve nela pela API. A única porta é a função,
-- que roda como dono (security definer) e só sabe atualizar o horário
-- de uma linha fixa. Qualquer pessoa com a anon key (que é pública)
-- consegue chamá-la — o pior que faz é mudar esse horário.
-- ============================================================

create table if not exists keepalive (
  id         int primary key default 1 check (id = 1),
  ultimo_em  timestamptz not null default now()
);

insert into keepalive (id) values (1) on conflict (id) do nothing;

alter table keepalive enable row level security;

create or replace function public.keepalive()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  update keepalive set ultimo_em = now() where id = 1
  returning ultimo_em;
$$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon;

-- Conferência: deve devolver o horário de agora.
select public.keepalive();
