-- Durée cible par section (en secondes), renseignée par la génération de plan IA
-- et modifiable ensuite. NULL = pas de cible définie. Les grants table-level de
-- talk_sections couvrent la nouvelle colonne (pas de grant par colonne ici,
-- contrairement à profiles — cf. incident du 07/07).
alter table public.talk_sections
  add column if not exists target_duration_sec integer
  check (target_duration_sec is null or target_duration_sec > 0);
