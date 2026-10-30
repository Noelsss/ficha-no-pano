-- ============================================================
-- Keep-alive pelo usuário-robô (2026-10-30)
--
-- Cole no SQL Editor do Supabase e clique em "Run". Pode rodar mais
-- de uma vez. Depende de 2026-10-21-keepalive.sql já ter rodado.
--
-- Por quê: mesmo com keepalive() gravando todo dia pela anon key, o
-- projeto pausou de novo em 27/10, seis dias depois de restaurado.
-- Agora o workflow faz login como um usuário-robô (e-mail e senha nos
-- Secrets do GitHub), chama keepalive() autenticado e faz logout — a
-- aposta é que passar pelo Auth conte como atividade.
--
-- Segurança: o robô não está em `autorizados`, então o RLS não deixa
-- ele ver nem alterar nada do grupo. A função passa a aceitar só
-- usuário logado; a anon key (pública) deixa de poder chamá-la.
-- ============================================================

revoke execute on function public.keepalive() from anon;
grant execute on function public.keepalive() to authenticated;

-- Conferência: deve listar só `authenticated` (e o dono, postgres).
select grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public' and routine_name = 'keepalive';
