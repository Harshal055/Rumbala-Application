export interface QuizOption {
    id: string;
    text: string;
    emoji: string;
}

export interface QuizQuestion {
    id: string;
    prompt: string;
    partner1Prompt?: string;
    partner2Prompt?: string;
    options: QuizOption[];
    tip: string;
}

export interface CoupleQuiz {
    id: string;
    title: string;
    emoji: string;
    tagline: string;
    category: 'love_languages' | 'intimacy' | 'chemistry' | 'trivia';
    color: string;
    gradient: readonly [string, string];
    questions: QuizQuestion[];
}

export const COUPLE_QUIZZES: CoupleQuiz[] = [
    {
        id: 'quiz_love_languages',
        title: 'Love Languages & Affection',
        emoji: '❤️',
        tagline: 'Discover how you both express and receive love best',
        category: 'love_languages',
        color: '#F43F5E',
        gradient: ['rgba(244, 63, 94, 0.15)', 'rgba(251, 113, 133, 0.15)'] as const,
        questions: [
            {
                id: 'q_ll_1',
                prompt: 'What makes you feel most loved after a long, exhausting day?',
                options: [
                    { id: 'touch', text: 'A long, silent warm hug or cuddle on the couch', emoji: '🫂' },
                    { id: 'words', text: 'Hearing "I appreciate everything you do for us"', emoji: '💬' },
                    { id: 'acts', text: 'A hot cup of tea/dinner made without asking', emoji: '☕' },
                    { id: 'time', text: 'Putting all phones away and talking uninterrupted', emoji: '✨' },
                ],
                tip: 'Knowing your partner’s decompression love language turns bad days into bonding moments.'
            },
            {
                id: 'q_ll_2',
                prompt: 'What is your ideal romantic weekend getaway vibe?',
                options: [
                    { id: 'cabin', text: 'Cozy secluded cabin in the woods, no distractions', emoji: '🌲' },
                    { id: 'beach', text: 'Warm beach resort with cocktails and sunsets', emoji: '🏖️' },
                    { id: 'city', text: 'Bustling city adventure with dining & nightlife', emoji: '🌆' },
                    { id: 'home', text: 'Staying in bed all weekend with movies & takeout', emoji: '🍿' },
                ],
                tip: 'Shared vacation styles reveal whether you connect through relaxation or shared adventure.'
            },
            {
                id: 'q_ll_3',
                prompt: 'When you are upset, what do you need most from your partner?',
                options: [
                    { id: 'space', text: '15 minutes of quiet space before we talk', emoji: '🧘' },
                    { id: 'listen', text: 'To be held while I vent without offering solutions', emoji: '👂' },
                    { id: 'reassure', text: 'Gentle reassurance that we are solid and okay', emoji: '💖' },
                    { id: 'distract', text: 'Something lighthearted or sweet to break the tension', emoji: '🍫' },
                ],
                tip: 'Emotional conflict styles prevent misunderstandings before they happen.'
            },
            {
                id: 'q_ll_4',
                prompt: 'What is the most meaningful kind of romantic surprise?',
                options: [
                    { id: 'note', text: 'A handwritten letter or unexpected sweet text', emoji: '💌' },
                    { id: 'date', text: 'A fully planned mystery date night', emoji: '🎟️' },
                    { id: 'gift', text: 'A small gift that shows you remembered a small detail', emoji: '🎁' },
                    { id: 'massage', text: 'An unprompted back or foot rub when you notice tension', emoji: '💆' },
                ],
                tip: 'Little surprises feed the romantic bank account in a relationship!'
            },
            {
                id: 'q_ll_5',
                prompt: 'Which phrase warms your heart the most?',
                options: [
                    { id: 'proud', text: '"I am so proud to be with you."', emoji: '🌟' },
                    { id: 'safe', text: '"You make me feel safe and at home."', emoji: '🏡' },
                    { id: 'desire', text: '"You are the most attractive person in the world to me."', emoji: '🔥' },
                    { id: 'fun', text: '"Life is so much more fun with you around."', emoji: '🎉' },
                ],
                tip: 'Compliments that hit the deepest emotional chord strengthen mutual self-esteem.'
            }
        ]
    },
    {
        id: 'quiz_intimacy_desires',
        title: 'Intimacy & Desires',
        emoji: '🔥',
        tagline: 'Uncover sparks, chemistry, and bedroom fantasies',
        category: 'intimacy',
        color: '#EC4899',
        gradient: ['rgba(236, 72, 153, 0.15)', 'rgba(168, 85, 247, 0.15)'] as const,
        questions: [
            {
                id: 'q_int_1',
                prompt: 'What sets the mood for passion best for you?',
                options: [
                    { id: 'lighting', text: 'Dim ambient candlelight & sensual music playlist', emoji: '🕯️' },
                    { id: 'tease', text: 'Flirty text messages and teasing glances throughout the day', emoji: '📱' },
                    { id: 'spontaneous', text: 'Spontaneous passionate burst with zero planning', emoji: '⚡' },
                    { id: 'touch', text: 'A long sensual shower or warm oil massage', emoji: '🧴' },
                ],
                tip: 'Great physical intimacy often starts hours before entering the bedroom.'
            },
            {
                id: 'q_int_2',
                prompt: 'Which sensory experience excites you most?',
                options: [
                    { id: 'blindfold', text: 'Being blindfolded and relying on touch & sound', emoji: '🙈' },
                    { id: 'whispers', text: 'Intimate dirty whispers and ear kisses', emoji: '🤫' },
                    { id: 'temperature', text: 'Ice cubes or hot massage wax on skin', emoji: '🧊' },
                    { id: 'eye_contact', text: 'Slow, deep and intense unbroken eye contact', emoji: '👁️' },
                ],
                tip: 'Sensory play elevates physical sensation by heightening your dopamine response.'
            },
            {
                id: 'q_int_3',
                prompt: 'What is your favorite type of kiss?',
                options: [
                    { id: 'slow', text: 'Slow, lingering kiss that gradually builds in heat', emoji: '💋' },
                    { id: 'neck', text: 'Soft kisses trailing down the jawline and neck', emoji: '🦒' },
                    { id: 'passionate', text: 'Deep, breathless kiss with hands pulled into hair', emoji: '🌪️' },
                    { id: 'sweet', text: 'Forehead and nose kisses filled with tenderness', emoji: '🌸' },
                ],
                tip: 'Kissing compatibility is one of the strongest indicators of ongoing chemistry.'
            },
            {
                id: 'q_int_4',
                prompt: 'Where would you love to try a romantic or daring moment?',
                options: [
                    { id: 'balcony', text: 'Late night hotel balcony under the stars', emoji: '🌌' },
                    { id: 'car', text: 'Steamy car parked at a scenic viewpoint', emoji: '🚗' },
                    { id: 'shower', text: 'Luxurious hot rain shower together', emoji: '🚿' },
                    { id: 'couch', text: 'Living room floor wrapped in blankets by candlelight', emoji: '🛋️' },
                ],
                tip: 'Novelty in environments keeps the spark fresh and exhilarating!'
            },
            {
                id: 'q_int_5',
                prompt: 'What should we do more often together?',
                options: [
                    { id: 'dates', text: 'Dress up for fancy date nights with just us two', emoji: '🍷' },
                    { id: 'teasing', text: 'More teasing and physical touch without rush', emoji: '🔥' },
                    { id: 'adventures', text: 'Try new daring challenges and games', emoji: '🎲' },
                    { id: 'cuddles', text: 'Sleep in together with morning cuddles & coffee', emoji: '☕' },
                ],
                tip: 'Communicating desires openly keeps both partners feeling wanted and fulfilled.'
            }
        ]
    },
    {
        id: 'quiz_chemistry',
        title: 'Couple Chemistry & Dynamics',
        emoji: '🧪',
        tagline: 'Test your humor, instincts, and harmony under one roof',
        category: 'chemistry',
        color: '#6366F1',
        gradient: ['rgba(99, 102, 241, 0.15)', 'rgba(59, 130, 246, 0.15)'] as const,
        questions: [
            {
                id: 'q_chem_1',
                prompt: 'Who is more likely to suggest ordering late-night snacks?',
                options: [
                    { id: 'p1', text: 'Definitely Partner 1', emoji: '🍕' },
                    { id: 'p2', text: 'Definitely Partner 2', emoji: '🍟' },
                    { id: 'both', text: 'Equal telepathic craving at the exact same second', emoji: '🤝' },
                    { id: 'diet', text: 'Neither, we try (and fail) to resist', emoji: '🥗' },
                ],
                tip: 'Late night snack harmony is a top relationship superpower!'
            },
            {
                id: 'q_chem_2',
                prompt: 'How do you two usually decide what movie or series to watch?',
                options: [
                    { id: 'scroll', text: 'Spend 45 minutes scrolling before falling asleep', emoji: '😴' },
                    { id: 'take_turns', text: 'Strict turns—one picks tonight, the other next', emoji: '⚖️' },
                    { id: 'one_decides', text: 'One always knows what is good and the other agrees', emoji: '🎬' },
                    { id: 'trailer_war', text: 'Watch trailers together until one gets unanimous excitement', emoji: '🍿' },
                ],
                tip: 'Finding the balance between decision-making and compromise builds everyday rhythm.'
            },
            {
                id: 'q_chem_3',
                prompt: 'If you were in an escape room together, what is your team dynamic?',
                options: [
                    { id: 'leader_detective', text: 'One reads the clues methodically while the other tears the room apart', emoji: '🔍' },
                    { id: 'panickers', text: 'Laughing hysterically while running out of time', emoji: '😂' },
                    { id: 'masterminds', text: 'Hyper-focused dynamic duo escaping with minutes to spare', emoji: '🧠' },
                    { id: 'arguing', text: 'Bickering cutely about who had the key first', emoji: '🔑' },
                ],
                tip: 'How you handle mini puzzle stress mirrors how you handle real-life curveballs.'
            },
            {
                id: 'q_chem_4',
                prompt: 'What is your shared superpower as a couple?',
                options: [
                    { id: 'humor', text: 'We can make each other laugh even in the worst situations', emoji: '😂' },
                    { id: 'loyalty', text: 'We have each other’s backs 100% against the world', emoji: '🛡️' },
                    { id: 'passion', text: 'The physical and emotional chemistry never fades', emoji: '🔥' },
                    { id: 'growth', text: 'We push each other to be better humans every day', emoji: '🌱' },
                ],
                tip: 'Celebrating your core strength anchors your commitment.'
            },
            {
                id: 'q_chem_5',
                prompt: 'What song or genre belongs on your ultimate couple roadtrip playlist?',
                options: [
                    { id: 'nostalgia', text: '2000s throwback anthems we can scream at the top of our lungs', emoji: '🎤' },
                    { id: 'chill_rnb', text: 'Smooth R&B / Acoustic vibes with the windows down', emoji: '🌅' },
                    { id: 'upbeat_pop', text: 'Upbeat dance and pop hits to keep energy high', emoji: '💃' },
                    { id: 'rock_indie', text: 'Indie rock and roadtrip classics', emoji: '🎸' },
                ],
                tip: 'Music builds some of the strongest shared episodic memories for couples.'
            }
        ]
    },
    {
        id: 'quiz_know_me',
        title: 'How Well Do You Know Me?',
        emoji: '🤔',
        tagline: 'Put your memory, habits, and secrets to the test',
        category: 'trivia',
        color: '#10B981',
        gradient: ['rgba(16, 185, 129, 0.15)', 'rgba(20, 184, 166, 0.15)'] as const,
        questions: [
            {
                id: 'q_know_1',
                prompt: 'What is the fastest way to put a smile on your partner’s face?',
                options: [
                    { id: 'food', text: 'Surprise them with their favorite comfort food or dessert', emoji: '🍰' },
                    { id: 'cuddle', text: 'Come from behind and wrap them in a warm embrace', emoji: '🧸' },
                    { id: 'joke', text: 'Drop a stupid inside joke only you two understand', emoji: '🤡' },
                    { id: 'chore', text: 'Take care of a chore they were dreading doing', emoji: '🧹' },
                ],
                tip: 'Mastering your partner’s quick mood lifters is the hallmark of emotional intimacy.'
            },
            {
                id: 'q_know_2',
                prompt: 'What is your partner’s secret guilty pleasure?',
                options: [
                    { id: 'trash_tv', text: 'Binge-watching trashy reality TV or drama', emoji: '📺' },
                    { id: 'singing', text: 'Dramatic shower / car singing solos', emoji: '🚿' },
                    { id: 'shopping', text: 'Browsing online carts and buying cute things', emoji: '🛍️' },
                    { id: 'sleeping', text: 'Accidental 3-hour afternoon naps', emoji: '😴' },
                ],
                tip: 'Loving each other’s goofy guilty pleasures is true unconditional affection.'
            },
            {
                id: 'q_know_3',
                prompt: 'If your partner won a free million-dollar vacation, where would they go first?',
                options: [
                    { id: 'maldives', text: 'Overwater bungalow in the Maldives or Bora Bora', emoji: '🏝️' },
                    { id: 'japan', text: 'Tokyo & Kyoto food, culture and bullet trains', emoji: '🗾' },
                    { id: 'italy', text: 'Amalfi Coast villa with pasta, wine & sunsets', emoji: '🍝' },
                    { id: 'aurora', text: 'Glass igloo under the Northern Lights in Iceland', emoji: '❄️' },
                ],
                tip: 'Dreaming together keeps your shared horizon exciting and full of wonder.'
            },
            {
                id: 'q_know_4',
                prompt: 'What would your partner say was the most unforgettable moment you two shared?',
                options: [
                    { id: 'first_trip', text: 'Our very first trip or getaway together', emoji: '✈️' },
                    { id: 'deep_talk', text: 'That late-night talk where we opened up completely', emoji: '🌙' },
                    { id: 'spontaneous', text: 'A random spontaneous day that turned into pure magic', emoji: '✨' },
                    { id: 'overcoming', text: 'A tough moment where we held each other up and grew stronger', emoji: '🤝' },
                ],
                tip: 'Reflecting on past milestones deepens relationship gratitude.'
            },
            {
                id: 'q_know_5',
                prompt: 'What is one thing you can never stay mad at your partner for?',
                options: [
                    { id: 'puppy_eyes', text: 'When they give you that adorable puppy-dog pout', emoji: '🥺' },
                    { id: 'apology_hug', text: 'When they come over and silently bury their head in your chest', emoji: '🫂' },
                    { id: 'silly_joke', text: 'When they do something completely silly to make you crack a smile', emoji: '😜' },
                    { id: 'sweet_gesture', text: 'When they do something genuinely sweet to make it up to you', emoji: '🌸' },
                ],
                tip: 'Softness and quick repair attempts are the #1 predictor of long-lasting love.'
            }
        ]
    }
];
