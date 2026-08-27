/* Add business service area separately from technician's current GPS location. */

alter table public.technicians
  add column if not exists service_district text;

update public.technicians
set service_district = 'Muzaffarpur'
where service_district is null;

alter table public.technicians
  alter column service_district set not null;

alter table public.technicians
  drop constraint if exists technicians_service_district_check;

alter table public.technicians
  add constraint technicians_service_district_check
  check (service_district in ('Muzaffarpur', 'Sitamarhi', 'Sheohar', 'Motihari'));
