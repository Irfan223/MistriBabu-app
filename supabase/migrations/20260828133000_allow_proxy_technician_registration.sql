/* Allow proxy registrations: service PIN is required, current GPS is optional. */

alter table public.technicians
  add column if not exists experience_years integer,
  add column if not exists aadhaar_number text,
  add column if not exists service_pincode text;

alter table public.technicians
  alter column location drop not null;

alter table public.technicians
  drop constraint if exists technicians_service_pincode_check;

alter table public.technicians
  add constraint technicians_service_pincode_check
  check (service_pincode is null or service_pincode ~ '^[0-9]{6}$');

alter table public.technicians
  drop constraint if exists technicians_experience_years_check;

alter table public.technicians
  add constraint technicians_experience_years_check
  check (experience_years is null or experience_years >= 0);
