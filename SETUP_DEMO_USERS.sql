-- ============================================================
-- QUILAZAMPA! - STEP 2: Cani demo
-- Esegui DOPO aver creato gli utenti in Authentication → Users
-- ============================================================

-- Inserisce cani per gli utenti demo
-- (sostituisce automaticamente gli ID corretti)

insert into dogs (owner_id, name, breed, age, gender, size, energy, traits)
select 
  id,
  case 
    when email = 'marco@demo.it' then 'Rocky'
    when email = 'giulia@demo.it' then 'Luna'
    when email = 'sofia@demo.it' then 'Maya'
    when email = 'admin@quilazampa.it' then 'Bolt'
  end,
  case 
    when email = 'marco@demo.it' then 'Labrador'
    when email = 'giulia@demo.it' then 'Border Collie'
    when email = 'sofia@demo.it' then 'Husky'
    when email = 'admin@quilazampa.it' then 'Meticcio'
  end,
  case 
    when email = 'marco@demo.it' then 3
    when email = 'giulia@demo.it' then 2
    when email = 'sofia@demo.it' then 3
    when email = 'admin@quilazampa.it' then 4
  end,
  'M',
  case 
    when email = 'giulia@demo.it' then 'Media'
    when email = 'sofia@demo.it' then 'Grande'
    else 'Grande'
  end,
  case 
    when email = 'marco@demo.it' then 'Alta'
    when email = 'giulia@demo.it' then 'Media'
    when email = 'sofia@demo.it' then 'Alta'
    else 'Media'
  end,
  case 
    when email = 'marco@demo.it' then ARRAY['Socievole', 'Energico']
    when email = 'giulia@demo.it' then ARRAY['Socievole', 'Giocoso']
    when email = 'sofia@demo.it' then ARRAY['Energico', 'Curioso']
    else ARRAY['Tranquillo', 'Socievole']
  end
from auth.users
where email in ('marco@demo.it', 'giulia@demo.it', 'sofia@demo.it', 'admin@quilazampa.it')
on conflict do nothing;

-- Aggiorna profili demo con username e città
update profiles set username = 'marco_e_rocky', city = 'Milano'
where id = (select id from auth.users where email = 'marco@demo.it' limit 1);

update profiles set username = 'giulia_e_luna', city = 'Milano'
where id = (select id from auth.users where email = 'giulia@demo.it' limit 1);

update profiles set username = 'sofia_e_maya', city = 'Milano'
where id = (select id from auth.users where email = 'sofia@demo.it' limit 1);

update profiles set username = 'Admin_Quilazampa', city = 'Milano'
where id = (select id from auth.users where email = 'admin@quilazampa.it' limit 1);

-- Simula check-in per rendere la mappa non vuota
-- (assegna Rocky al Parco delle Rimembranze, Luna all'Area Bau)
insert into checkins (dog_id, area_id, active)
select d.id, a.id, true
from dogs d, dog_areas a
where d.name = 'Rocky' and a.name = 'Parco delle Rimembranze'
on conflict do nothing;

insert into checkins (dog_id, area_id, active)
select d.id, a.id, true
from dogs d, dog_areas a
where d.name = 'Luna' and a.name = 'Area Bau Navigli'
on conflict do nothing;

insert into checkins (dog_id, area_id, active)
select d.id, a.id, true
from dogs d, dog_areas a
where d.name = 'Maya' and a.name = 'Parco Sempione'
on conflict do nothing;

select 'Cani demo e check-in creati con successo! 🐾' as status;
