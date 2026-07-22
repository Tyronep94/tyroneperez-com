-- OPTIONAL DEVELOPMENT DATA ONLY. Run manually in a non-production project.
do $$
declare
  c1 uuid; c2 uuid; c3 uuid; photo uuid; portrait uuid; recording uuid; mixing uuid;
begin
  insert into public.clients(first_name,last_name,email,phone,preferred_contact_method,referral_source,requires_follow_up,follow_up_date)
  values('Maya','Johnson','maya@example.com','(323) 555-0142','text','Instagram',true,current_date + 2) returning id into c1;
  insert into public.clients(first_name,last_name,email,phone,preferred_contact_method,referral_source)
  values('Jordan','Lee','jordan@example.com','(213) 555-0188','email','Client referral') returning id into c2;
  insert into public.clients(first_name,last_name,email,phone,preferred_contact_method,referral_source,requires_follow_up,follow_up_date)
  values('Elijah','Martinez','elijah@example.com','(818) 555-0116','phone','Church community',true,current_date + 1) returning id into c3;
  select id into photo from public.services where slug='graduation-photography';
  select id into portrait from public.services where slug='portrait-session';
  select id into recording from public.services where slug='recording-session';
  select id into mixing from public.services where slug='mixing';
  insert into public.bookings(client_id,service_id,title,category,start_at,end_at,location,status) values
  (c1,photo,'Graduation Session','photography',(current_date + time '14:00') at time zone 'America/Los_Angeles',(current_date + time '15:30') at time zone 'America/Los_Angeles','USC Village','confirmed'),
  (c2,mixing,'Mixing Session','music',(current_date + time '18:30') at time zone 'America/Los_Angeles',(current_date + time '21:30') at time zone 'America/Los_Angeles','Tyrone Perez Creative Studio','confirmed'),
  (c3,portrait,'Portrait Session','photography',((current_date+1) + time '11:00') at time zone 'America/Los_Angeles',((current_date+1) + time '12:00') at time zone 'America/Los_Angeles','Griffith Park','confirmed'),
  (c1,recording,'Vocal Recording','music',((current_date+3) + time '17:00') at time zone 'America/Los_Angeles',((current_date+3) + time '19:00') at time zone 'America/Los_Angeles','Tyrone Perez Creative Studio','pending');
  insert into public.inquiries(client_id,service_id,requested_date,requested_start_time,message,location,status) values
  (c2,portrait,current_date+10,'16:00','Looking for updated professional portraits.','Downtown Los Angeles','new'),
  (c3,mixing,current_date+14,'18:00','Need a worship single mixed before release.',null,'new');
end $$;
