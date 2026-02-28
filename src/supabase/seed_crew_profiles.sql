-- ============================================================
-- Seed: 24 fake crew profiles for development
--
-- Creates auth.users rows first (required by FK), then profiles.
-- All IDs use the 00000000-0000-0000-0000-0000000000XX pattern
-- so they're trivially identifiable.
--
-- To remove (run in order):
--   DELETE FROM profiles WHERE id LIKE '00000000-0000-0000-0000-%';
--   DELETE FROM auth.users WHERE id LIKE '00000000-0000-0000-0000-%';
-- ============================================================

-- ── Step 1: Create auth.users stubs ───────────────────────

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id, aud, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'sarah.chen@fake.dev',       crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', 'james.okonkwo@fake.dev',    crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', 'nina.petrova@fake.dev',     crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000004', 'tommy.nakamura@fake.dev',   crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000005', 'amelie.durand@fake.dev',    crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000006', 'marcus.wright@fake.dev',    crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000007', 'priya.sharma@fake.dev',     crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000008', 'liam.gallagher@fake.dev',   crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000009', 'olivia.barnes@fake.dev',    crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000010', 'ryan.murphy@fake.dev',      crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000011', 'zara.ahmed@fake.dev',       crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000012', 'daniel.kim@fake.dev',       crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000013', 'freya.wilson@fake.dev',     crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000014', 'alex.trevino@fake.dev',     crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000015', 'hannah.cole@fake.dev',      crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000016', 'ben.osei@fake.dev',         crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000017', 'chloe.martin@fake.dev',     crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000018', 'jack.reed@fake.dev',        crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000019', 'mia.johnson@fake.dev',      crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000020', 'owen.evans@fake.dev',       crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000021', 'isla.campbell@fake.dev',    crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000022', 'sam.taylor@fake.dev',       crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000023', 'emma.li@fake.dev',          crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000024', 'david.kowalski@fake.dev',   crypt('seedpass', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Also need identities for Supabase auth to consider them valid
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT id, id, email, 'email', jsonb_build_object('sub', id, 'email', email), now(), now(), now()
FROM auth.users
WHERE id LIKE '00000000-0000-0000-0000-%'
ON CONFLICT DO NOTHING;

-- ── Step 2: Create profiles (trigger may have already made empty ones) ──

INSERT INTO profiles (
  id, email, username, display_name, bio, position,
  location, country, experience_years, availability_status,
  skills, has_completed_setup, profile_image_url
) VALUES
-- ── Available ─────────────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000001',
  'sarah.chen@fake.dev', 'sarahchen', 'Sarah Chen',
  'Award-winning cinematographer with a passion for natural light and handheld work. Loves shooting on location.',
  'Cinematographer', 'London', 'United Kingdom', 10, 'available',
  ARRAY['Cinematography', 'Camera Operation', 'Lighting', 'Steadicam', 'Drone Operation'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000002',
  'james.okonkwo@fake.dev', 'jamesokonkwo', 'James Okonkwo',
  'Editor specialising in documentary and narrative features. Avid and DaVinci Resolve certified.',
  'Editor', 'Manchester', 'United Kingdom', 7, 'available',
  ARRAY['Editing', 'Color Grading', 'Sound Design'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000003',
  'nina.petrova@fake.dev', 'ninapetrova', 'Nina Petrova',
  'Production designer creating immersive worlds on any budget. Theatre background.',
  'Production Designer', 'Bristol', 'United Kingdom', 5, 'available',
  ARRAY['Production Design', 'Art Direction', 'Set Design', 'Set Decoration', 'Props'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000004',
  'tommy.nakamura@fake.dev', 'tommynak', 'Tommy Nakamura',
  'Sound mixer and designer. Location and studio work. Own kit.',
  'Sound Mixer', 'Edinburgh', 'United Kingdom', 6, 'available',
  ARRAY['Sound Design', 'Sound Mixing', 'Boom Operation', 'ADR', 'Foley'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000005',
  'amelie.durand@fake.dev', 'ameliedurand', 'Amélie Durand',
  'French-British director working across short film, music video, and commercial.',
  'Director', 'London', 'United Kingdom', 4, 'available',
  ARRAY['Directing', 'Screenwriting', 'Story Development', 'Casting'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000006',
  'marcus.wright@fake.dev', 'marcuswright', 'Marcus Wright',
  'Gaffer with 15 years in the industry. Experienced in large-scale studio and location setups.',
  'Gaffer', 'Birmingham', 'United Kingdom', 15, 'available',
  ARRAY['Lighting', 'Gaffer', 'Grip'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000007',
  'priya.sharma@fake.dev', 'priyasharma', 'Priya Sharma',
  'Costume designer for period drama and contemporary film. BAFTA Craft nominated.',
  'Costume Designer', 'London', 'United Kingdom', 10, 'available',
  ARRAY['Costume Design', 'Wardrobe', 'Hair & Makeup'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000008',
  'liam.gallagher@fake.dev', 'liamgfilm', 'Liam Gallagher',
  'Camera operator and steadicam specialist. Comfortable on set or in the field.',
  'Camera Operator', 'Leeds', 'United Kingdom', 3, 'available',
  ARRAY['Camera Operation', 'Steadicam', 'Drone Operation', 'Cinematography'],
  true, NULL
),

-- ── Busy ──────────────────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000009',
  'olivia.barnes@fake.dev', 'oliviabarnes', 'Olivia Barnes',
  'VFX artist working across indie features and high-end TV. Nuke and Houdini.',
  'VFX Artist', 'London', 'United Kingdom', 6, 'busy',
  ARRAY['VFX', 'Compositing', 'Rotoscoping', 'Motion Graphics'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000010',
  'ryan.murphy@fake.dev', 'ryanmurphy', 'Ryan Murphy',
  'Producer focused on independent features. Strong track record with BFI and Film4 funding.',
  'Producer', 'London', 'United Kingdom', 10, 'busy',
  ARRAY['Producing', 'Line Producing', 'Production Management'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000011',
  'zara.ahmed@fake.dev', 'zaraahmed', 'Zara Ahmed',
  'Screenwriter and script editor. Specialises in thriller and drama.',
  'Writer', 'Glasgow', 'United Kingdom', 5, 'busy',
  ARRAY['Screenwriting', 'Script Editing', 'Story Development'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000012',
  'daniel.kim@fake.dev', 'danielkim', 'Daniel Kim',
  'Composer scoring for film, TV, and games. Orchestral and electronic.',
  'Composer', 'Cardiff', 'United Kingdom', 7, 'busy',
  ARRAY['Music Composition', 'Music Supervision', 'Sound Design'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000013',
  'freya.wilson@fake.dev', 'freyawilson', 'Freya Wilson',
  'First AD keeping sets running smoothly. Experienced in features, TV, and commercials.',
  '1st AD', 'Manchester', 'United Kingdom', 6, 'busy',
  ARRAY['Assistant Directing', 'Production Management', 'Script Supervision'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000014',
  'alex.trevino@fake.dev', 'alextrevino', 'Alex Trevino',
  'Colorist grading narrative and commercial projects. DaVinci Resolve specialist.',
  'Colorist', 'Soho, London', 'United Kingdom', 4, 'busy',
  ARRAY['Color Grading', 'Editing', 'DIT'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000015',
  'hannah.cole@fake.dev', 'hannahcole', 'Hannah Cole',
  'Location manager with deep knowledge of UK filming locations and permits.',
  'Location Manager', 'Oxford', 'United Kingdom', 5, 'busy',
  ARRAY['Location Scouting', 'Production Management'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000016',
  'ben.osei@fake.dev', 'benosei', 'Ben Osei',
  'Motion graphics artist and animator. After Effects, Cinema 4D, Blender.',
  'Motion Graphics Artist', 'Brighton', 'United Kingdom', 3, 'busy',
  ARRAY['Motion Graphics', 'VFX', 'Compositing', 'Editing'],
  true, NULL
),

-- ── Not looking ───────────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000017',
  'chloe.martin@fake.dev', 'chloemartin', 'Chloé Martin',
  'Actor and voice artist. Stage and screen. Represented by Curtis Brown.',
  'Actor', 'London', 'United Kingdom', 7, 'not_looking',
  ARRAY['Acting', 'Voice Acting', 'Choreography'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000018',
  'jack.reed@fake.dev', 'jackreed', 'Jack Reed',
  'Stunt coordinator specialising in fight choreography and wirework.',
  'Stunt Coordinator', 'London', 'United Kingdom', 10, 'not_looking',
  ARRAY['Stunt Coordination', 'Choreography'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000019',
  'mia.johnson@fake.dev', 'miajohnson', 'Mia Johnson',
  'SFX makeup artist. Prosthetics, ageing, wounds, creature work.',
  'SFX Makeup Artist', 'Pinewood', 'United Kingdom', 6, 'not_looking',
  ARRAY['SFX Makeup', 'Hair & Makeup', 'Costume Design'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000020',
  'owen.evans@fake.dev', 'owenevans', 'Owen Evans',
  'DIT and data wrangler. On-set colour and workflow management.',
  'DIT', 'Cardiff', 'United Kingdom', 4, 'not_looking',
  ARRAY['DIT', 'Color Grading', 'Camera Operation'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000021',
  'isla.campbell@fake.dev', 'islacampbell', 'Isla Campbell',
  'Casting director working across film, TV, and theatre in Scotland and beyond.',
  'Casting Director', 'Edinburgh', 'United Kingdom', 5, 'not_looking',
  ARRAY['Casting', 'Acting', 'Story Development'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000022',
  'sam.taylor@fake.dev', 'samtaylor', 'Sam Taylor',
  'Grip and rigging specialist. Own vehicle and full kit.',
  'Grip', 'Liverpool', 'United Kingdom', 3, 'not_looking',
  ARRAY['Grip', 'Gaffer', 'Lighting'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000023',
  'emma.li@fake.dev', 'emmali', 'Emma Li',
  'Unit photographer capturing stills on feature films and TV dramas.',
  'Unit Photographer', 'London', 'United Kingdom', 4, 'not_looking',
  ARRAY['Unit Photography', 'Cinematography'],
  true, NULL
),
(
  '00000000-0000-0000-0000-000000000024',
  'david.kowalski@fake.dev', 'davidkowalski', 'David Kowalski',
  'Line producer managing budgets from micro to mid-range. Strong BBC and Channel 4 relationships.',
  'Line Producer', 'Bristol', 'United Kingdom', 10, 'not_looking',
  ARRAY['Line Producing', 'Producing', 'Production Management'],
  true, NULL
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  position = EXCLUDED.position,
  location = EXCLUDED.location,
  country = EXCLUDED.country,
  experience_years = EXCLUDED.experience_years,
  availability_status = EXCLUDED.availability_status,
  skills = EXCLUDED.skills,
  has_completed_setup = EXCLUDED.has_completed_setup;