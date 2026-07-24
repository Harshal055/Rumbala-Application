-- Add intensity column to cards
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS intensity integer DEFAULT 1 CHECK (intensity >= 1 AND intensity <= 3);

-- INTENSITY LEVELS (only used for Spicy cards on the Home page):
-- 1 = Seductive 😏 (Teasing, eye contact, whispering, light flirting)
-- 2 = Steamy 🔥 (Kissing, touching, stripping one piece, biting)
-- 3 = Extreme 🥵 (Highly sexual, positions, explicit fantasy, deep physical)

-- All Fun cards = intensity 1 (always shown as-is, intensity ignored for fun)
UPDATE public.cards SET intensity = 1 WHERE type = 'fun';

-- All Romantic cards = intensity 1 (always shown as-is, intensity ignored for romantic)
UPDATE public.cards SET intensity = 1 WHERE type = 'romantic';

-- All LDR cards = intensity 1 (always shown as-is, intensity ignored for ldr)
UPDATE public.cards SET intensity = 1 WHERE type = 'ldr';

-- SPICY CARDS: Start at Seductive (1) by default
UPDATE public.cards SET intensity = 1 WHERE type = 'spicy';

-- SPICY Level 2 — Steamy: Physical kissing, touching, biting, light stripping
UPDATE public.cards 
SET intensity = 2 
WHERE type = 'spicy' AND (
      text ILIKE '%kiss%'
   OR text ILIKE '%bite%'
   OR text ILIKE '%lip%'
   OR text ILIKE '%neck%'
   OR text ILIKE '%massage%'
   OR text ILIKE '%back rub%'
   OR text ILIKE '%lap%'
   OR text ILIKE '%take off%'
   OR text ILIKE '%clothing%'
   OR text ILIKE '%unbutton%'
   OR text ILIKE '%unzip%'
   OR text ILIKE '%teeth%'
   OR text ILIKE '%earlobe%'
   OR text ILIKE '%collarbone%'
   OR text ILIKE '%wet kiss%'
);

-- SPICY Level 3 — Extreme: Blindfolds, straddling, thighs, explicit fantasies, positions
UPDATE public.cards 
SET intensity = 3 
WHERE type = 'spicy' AND (
      text ILIKE '%blindfold%'
   OR text ILIKE '%straddling%'
   OR text ILIKE '%inner thighs%'
   OR text ILIKE '%thigh%'
   OR text ILIKE '%tongue%'
   OR text ILIKE '%pinned%'
   OR text ILIKE '%pin you%'
   OR text ILIKE '%barely touching%'
   OR text ILIKE '%tease my lips%'
   OR text ILIKE '%fantasy%'
   OR text ILIKE '%position%'
   OR text ILIKE '%bedroom voice%'
   OR text ILIKE '%dirtiest thought%'
   OR text ILIKE '%favorite place to be touched%'
   OR text ILIKE '%sensitive spot%'
   OR text ILIKE '%sexiest piece%'
   OR text ILIKE '%explicit%'
   OR text ILIKE '%risky text%'
   OR text ILIKE '%tonight%'
   OR text ILIKE '%privacy%'
   OR text ILIKE '%touch you%'
   OR text ILIKE '%touch me%'
   OR text ILIKE '%want me to do%'
);
