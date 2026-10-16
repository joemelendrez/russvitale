-- Joseph's second Google account can use /admin too.
insert into public.russ_admins (email) values ('josephmelendrez12@gmail.com')
on conflict do nothing;
