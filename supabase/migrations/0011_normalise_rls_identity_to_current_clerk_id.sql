-- Normalise 6 RLS policies: current_setting('app.clerk_user_id', true) -> current_clerk_id()
-- Applied to production (kjgrijqrbiikguovshtc) 26 Aug 2026. Expression-only ALTER POLICY swaps.

alter policy "projects_workspace_owner" on public.projects
  using (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()))
  with check (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()));

alter policy "rate_card_workspace_owner" on public.rate_card
  using (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()))
  with check (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()));

alter policy "scope_library_workspace_owner" on public.scope_library
  using (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()))
  with check (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()));

alter policy "fee_resourcing_templates_workspace_owner" on public.fee_resourcing_templates
  using (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()))
  with check (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()));

alter policy "voice_profiles_workspace_owner" on public.voice_profiles
  using (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()))
  with check (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()));

alter policy "follow_up_logs_workspace_owner" on public.follow_up_logs
  using (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()))
  with check (workspace_id in (select id from public.workspaces where clerk_user_id = current_clerk_id()));
