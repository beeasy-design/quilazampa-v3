-- ============================================================
-- QUILAZAMPA! - SQL COMPLETO v3
-- Esegui TUTTO questo in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. NUOVE TABELLE (events, event_participants, adoption_dogs)
-- ============================================================

create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  date timestamp with time zone not null,
  location text,
  description text,
  max_participants integer default 20,
  participants_count integer default 0,
  emoji text default '🐾',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

create table if not exists event_participants (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(event_id, user_id)
);

create table if not exists adoption_dogs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  breed text,
  age integer,
  gender text default 'M',
  size text default 'Media',
  city text,
  description text,
  trait text,
  contact text,
  emoji text default '🐕',
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- RLS per nuove tabelle
alter table events enable row level security;
alter table event_participants enable row level security;
alter table adoption_dogs enable row level security;

drop policy if exists "Tutti vedono eventi" on events;
drop policy if exists "Utenti creano eventi" on events;
drop policy if exists "Utenti eliminano propri eventi" on events;
drop policy if exists "Tutti vedono partecipanti" on event_participants;
drop policy if exists "Utenti gestiscono propria partecipazione" on event_participants;
drop policy if exists "Tutti vedono adozioni" on adoption_dogs;
drop policy if exists "Utenti aggiungono adozioni" on adoption_dogs;
drop policy if exists "Utenti eliminano proprie adozioni" on adoption_dogs;

create policy "Tutti vedono eventi" on events for select using (true);
create policy "Utenti creano eventi" on events for insert with check (auth.uid() = created_by);
create policy "Utenti eliminano propri eventi" on events for delete using (auth.uid() = created_by);
create policy "Tutti vedono partecipanti" on event_participants for select using (true);
create policy "Utenti gestiscono propria partecipazione" on event_participants for all using (auth.uid() = user_id);
create policy "Tutti vedono adozioni" on adoption_dogs for select using (true);
create policy "Utenti aggiungono adozioni" on adoption_dogs for insert with check (auth.uid() = added_by);
create policy "Utenti eliminano proprie adozioni" on adoption_dogs for delete using (auth.uid() = added_by);
create policy "Admin gestisce tutto events" on events for all using (true);
create policy "Admin gestisce adoption" on adoption_dogs for all using (true);

-- 2. AGGIORNA AREE CANI (sostituisce quelle esistenti con Milano)
-- ============================================================
delete from checkins;
delete from dog_areas;

insert into dog_areas (name, lat, lng, fenced, city) values
  ('Parco delle Rimembranze',   45.4654, 9.1859, true,  'Milano'),
  ('Parco Sempione',            45.4741, 9.1772, false, 'Milano'),
  ('Area Bau Navigli',          45.4523, 9.1765, true,  'Milano'),
  ('Giardini Indro Montanelli', 45.4727, 9.2012, true,  'Milano'),
  ('Dog Park Porta Romana',     45.4534, 9.2001, true,  'Milano'),
  ('Parco Nord Milano',         45.5230, 9.1890, false, 'Milano'),
  ('Area Cani Lambrate',        45.4820, 9.2340, true,  'Milano'),
  ('Giardini di Porta Venezia', 45.4762, 9.2034, false, 'Milano');

-- 3. EVENTI FITTIZI
-- ============================================================
delete from event_participants;
delete from events;

insert into events (title, date, location, description, max_participants, participants_count, emoji) values
  ('Passeggiata mattutina al Parco Sempione',
   now() + interval '2 days' + interval '8 hours 30 minutes',
   'Parco Sempione, Milano',
   'Passeggiata rilassante per cani di tutte le taglie. Portate acqua per i vostri amici!',
   25, 14, '🌅'),
  ('Raduno cuccioli sotto i 6 mesi',
   now() + interval '3 days' + interval '10 hours',
   'Area Bau Navigli, Milano',
   'Socializzazione guidata per cuccioli. Ambiente sicuro e controllato.',
   15, 8, '🐶'),
  ('Aperitivo dog-friendly in centro',
   now() + interval '8 days' + interval '18 hours 30 minutes',
   'Bar Navigli, Via Corsico 5',
   'Aperitivo con i nostri amici a 4 zampe. Il locale è pet-friendly!',
   30, 22, '🍹'),
  ('Corso base di educazione cinofila',
   now() + interval '10 days' + interval '9 hours',
   'Giardini Indro Montanelli',
   'Lezione gratuita con educatore certificato. Posti limitati, prenotarsi in anticipo.',
   12, 6, '🎓'),
  ('Giornata adozioni con il Canile Metropolitano',
   now() + interval '14 days' + interval '10 hours',
   'Parco Nord Milano',
   'Incontro con i cani del canile in cerca di famiglia. Portate tanta pazienza e amore!',
   50, 31, '❤️'),
  ('Gara di frisbee per cani',
   now() + interval '20 days' + interval '15 hours',
   'Parco delle Rimembranze',
   'Competizione amichevole di frisbee! Premi per i partecipanti.',
   40, 18, '🏆');

-- 4. CANI IN ADOZIONE FITTIZI
-- ============================================================
delete from adoption_dogs;

insert into adoption_dogs (name, breed, age, gender, size, city, description, trait, contact, emoji) values
  ('Luna', 'Border Collie', 2, 'F', 'Media', 'Milano (MI)',
   'Luna è arrivata al canile dopo essere stata trovata sola in autostrada. È dolcissima con le persone e ama giocare con la palla. Cerca una famiglia attiva.',
   'Socievole', 'canile.milano@email.it', '🐶'),
  ('Rocky', 'Labrador', 1, 'M', 'Grande', 'Torino (TO)',
   'Rocky è un cucciolo esuberante pieno di energia. Ha bisogno di spazio e tanta attività fisica. Ottimo con i bambini.',
   'Energico', 'rifugio.torino@email.it', '🐕'),
  ('Pongo', 'Dalmata', 4, 'M', 'Grande', 'Firenze (FI)',
   'Pongo è stato abbandonato dal suo proprietario. È già addestrato ai comandi base e convive bene con altri cani.',
   'Buon compagno', '+39 055 123456', '🐩'),
  ('Mia', 'Meticcio', 3, 'F', 'Piccola', 'Bologna (BO)',
   'Mia è una cagnolina tranquilla e affettuosa. Si adatta bene anche ad appartamenti piccoli. Ama stare sul divano.',
   'Tranquilla', 'adozioni.bologna@email.it', '🐕‍🦺'),
  ('Birillo', 'Beagle', 5, 'M', 'Media', 'Roma (RM)',
   'Birillo è un beagle allegro e curioso. Adora annusare tutto e fare lunghe passeggiate. Ottimo con i bambini.',
   'Curioso', 'canile.roma@email.it', '🦮'),
  ('Stella', 'Golden Retriever', 6, 'F', 'Grande', 'Napoli (NA)',
   'Stella è stata restituita al canile perché il proprietario si è trasferito all\'estero. È già adulta, addestrata e dolcissima.',
   'Dolce', '+39 081 789012', '🐕'),
  ('Thor', 'Husky', 2, 'M', 'Grande', 'Venezia (VE)',
   'Thor è stato trovato vagante. Ha bisogno di molto movimento e un giardino. Carattere forte ma leale.',
   'Indipendente', 'rifugio.venezia@email.it', '🐶'),
  ('Cleo', 'Bassotto', 7, 'F', 'Piccola', 'Genova (GE)',
   'Cleo è anziana e cerca una casa tranquilla dove poter trascorrere i suoi ultimi anni in serenità.',
   'Dolce', 'canile.genova@email.it', '🐩');

-- 5. TRIGGER PER CREAZIONE PROFILO AUTOMATICA (aggiornato)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, city)
  values (new.id, split_part(new.email, '@', 1), '')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. FIX FOREIGN KEY per dogs (punta a auth.users direttamente)
-- ============================================================
alter table dogs drop constraint if exists dogs_owner_id_fkey;
alter table dogs add constraint dogs_owner_id_fkey
  foreign key (owner_id) references auth.users(id) on delete cascade;

-- ============================================================
-- ISTRUZIONI ACCOUNT ADMIN E DEMO:
-- 
-- Vai su Supabase → Authentication → Users → Add user
-- Crea questi 2 utenti (Enable "Auto Confirm User"):
--
-- Email: admin@quilazampa.it  Password: admin123!
-- Email: marco@demo.it        Password: demo123!
-- Email: giulia@demo.it       Password: demo123!
-- Email: sofia@demo.it        Password: demo123!
--
-- Poi torna qui e lancia questo SQL per creare i loro cani demo:
-- (vedi STEP 7 sotto - eseguilo DOPO aver creato gli utenti)
-- ============================================================

select 'Setup completato! Ora crea gli utenti demo in Authentication → Users' as status;
