export type CardType = 'fun' | 'romantic' | 'spicy' | 'ldr';

export interface DareCard {
  id: string;
  type: CardType;
  vibe?: CardType; // Sub-category (e.g. for LDR cards: fun, romantic, spicy)
  text: string;
  timer?: number; // Optional timer in seconds for timed dares
}

export const CARDS: DareCard[] = [
  // --- FUN ---
  { id: 'f1', type: 'fun', text: 'Do your best impression of me when I am angry.', timer: 30 },
  { id: 'f2', type: 'fun', text: 'Speak in a weird accent for the next 2 rounds.' },
  { id: 'f3', type: 'fun', text: 'Let your partner style your hair in the funniest way possible.', timer: 60 },
  { id: 'f4', type: 'fun', text: 'Dance without music for 30 seconds.', timer: 30 },
  { id: 'f5', type: 'fun', text: 'Read the last text you sent to your best friend out loud.' },
  { id: 'f6', type: 'fun', text: 'Try to lick your elbow.', timer: 15 },
  { id: 'f7', type: 'fun', text: 'Talk without closing your mouth for the next round.' },
  { id: 'f8', type: 'fun', text: 'Post a weird status on WhatsApp for 10 minutes.', timer: 600 },

  // --- ROMANTIC ---
  { id: 'r1', type: 'romantic', text: 'Share the exact moment you realized you liked me.' },
  { id: 'r2', type: 'romantic', text: 'Give me a 1-minute foot or hand massage.', timer: 60 },
  { id: 'r3', type: 'romantic', text: 'Describe my best physical feature in loving detail.' },
  { id: 'r4', type: 'romantic', text: 'Stare into my eyes without blinking for 30 seconds.', timer: 30 },
  { id: 'r5', type: 'romantic', text: 'Sing a romantic song for me.' },
  { id: 'r6', type: 'romantic', text: 'Tell me about a dream you had about us.' },
  { id: 'r7', type: 'romantic', text: 'Recreate our first hug or kiss.' },
  { id: 'r8', type: 'romantic', text: 'Write a quick 4-line poem about me.', timer: 120 },

  // --- SPICY ---
  { id: 's1', type: 'spicy', text: 'Kiss me on the neck.' },
  { id: 's2', type: 'spicy', text: 'Whisper your deepest fantasy into my ear.' },
  { id: 's3', type: 'spicy', text: 'Take off one piece of clothing.' },
  { id: 's4', type: 'spicy', text: 'Give me a passionate kiss for 10 seconds.', timer: 10 },
  { id: 's5', type: 'spicy', text: 'Let me blindfold you and feed you something sweet.' },
  { id: 's6', type: 'spicy', text: 'Trace my lips with your fingers.' },
  { id: 's7', type: 'spicy', text: 'Tell me the hottest thing I wear.' },
  { id: 's8', type: 'spicy', text: 'Give me a sensuous 2-minute back rub.', timer: 120 },

  // --- LDR ---
  { id: 'l1', type: 'ldr', vibe: 'spicy', text: 'Send me a voice note saying "I love you" in the sexiest voice.' },
  { id: 'l2', type: 'ldr', vibe: 'fun', text: 'Send me a picture of the exact clothes you are wearing right now.' },
  { id: 'l3', type: 'ldr', vibe: 'romantic', text: 'Blow me a kiss through the screen.' },
  { id: 'l4', type: 'ldr', vibe: 'romantic', text: 'Order a small dessert for me right now!' },
  { id: 'l5', type: 'ldr', vibe: 'romantic', text: 'Keep the video call completely silent for 1 minute while we just look at each other.', timer: 60 },
  { id: 'l6', type: 'ldr', vibe: 'spicy', text: 'Describe what we would be doing right now if we were together.' },

  // Fun (9-16)
  { id: '9', type: 'fun', text: 'Pretend to be a gym bro explaining why I desperately need to hit my protein goal today 🍗💪', timer: 45 },
  { id: '10', type: 'fun', text: 'Act out a dramatic, slow-motion death scene from your favorite game right now 🎮💀' },
  { id: '11', type: 'fun', text: 'Explain a complex coding bug to me using only cheesy romantic pickup lines 💻❤️', timer: 60 },
  { id: '12', type: 'fun', text: 'Do your absolute best impression of someone aggressively haggling for clothes 🛍️😂' },
  { id: '13', type: 'fun', text: 'Try to lick your elbow while maintaining intense eye contact with me 👀👅', timer: 15 },
  { id: '14', type: 'fun', text: 'Speak entirely in rhymes for the next 2 minutes 🎤🎶', timer: 120 },
  { id: '15', type: 'fun', text: 'Show me the last meme you saved on your phone without giving any context 📱🤡' },
  { id: '16', type: 'fun', text: 'Balance your phone on your head and walk across the room without dropping it 🚶‍♂️📱' },

  // Romantic (17-23)
  { id: '17', type: 'romantic', text: 'Send me a playlist of 3 songs that instantly remind you of me 🎵🥺' },
  { id: '18', type: 'romantic', text: 'Tell me the exact moment you realized you had feelings for me ✨💖' },
  { id: '19', type: 'romantic', text: 'Write a quick 4-line poem about my smile right now ✍️😊', timer: 60 },
  { id: '20', type: 'romantic', text: 'Name a small, random habit of mine that you absolutely adore 🕵️‍♀️💘' },
  { id: '21', type: 'romantic', text: 'Stare into my eyes (or my photo) for 30 seconds without saying a word 👁️❤️', timer: 30 },
  { id: '22', type: 'romantic', text: 'Tell me about a dream you had about us that you never shared 🌙💭' },
  { id: '23', type: 'romantic', text: 'Plan out our dream vacation itinerary in 3 sentences ✈️🏝️' },

  // Spicy (24-30)
  { id: '24', type: 'spicy', text: 'Describe exactly what you’d do if we were alone in a locked elevator right now 🛗🔥' },
  { id: '25', type: 'spicy', text: 'Send a voice note whispering your favorite physical feature of mine 🤫💦', timer: 20 },
  { id: '26', type: 'spicy', text: 'Rate your current thoughts about me from 1-10 on the spicy scale 🌶️🥵' },
  { id: '27', type: 'spicy', text: 'Tell me the most adventurous place you’d want to make out with me 🗺️💋' },
  { id: '28', type: 'spicy', text: 'Show me the outfit you’d wear if you wanted to guarantee I couldn’t keep my hands off you 👗👔🔥' },
  { id: '29', type: 'spicy', text: 'Describe the way you want me to touch you right now without using any banned words 🤐✨' },
  { id: '30', type: 'spicy', text: 'Send the most suggestive emoji combo you can think of and let me guess what it means 🍆🍑💦' },

  // LDR (31-38)
  { id: '31', type: 'ldr', vibe: 'romantic', text: 'Order me a surprise little dessert right now 🍰🛵' },
  { id: '32', type: 'ldr', vibe: 'fun', text: 'Show me the exact view from your window right this second 🪟🏙️' },
  { id: '33', type: 'ldr', vibe: 'romantic', text: 'Take a picture of the exact spot where you wish I was sitting right now 🪑👻' },
  { id: '34', type: 'ldr', vibe: 'spicy', text: 'Voice note: Tell me how you would wake me up if we were in the same bed tomorrow morning 🛌🌅' },
  { id: '35', type: 'ldr', vibe: 'fun', text: 'Send a quick video spinning around in your room so I can feel like I’m there 🌀📱' },
  { id: '36', type: 'ldr', vibe: 'spicy', text: 'Write my name somewhere on your body with a pen and send a pic 🖊️📸' },
  { id: '37', type: 'ldr', vibe: 'romantic', text: 'Find an item in your room that reminds you of me and explain why 🧸💭' },
  { id: '38', type: 'ldr', vibe: 'fun', text: 'Record a 10-second video pretending you are giving me a massive hug 🤗🫂' },

  // Fun (39-53)
  { id: '39', type: 'fun', text: 'Sing a song loudly but replace every key word with "Paneer" 🧀🎤', timer: 30 },
  { id: '40', type: 'fun', text: 'Explain how to build a custom PC, but make the motherboard and SSD sound like two star-crossed lovers 🖥️❤️', timer: 60 },
  { id: '41', type: 'fun', text: 'Do your best impression of a strict parent catching us holding hands in public 😡😂' },
  { id: '42', type: 'fun', text: 'Let me give you a silly new nickname and you have to respond to it for the next 24 hours 🤪' },
  { id: '43', type: 'fun', text: 'Pretend your smartphone is a walkie-talkie and report a "romantic emergency" to headquarters 👮‍♂️', timer: 45 },
  { id: '44', type: 'fun', text: 'Do 10 squats while singing a popular song at the top of your lungs 💃🍑' },
  { id: '45', type: 'fun', text: 'Talk without opening your teeth for the next 2 minutes 🤐⏱️', timer: 120 },
  { id: '46', type: 'fun', text: 'Put an ice cube down your shirt and try to maintain a totally straight face 🧊😐', timer: 30 },
  { id: '47', type: 'fun', text: 'Let me pick a random emoji to put on your WhatsApp status for the next hour 📱🤷‍♂️' },
  { id: '48', type: 'fun', text: 'Put your shirt on inside out for the rest of our conversation 👕🙃' },
  { id: '49', type: 'fun', text: 'Try to lick your own nose while winking at me 👅👃😉', timer: 15 },
  { id: '50', type: 'fun', text: 'Pitch me a terrible idea for a mobile app like you are on Shark Tank 🦈📱', timer: 60 },
  { id: '51', type: 'fun', text: 'Pretend you are an influencer doing a grand tour of your extremely messy room 🤳🗑️' },
  { id: '52', type: 'fun', text: 'Do a dramatic, soap-opera reading of the last text message you received 📖😂' },
  { id: '53', type: 'fun', text: 'Speak only in a robotic voice for the next 3 minutes 🤖⏱️', timer: 180 },

  // Romantic (54-68)
  { id: '54', type: 'romantic', text: 'Describe our relationship using only 3 movie titles 🍿❤️' },
  { id: '55', type: 'romantic', text: 'Tell me the exact moment you knew you had fallen for me 🥰✨' },
  { id: '56', type: 'romantic', text: 'Plan a dream motorcycle trip for us, including where we stop for tea 🏍️☕' },
  { id: '57', type: 'romantic', text: 'Write my name on your wrist with a pen and keep it there all day 🖊️💕' },
  { id: '58', type: 'romantic', text: 'Serenade me with a romantic song for 30 seconds, no matter how bad your voice is 🎶🎤', timer: 30 },
  { id: '59', type: 'romantic', text: 'Tell me your absolute favorite physical feature of mine and blow a kiss to it 😘' },
  { id: '60', type: 'romantic', text: 'Describe what a perfect lazy Sunday morning looks like with me 🏡☕' },
  { id: '61', type: 'romantic', text: 'Stare into my eyes (or my photo) without blinking or smiling for 60 seconds 👀⏱️', timer: 60 },
  { id: '62', type: 'romantic', text: 'Give me a 5-minute virtual massage by describing exactly how you would do it 💆‍♂️💆‍♀️' },
  { id: '63', type: 'romantic', text: 'Recreate the pose from the first picture we ever took together 📸🔄' },
  { id: '64', type: 'romantic', text: 'Tell me a tiny, adorable secret you’ve never told anyone else before 🤫❤️' },
  { id: '65', type: 'romantic', text: 'Make a list of 5 things you appreciate most about me and read it aloud with full emotion 📜🥺' },
  { id: '66', type: 'romantic', text: 'Tell me the story of our first date purely from your perspective 📖🌹' },
  { id: '67', type: 'romantic', text: 'Dedicate a classic romantic movie dialogue to me right now 🎬💘' },
  { id: '68', type: 'romantic', text: 'Hold your hand up to the screen and tell me why I am your favorite person 🤝💖' },

  // Spicy (69-83)
  { id: '69', type: 'spicy', text: 'Tell me your biggest turn-on that you’ve never fully confessed before 🤫🔥' },
  { id: '70', type: 'spicy', text: 'Describe exactly what you would do if I was wearing your favorite outfit right now 👗🥵', timer: 60 },
  { id: '71', type: 'spicy', text: 'Send a voice note of your best "bedroom voice" whispering my name 🎙️💦' },
  { id: '72', type: 'spicy', text: 'Tell me the dirtiest thought you’ve had about us while at the gym 🏋️‍♂️😈' },
  { id: '73', type: 'spicy', text: 'Send a picture of you biting your lip while looking right at the camera 🫦📸' },
  { id: '74', type: 'spicy', text: 'Rate my kissing skills from 1-10 and explain exactly how I earned that rating 💋📈' },
  { id: '75', type: 'spicy', text: 'Tell me where your favorite unexpected place to be kissed is 🎯😘' },
  { id: '76', type: 'spicy', text: 'Describe a new position or fantasy you want to try next time we have absolute privacy 🤸‍♀️🔥' },
  { id: '77', type: 'spicy', text: 'Unbutton one button or take off one piece of clothing right now 👚👀' },
  { id: '78', type: 'spicy', text: 'Tell me what the most sensitive spot on your body is and how you want me to touch it 🪶✨' },
  { id: '79', type: 'spicy', text: 'Send me a risky text message that you would be terrified if anyone else saw 📱😳' },
  { id: '80', type: 'spicy', text: 'Whisper exactly what you want me to do to you tonight in under 15 seconds 🤫👂', timer: 15 },
  { id: '81', type: 'spicy', text: 'Show me the sexiest piece of clothing you own and tell me when you plan to wear it 👙👔' },
  { id: '82', type: 'spicy', text: 'Tell me the exact explicit thought you had the first time we kissed 💭🔥' },
  { id: '83', type: 'spicy', text: 'Slowly eat a piece of fruit or chocolate while maintaining intense eye contact with me 🍓🍫', timer: 30 },

  // LDR (84-98)
  { id: '84', type: 'ldr', vibe: 'fun', text: 'Send me a 5-second video of your current view, no matter how boring it is 🪟📱' },
  { id: '85', type: 'ldr', vibe: 'romantic', text: 'Order me a surprise treat right now without telling me what it is 🍩🛵' },
  { id: '86', type: 'ldr', vibe: 'romantic', text: 'Take a selfie in the exact spot you wish I was sitting next to you right now 🪑📸' },
  { id: '87', type: 'ldr', vibe: 'spicy', text: 'Send a voice note of you kissing the microphone 3 times slowly 💋🎙️' },
  { id: '88', type: 'ldr', vibe: 'romantic', text: 'Write a 3-line love letter and send a picture of it handwritten on paper ✍️💌', timer: 120 },
  { id: '89', type: 'ldr', vibe: 'fun', text: 'Change into an outfit that has my favorite color in it for the rest of our call 👕🎨' },
  { id: '90', type: 'ldr', vibe: 'fun', text: 'Protect me at all costs during our next game session 🎮🛡️' },
  { id: '91', type: 'ldr', vibe: 'romantic', text: 'Send a picture of the exact spot on your bed where you wish we were cuddling right now 🛏️🥺' },
  { id: '92', type: 'ldr', vibe: 'fun', text: 'Give me a virtual house tour on video call, but pretend you are a fancy real estate agent 🏠🤵' },
  { id: '93', type: 'ldr', vibe: 'fun', text: 'Send me a picture of the sky above you right now so we can share the same view ☁️🌤️' },
  { id: '94', type: 'ldr', vibe: 'romantic', text: 'Record yourself saying a soft "Good morning" so I can wake up to it tomorrow 🌅🎧' },
  { id: '95', type: 'ldr', vibe: 'romantic', text: 'Find an object in your room that instantly reminds you of me and explain why 🧸💭' },
  { id: '96', type: 'ldr', vibe: 'fun', text: 'Share your screen and let me pick the next video we watch together 💻▶️' },
  { id: '97', type: 'ldr', vibe: 'fun', text: 'Send me a screenshot of your home screen right now so I can judge your app layout 📱🔋' },
  { id: '98', type: 'ldr', vibe: 'fun', text: 'Trace my initial on your hand and send me a picture of it ✍️✋' },

  // Fun (99-110)
  { id: '99', type: 'fun', text: 'Try to explain the plot of your favorite movie while holding a plank ⏱️🎬', timer: 60 },
  { id: '100', type: 'fun', text: 'Do 15 pushups and shout out a different snack on each rep! 🏋️‍♂️' },
  { id: '101', type: 'fun', text: 'Talk like a seasoned rickshaw driver negotiating a fare for the next 2 minutes 🛺😎', timer: 120 },
  { id: '102', type: 'fun', text: 'Show me the most embarrassing photo in your phone\'s gallery right now 📸🙈' },
  { id: '103', type: 'fun', text: 'Try to juggle 3 small objects (like rolled-up socks) for 30 seconds 🤹‍♂️🧦', timer: 30 },
  { id: '104', type: 'fun', text: 'Speak in an exaggerated British accent until your next turn ☕💂‍♂️' },
  { id: '105', type: 'fun', text: 'Pretend your phone is a dumbbell and do slow bicep curls while making intense eye contact 💪📱' },
  { id: '106', type: 'fun', text: 'Explain how a database works but make it sound like a dramatic reality TV show 💾📺', timer: 60 },
  { id: '107', type: 'fun', text: 'Put a piece of ice in your mouth and try to sing a popular song 🧊🎤' },
  { id: '108', type: 'fun', text: 'Draw a funny face on your thumb and make it lip-sync to a song of my choice 👍🎤' },
  { id: '109', type: 'fun', text: 'Wear your socks on your hands for the next three rounds 🧦👐' },
  { id: '110', type: 'fun', text: 'Blindfold yourself and try to guess what object I\'m describing in your room 🙈🕵️‍♂️' },

  // Romantic (111-123)
  { id: '111', type: 'romantic', text: 'Tell me about a time you felt incredibly proud of me 🌟🥺' },
  { id: '112', type: 'romantic', text: 'Describe the exact outfit you\'d want me to wear on our next dinner date 👗👔✨' },
  { id: '113', type: 'romantic', text: 'Create a secret handshake for us through the screen 🤝🔮' },
  { id: '114', type: 'romantic', text: 'Tell me which of my quirks makes you smile the most 😊💘' },
  { id: '115', type: 'romantic', text: 'Write a 3-sentence review of "Us" as a couple like it\'s a 5-star app ⭐⭐⭐⭐⭐' },
  { id: '116', type: 'romantic', text: 'Stare into the camera and give me your best, most genuine smile for 15 seconds straight 😁', timer: 15 },
  { id: '117', type: 'romantic', text: 'Tell me a completely random memory of us that lives rent-free in your head 🧠💭' },
  { id: '118', type: 'romantic', text: 'Pretend we are on a long motorcycle ride right now—describe the scenery and our first pit stop 🏍️🌄' },
  { id: '119', type: 'romantic', text: 'Read the last sweet text I sent you out loud using your most romantic voice 📱🗣️' },
  { id: '120', type: 'romantic', text: 'Tell me one thing you\'d love to learn how to do together in the future 📚❤️' },
  { id: '121', type: 'romantic', text: 'Name a song that perfectly describes how you feel about me right this second 🎵🥰' },
  { id: '122', type: 'romantic', text: 'Describe my eyes in as much detail as you can without looking at a picture 👁️✨' },
  { id: '123', type: 'romantic', text: 'If we had a whole weekend with no responsibilities, what’s the first thing you\'d plan for us? 🗓️🛋️' },

  // Spicy (124-136)
  { id: '124', type: 'spicy', text: 'Tell me about a time you were completely distracted by how good I looked 👀🔥' },
  { id: '125', type: 'spicy', text: 'Describe the exact way you want me to greet you the next time we are alone behind closed doors 🚪🥵' },
  { id: '126', type: 'spicy', text: 'Send a voice note of you taking a deep breath and letting it out slowly... right near the mic 🎙️😮‍💨' },
  { id: '127', type: 'spicy', text: 'Tell me which part of my body you think about the most when we are apart 💭👅' },
  { id: '128', type: 'spicy', text: 'Run your hands through your hair slowly while maintaining intense eye contact 💆‍♂️🔥', timer: 20 },
  { id: '129', type: 'spicy', text: 'Describe your favorite memory of us being physically close in vivid detail 🧠🔥' },
  { id: '130', type: 'spicy', text: 'Tell me a fantasy you have that involves just the two of us and a locked hotel room 🏨🗝️' },
  { id: '131', type: 'spicy', text: 'Whisper your favorite spicy word in your sexiest tone 🤫' },
  { id: '132', type: 'spicy', text: 'What is one thing I wear that makes it impossible for you to focus? 👗👖🔥' },
  { id: '133', type: 'spicy', text: 'Bite your bottom lip and hold it for 10 seconds while staring at me 🫦', timer: 10 },
  { id: '134', type: 'spicy', text: 'Tell me exactly what goes through your mind when I lean in close to you 🧠💋' },
  { id: '135', type: 'spicy', text: 'Send a picture of your neck and collarbone right now 📸🔥' },
  { id: '136', type: 'spicy', text: 'Describe the temperature of the room using only suggestive adjectives 🌡️🥵' },

  // LDR (137-148)
  { id: '137', type: 'ldr', vibe: 'fun', text: 'Open your map app and find the exact distance between us right now. Send the screenshot! 🗺️📏' },
  { id: '138', type: 'ldr', vibe: 'fun', text: 'Do a trust fall onto your bed while imagining I\'m there to catch you 🛏️🫂' },
  { id: '139', type: 'ldr', vibe: 'fun', text: 'Send me a quick voice note of your current background noise 🎧🌃' },
  { id: '140', type: 'ldr', vibe: 'fun', text: 'Make a cup of coffee or tea right now and take the first sip "with" me ☕🍵' },
  { id: '141', type: 'ldr', vibe: 'romantic', text: 'Find the softest blanket or hoodie in your room and pretend it\'s a hug from me 🧥🤗' },
  { id: '142', type: 'ldr', vibe: 'fun', text: 'Go to your window and describe the first interesting thing you see outside 🪟👀' },
  { id: '143', type: 'ldr', vibe: 'romantic', text: 'Send me a live photo or recording of you blowing a kiss to the camera 💋🤳' },
  { id: '144', type: 'ldr', vibe: 'fun', text: 'Order a small midnight snack for yourself and tell me what you got 🍕🍟' },
  { id: '145', type: 'ldr', vibe: 'fun', text: 'Let\'s pick a new game or app we can both download and play together right now 📲🎮' },
  { id: '146', type: 'ldr', vibe: 'fun', text: 'Tell me what the weather is like there and how it makes you feel right now ⛈️☀️' },
  { id: '147', type: 'ldr', vibe: 'romantic', text: 'Leave your phone on the pillow next to you for the next 2 minutes so we can just "lay" together 🛏️📱', timer: 120 },
  { id: '148', type: 'ldr', vibe: 'fun', text: 'Send me a picture of the shoes you wore today so I can imagine walking beside you 👟👣' },

  // --- NEW FUN (149-156) ---
  { id: '149', type: 'fun', text: 'Pretend you are a local auto driver arguing over the meter while doing your best dramatic bargaining voice.', timer: 45 },
  { id: '150', type: 'fun', text: 'Do 10 push-ups while shouting the names of your top 5 favorite street foods.', timer: 60 },
  { id: '151', type: 'fun', text: 'Act out a full victory dance but in slow-motion like a dramatic movie scene.', timer: 30 },
  { id: '152', type: 'fun', text: 'Speak only in local slang for the next 2 rounds.', timer: 120 },
  { id: '153', type: 'fun', text: 'Balance a spoon on your nose and try to walk to the nearest window without dropping it.', timer: 30 },
  { id: '154', type: 'fun', text: 'Show me the most random photo in your camera roll and narrate it like a dramatic movie trailer.' },
  { id: '155', type: 'fun', text: 'Do your best impression of a strict parent catching us on a video call.', timer: 45 },
  { id: '156', type: 'fun', text: 'Put your phone on your head and do a silly dance for 20 seconds.', timer: 20 },

  // --- NEW ROMANTIC (157-164) ---
  { id: '157', type: 'romantic', text: 'Tell me the exact moment you realized you were falling for me.', timer: 60 },
  { id: '158', type: 'romantic', text: 'Describe our dream rainy day date with chai at the beach.', timer: 60 },
  { id: '159', type: 'romantic', text: 'Recreate the exact way you held my hand the first time we met through the screen.', timer: 30 },
  { id: '160', type: 'romantic', text: 'Sing the chorus of a romantic song but replace the main word with my name.', timer: 30 },
  { id: '161', type: 'romantic', text: 'Plan our next spontaneous adventure in 3 sentences.', timer: 60 },
  { id: '162', type: 'romantic', text: 'Tell me one tiny habit of mine that makes you fall in love all over again.', timer: 45 },
  { id: '163', type: 'romantic', text: 'Write my name in the air with your finger and blow a kiss to it.', timer: 30 },
  { id: '164', type: 'romantic', text: 'Share the exact wallpaper on your phone and explain why it reminds you of us.', timer: 45 },

  // --- NEW SPICY (165-172) ---
  { id: '165', type: 'spicy', text: 'Describe exactly what you would do if we were stuck in a lift together during a power cut.', timer: 45 },
  { id: '166', type: 'spicy', text: 'Send a voice note of you breathing softly while saying my name slowly.', timer: 20 },
  { id: '167', type: 'spicy', text: 'Take off one piece of clothing slowly while maintaining eye contact.', timer: 30 },
  { id: '168', type: 'spicy', text: 'Tell me the one place on my body you want to kiss right now and why.', timer: 45 },
  { id: '169', type: 'spicy', text: 'Show me the sexiest pose you can do right now in your current outfit.', timer: 10 },
  { id: '170', type: 'spicy', text: 'Whisper the hottest compliment you have about me into the microphone.', timer: 20 },
  { id: '171', type: 'spicy', text: 'Rate how spicy our last kiss was on a scale of 1-10 and explain why.', timer: 45 },
  { id: '172', type: 'spicy', text: 'Slowly run your fingers down your neck while staring at me for 15 seconds.', timer: 15 },

  // --- NEW LDR (173-180) ---
  { id: '173', type: 'ldr', vibe: 'fun', text: 'Order me my favorite food right now and send the order screenshot.', timer: 60 },
  { id: '174', type: 'ldr', vibe: 'fun', text: 'Take a 5-second video of you spinning in your room so I can feel like I am there.', timer: 10 },
  { id: '175', type: 'ldr', vibe: 'romantic', text: 'Send a photo of the exact pillow you wish I was sleeping on right now.', timer: 20 },
  { id: '176', type: 'ldr', vibe: 'romantic', text: 'Send a voice note saying I miss you in the softest, slowest voice possible.', timer: 20 },
  { id: '177', type: 'ldr', vibe: 'romantic', text: 'Show me what is playing on your music app and dedicate the next song to me.', timer: 30 },
  { id: '178', type: 'ldr', vibe: 'fun', text: 'Send a picture of the sunset or sunrise from your window right now so we can watch it together.', timer: 15 },
  { id: '179', type: 'ldr', vibe: 'fun', text: 'Change your status to something only I would understand and keep it for 1 hour.', timer: 60 },
  { id: '180', type: 'ldr', vibe: 'fun', text: 'Do a trust-fall onto your bed while saying my name out loud.', timer: 15 },

  // --- FRESH ENGLISH DARES (181-188) ---
  { id: '181', type: 'fun', text: 'Pretend you are a local train announcer giving the most dramatic delay announcement ever.', timer: 45 },
  { id: '182', type: 'fun', text: 'Do 15 jumping jacks while naming every item on a typical street food menu.', timer: 60 },
  { id: '183', type: 'fun', text: 'Act out a full game victory in slow motion like a superhero movie scene.', timer: 30 },
  { id: '184', type: 'fun', text: 'Speak only in movie dialogues for the next 2 rounds.', timer: 120 },
  { id: '185', type: 'fun', text: 'Balance your phone on your forehead and walk across the room like a model on a runway.', timer: 30 },
  { id: '186', type: 'fun', text: 'Show me the oldest selfie in your gallery and narrate the story behind it like a grand presentation.' },
  { id: '187', type: 'fun', text: 'Do your best impression of a traffic policeman stopping us for a romantic photo.', timer: 45 },
  { id: '188', type: 'fun', text: 'Put on your headphones and dance to the first song that plays without any audible music.', timer: 20 },

  // --- FRESH ROMANTIC (189-196) ---
  { id: '189', type: 'romantic', text: 'Tell me the exact moment you first smiled because of a message from me.', timer: 60 },
  { id: '190', type: 'romantic', text: 'Describe our perfect evening walk along the shore in 3 sentences.', timer: 45 },
  { id: '191', type: 'romantic', text: 'Recreate the way you first hugged me using just your arms and the camera.', timer: 30 },
  { id: '192', type: 'romantic', text: 'Sing the chorus of any romantic song but replace the main word with my name.', timer: 30 },
  { id: '193', type: 'romantic', text: 'Plan our next spontaneous weekend getaway in exactly 3 sentences.', timer: 60 },
  { id: '194', type: 'romantic', text: 'Tell me one small thing I do that instantly makes your day better.', timer: 45 },
  { id: '195', type: 'romantic', text: 'Draw a heart in the air with your finger and pretend to give it to me through the screen.' },
  { id: '196', type: 'romantic', text: 'Share your current phone lock screen and explain why it feels like us.' },

  // --- FRESH SPICY (197-204) ---
  { id: '197', type: 'spicy', text: 'Describe exactly what you would do if we were alone in a parked car right now.', timer: 45 },
  { id: '198', type: 'spicy', text: 'Send a voice note breathing slowly and saying my name in your deepest voice.', timer: 20 },
  { id: '199', type: 'spicy', text: 'Slowly remove one item of clothing while keeping eye contact with the camera.', timer: 30 },
  { id: '200', type: 'spicy', text: 'Tell me the one spot on your body you want me to kiss first next time we meet.', timer: 45 },
  { id: '201', type: 'spicy', text: 'Strike your most seductive pose right now and hold it for 10 seconds.', timer: 10 },
  { id: '202', type: 'spicy', text: 'Whisper the hottest compliment you have ever thought about me into the microphone.', timer: 20 },
  { id: '203', type: 'spicy', text: 'Rate our last make-out session from 1 to 10 and explain every point.', timer: 45 },
  { id: '204', type: 'spicy', text: 'Slowly trace your fingers along your collarbone while looking straight at me.', timer: 15 },

  // --- FRESH LDR (205-212) ---
  { id: '205', type: 'ldr', vibe: 'romantic', text: 'Order my favorite dessert right now and send me the confirmation screenshot.', timer: 60 },
  { id: '206', type: 'ldr', vibe: 'fun', text: 'Take a quick 360-degree video of your room so I can imagine standing there with you.' },
  { id: '207', type: 'ldr', vibe: 'romantic', text: 'Send a photo of the exact side of the bed where you wish I was lying right now.' },
  { id: '208', type: 'ldr', vibe: 'romantic', text: 'Record a voice note saying good night in the softest voice you can manage.' },
  { id: '209', type: 'ldr', vibe: 'romantic', text: 'Show me the current song on your playlist and tell me why it reminds you of me.' },
  { id: '210', type: 'ldr', vibe: 'fun', text: 'Send a picture of the sky outside your window right now so we can look at the same clouds.' },
  { id: '211', type: 'ldr', vibe: 'fun', text: 'Change your profile picture to something that only I would understand.' },
  { id: '212', type: 'ldr', vibe: 'romantic', text: 'Do a pretend hug by wrapping your arms around yourself and saying my name out loud.' }
];

// Helper to get 5 free initial cards for first-time users (mix of fun + romantic)
export const getInitialFreeCards = () => {
  return CARDS.slice(0, 5); // First 5 cards are free for new users
};
