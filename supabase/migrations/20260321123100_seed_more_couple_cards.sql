-- Seed MORE couple-focused data for Cards table
-- These add to the existing cards with highly interactive, fun, and vibe-specific challenges.

INSERT INTO public.cards (text, type, points, timer) VALUES
-- FUN (Silly, goofy, interactive)
('Let me try to draw a portrait of you in 60 seconds. Hold still! 🎨', 'fun', 1, 60),
('Try to beatbox while I rap the alphabet. Don''t stop until we finish! 🎤', 'fun', 1, 60),
('Do an impression of me trying to flirt with you for the first time. 😂', 'fun', 1, NULL),
('Let me go through your Instagram explore page for 1 minute and judge your algorithm. 📱🕵️', 'fun', 1, 60),
('Speak entirely in questions for the next 2 minutes? Can you do that? ❓', 'fun', 1, 120),
('Do a dramatic reading of a random Wikipedia article like it''s a thrilling novel. 📖🎭', 'fun', 1, 60),
('Try to make me laugh without smiling or laughing yourself. 😐😂', 'fun', 1, 30),
('Give me a piggyback ride (or try to pick me up) for 10 seconds! 🏋️‍♂️', 'fun', 1, 10),

-- ROMANTIC (Deep, emotional, bonding)
('Look into my eyes and tell me one thing you admire about my personality that you rarely mention. ✨', 'romantic', 1, NULL),
('Re-enact how you asked me out (or how we first started talking) with maximum drama. 🎬💖', 'romantic', 1, NULL),
('Give me a slow, 30-second hug without saying a single word. 🤗', 'romantic', 1, 30),
('Tell me which song makes you think of me every time you hear it, and play 20 seconds of it. 🎵', 'romantic', 1, NULL),
('Hold both my hands and describe your perfect future weekend with me. 🏡🌅', 'romantic', 1, NULL),
('Tell me about the exact moment you realized you felt completely safe with me. 🛡️❤️', 'romantic', 1, NULL),
('Kiss me on the forehead and tell me one thing you are proud of me for. 🥺💋', 'romantic', 1, NULL),
('Share a memory of us that always instantly puts a smile on your face. 📸🥰', 'romantic', 1, NULL),

-- SPICY (Sensual, physical, teasing)
('Whisper a secret fantasy you have about me right into my ear. 🤫🔥', 'spicy', 2, NULL),
('Blindfold me and trace a letter on my chest or back. If I guess wrong, you get to tease me. 🔠👀', 'spicy', 2, NULL),
('Give me a passionate kiss but you are not allowed to use your hands at all. 🚫👐💋', 'spicy', 2, 15),
('Tell me exactly what you would do if I pinned you against the wall right now. 🧱🥵', 'spicy', 2, NULL),
('Take my hand and guide it to your favorite place to be touched. ✨✋', 'spicy', 2, NULL),
('Slowly untie or unbutton one piece of my clothing using only one hand. 👔😏', 'spicy', 2, NULL),
('Describe your favorite physical feature of mine and kiss it. 🎯💋', 'spicy', 2, NULL),
('Sit on my lap (or pull me onto yours) for the remainder of this turn. 🪑🔥', 'spicy', 2, NULL),

-- LDR (Long distance, virtual closeness)
('Send me a voice note of your heartbeat right now. (Hold the mic to your chest!) 🫀🎙️', 'ldr', 1, NULL),
('Order us both a small coffee/tea delivery right now so we can drink it "together". ☕🛵', 'ldr', 1, NULL),
('Screen share and show me the oldest photo of us you have saved on your phone. 📱🔙', 'ldr', 1, NULL),
('Close your eyes, pretend my hand is on your cheek, and tell me how it feels. 😌✋', 'ldr', 1, NULL),
('Change your phone wallpaper to a picture of me for the next 24 hours. 🖼️📱', 'ldr', 1, NULL),
('Send me a 10-second video of you doing a silly happy dance just for me! 💃🕺', 'ldr', 1, NULL),
('Leave your phone on the pillow next to you tonight so I can hear you sleep. 🛌🌙', 'ldr', 1, NULL),
('Write a short love note on a piece of paper, take a picture, and send it to me. ✍️💌', 'ldr', 1, NULL);
