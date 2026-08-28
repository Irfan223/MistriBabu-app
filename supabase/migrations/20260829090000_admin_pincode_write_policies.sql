-- Admin app (authenticated, not service-role) needs write access to manage pincodes.
create policy "Admins can insert pincodes"
  on public.serviceable_pincodes for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update pincodes"
  on public.serviceable_pincodes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
