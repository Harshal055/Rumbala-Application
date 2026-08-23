import { CardType, DareCard } from '../constants/cards';
import { supabase } from './supabase';

export interface AIDareOptions {
    prompt?: string;
    vibe?: CardType;
    intensity?: number;
    partner1?: string;
    partner2?: string;
    mood?: string;
}

export interface MoodPreset {
    key: string;
    label: string;
    emoji: string;
    vibe: CardType;
    intensity: number;
    description: string;
}

export const MOOD_PRESETS: MoodPreset[] = [
    { key: 'massage', label: 'Sensual Massage', emoji: '💆', vibe: 'spicy', intensity: 2, description: 'Gentle touches & relaxing tension relief' },
    { key: 'whisper', label: 'Whisper Secrets', emoji: '🤫', vibe: 'spicy', intensity: 1, description: 'Late-night intimate ear whispers' },
    { key: 'kitchen', label: 'Kitchen Romance', emoji: '🍳', vibe: 'romantic', intensity: 1, description: 'Playful tasting & cooking romance' },
    { key: 'blindfold', label: 'Sensory Blindfold', emoji: '🙈', vibe: 'spicy', intensity: 2, description: 'Heightened senses & anticipation' },
    { key: 'dance', label: 'Slow & Sexy Dance', emoji: '💃', vibe: 'romantic', intensity: 2, description: 'Body-to-body dance with eye contact' },
    { key: 'confession', label: 'Deep Confession', emoji: '💬', vibe: 'romantic', intensity: 1, description: 'Raw honesty and vulnerable feelings' },
    { key: 'party', label: 'Wild & Funny', emoji: '😂', vibe: 'fun', intensity: 1, description: 'Hilarious stunts and laughing fits' },
    { key: 'heat', label: 'Pure Passion', emoji: '🔥', vibe: 'spicy', intensity: 3, description: 'High-intensity intimate heat & desires' },
    { key: 'cuddle', label: 'Cozy Cuddle & Touch', emoji: '🧸', vibe: 'romantic', intensity: 1, description: 'Warm embraces & soft skin-to-skin closeness' },
    { key: 'tease', label: 'Slow Tease & Anticipation', emoji: '💋', vibe: 'spicy', intensity: 2, description: 'Building up irresistible tension' },
];

const CURATED_AI_TEMPLATES: Record<string, string[]> = {
    massage: [
        "{P1}, use warmed lotion or oil to give {P2} a slow, teasing neck and shoulder massage for 2 minutes without speaking.",
        "{P1}, gently trace the spine of {P2} with light fingertips from top to bottom 5 times, kissing their neck on each pass.",
        "{P1}, give {P2} a relaxing foot or hand massage while looking directly into their eyes and telling them what you love most about them.",
        "{P1}, let {P2} guide your hands to the exact spot on their body that needs your warm touch right now.",
        "{P1}, slowly massage {P2}'s temples and scalp for 90 seconds while whispering relaxing affirmations.",
        "{P1}, give {P2} a feather-light back massage using only the tips of your fingernails in slow circles.",
        "{P1}, massage {P2}'s lower back with firm thumbs while kissing their shoulder blades.",
        "{P1}, cup {P2}'s jaw in both warm hands and stroke their cheeks while delivering gentle kisses to their forehead and nose.",
    ],
    whisper: [
        "{P1}, lean in and whisper the exact moment today you found {P2} irresistibly attractive, then gently kiss their earlobe.",
        "{P1}, whisper a secret naughty thought you've had about {P2} this week that you haven't told them yet.",
        "{P1}, close your eyes and whisper 3 things you want {P2} to do to you later tonight.",
        "{P1}, whisper a 10-second romantic compliment in your deepest, most seductive voice.",
        "{P1}, whisper what {P2}'s scent does to you when you are standing this close.",
        "{P1}, trace your lips against {P2}'s neck and whisper a fantasy destination you want to escape to alone together.",
        "{P1}, whisper your favorite memory of physical intimacy with {P2} right into their ear.",
        "{P1}, softly whisper 5 words describing what {P2} means to your heart.",
    ],
    kitchen: [
        "{P1}, blindfold {P2} and feed them 2 different sweet or savoury bites from the fridge—they must guess what they are.",
        "{P1}, pour a tiny dab of honey, chocolate, or ice onto {P2}'s collarbone and gently lick it off.",
        "{P1}, trap {P2} against the kitchen counter and give them a slow, breathtaking 30-second kiss.",
        "{P1}, make a quick playful toast to {P2} with whatever drink is nearby and share a sip together.",
        "{P1}, feed {P2} a fruit or snack using only your lips—no hands allowed!",
        "{P1}, wrap your arms around {P2}'s waist from behind while they are at the counter and kiss the crook of their neck for 20 seconds.",
        "{P1}, take a sip of cold water and give {P2} an icy, electrifying kiss.",
        "{P1}, put on a slow song in the kitchen and slow dance with {P2} around the island or table.",
    ],
    blindfold: [
        "{P1}, put a blindfold on {P2}. Touch 3 different parts of their body using only your lips and breath—they must guess where.",
        "{P1}, blindfold {P2} and slowly whisper directions in their ear while guiding their hands over your body.",
        "{P1}, gently brush an ice cube or silk cloth along {P2}'s collarbone, stomach, and thighs while they are blindfolded.",
        "{P1}, blindfold {P2} for the next 2 minutes. They must only respond to you in soft murmurs while you tease them.",
        "{P1}, blindfold {P2} and kiss them in 4 different spots on their face and neck—they must guess the exact sequence.",
        "{P1}, let blindfolded {P2} reach out and identify which part of your body they are touching using only touch.",
        "{P1}, blindfold {P2}, place your warm hands over their chest to feel their heartbeat, and kiss their lips out of nowhere.",
        "{P1}, blindfold {P2} and describe everything you are about to do to them before you do it.",
    ],
    dance: [
        "{P1}, put on a slow song, pull {P2} in close with your hands on their hips, and slow-dance with zero space between you.",
        "{P1}, give {P2} a playful 45-second lap dance to whatever song they pick on their phone.",
        "{P1}, hold {P2}'s hands behind their back and sway to a sensual rhythm while maintaining unbroken eye contact.",
        "{P1}, teach {P2} one cheesy or seductive dance move and execute it together.",
        "{P1}, spin {P2} out and pull them back in flush against your chest, holding them tight for 10 beats.",
        "{P1}, dance cheek-to-cheek with {P2} with both eyes closed until the song ends.",
        "{P1}, dip {P2} dramatically and plant a passionate kiss before pulling them back up.",
        "{P1}, put on a spicy beat and let {P2} guide your hips while dancing together.",
    ],
    confession: [
        "{P1}, confess one romantic habit or cute quirk of {P2} that makes your heart melt every single time.",
        "{P1}, what is the first thing that crossed your mind the very first time you met {P2}? Tell the raw truth.",
        "{P1}, share one vulnerability or soft spot you have that only {P2} knows about.",
        "{P1}, describe what your ideal romantic getaway together would look like from sunrise to sunset.",
        "{P1}, tell {P2} the exact moment you felt the safest and most cherished in this relationship.",
        "{P1}, confess a time you felt butterflies in your stomach because of something {P2} did without realizing it.",
        "{P1}, share 3 specific goals or dreams you want us to accomplish together in the next 2 years.",
        "{P1}, tell {P2} one thing about their personality that inspires you to be a better person.",
    ],
    party: [
        "{P1}, do your most dramatic slow-motion impression of {P2} trying to flirt with someone.",
        "{P1}, let {P2} post any safe, funny emoji combination on your story or status for 15 minutes.",
        "{P1}, hold {P2} like a baby and sing them a hilarious customized lullaby about their favorite food.",
        "{P1}, speak in a fake posh British or French accent for the next 3 rounds of dares.",
        "{P1}, do 10 jumping jacks while declaring your undying love for {P2} in an operatic voice.",
        "{P1}, try to make {P2} break a completely straight face using only your weirdest facial expressions in 30 seconds.",
        "{P1}, let {P2} draw a tiny cute mustache or heart on your cheek with an eyeliner or washable pen.",
        "{P1}, recreate the iconic Titanic pose with {P2} while humming the theme song dramatically.",
    ],
    heat: [
        "{P1}, kiss {P2} anywhere EXCEPT their lips for 60 seconds, leaving them wanting more.",
        "{P1}, remove one piece of {P2}'s clothing using only your teeth or one hand.",
        "{P1}, run your fingers through {P2}'s hair, pull them in, and deliver your most passionate 15-second kiss.",
        "{P1}, tell {P2} in vivid detail exactly what you would do to them if there were no rules for the next hour.",
        "{P1}, straddle {P2}'s lap and kiss them with increasing intensity while running your hands down their back.",
        "{P1}, bite {P2}'s lower lip gently and hold eye contact while breathing against their mouth.",
        "{P1}, trace your tongue from {P2}'s earlobe down to their collarbone in one slow, deliberate sweep.",
        "{P1}, take {P2}'s hands, place them above their head, and kiss their jawline from ear to chin.",
    ],
    cuddle: [
        "{P1}, pull {P2} into a tight bear hug for a full 60 seconds without speaking, just listening to each other breathe.",
        "{P1}, lay your head in {P2}'s lap and let them stroke your hair while you describe your favorite moment together this week.",
        "{P1}, spoon {P2} from behind, wrap both arms around their chest, and kiss the back of their neck 3 times.",
        "{P1}, interlock your fingers with {P2}'s, bring both hands to your chest, and look softly into their eyes.",
        "{P1}, tuck {P2} under a warm blanket and whisper three things you love about holding them close.",
        "{P1}, rest your forehead against {P2}'s forehead (butterfly embrace) for 30 seconds with eyes closed.",
    ],
    tease: [
        "{P1}, hover your lips just a millimeter away from {P2}'s lips for 20 seconds without letting them touch.",
        "{P1}, slowly unbutton or slide one piece of {P2}'s clothing off their shoulder while looking into their eyes.",
        "{P1}, run your fingertips lightly up {P2}'s inner thigh, stopping just before they expect you to continue.",
        "{P1}, whisper a seductive dare into {P2}'s ear, but tell them they have to wait 5 minutes before you allow them to do it.",
        "{P1}, lightly blow warm air on {P2}'s neck and stomach, following immediately with cool gentle breath.",
        "{P1}, kiss {P2} softly, pull away right as it gets heated, and tell them 'patience is everything'.",
    ],
};

const GENERIC_TEMPLATES: Record<CardType, string[]> = {
    fun: [
        "{P1}, try to make {P2} laugh in under 30 seconds using only funny facial expressions.",
        "{P1}, show {P2} the most embarrassing photo currently saved in your camera roll.",
        "{P1}, swap shirts with {P2} for the next 2 rounds of the game.",
        "{P1}, speak only in whispers for the next 2 minutes.",
        "{P1}, do your best runway model walk across the room while {P2} acts as the hyper-critical fashion judge.",
        "{P1}, let {P2} style your hair in the wildest mohawk or ponytail and take a selfie together.",
        "{P1}, attempt to rap a 30-second freestyle about what {P2} had for breakfast or lunch today.",
        "{P1}, speak in reverse-words or rhyme everything you say for the next 60 seconds.",
    ],
    romantic: [
        "{P1}, hold {P2}'s face in both hands, look into their eyes, and tell them 3 reasons you choose them every day.",
        "{P1}, give {P2} a lingering kiss on the forehead, both cheeks, nose, and lips in sequence.",
        "{P1}, recreate the very first photo you two ever took together.",
        "{P1}, write a 3-word secret love note on {P2}'s palm with your finger—they have to guess what it says.",
        "{P1}, tell {P2} about the moment you felt proudest to be with them in front of other people.",
        "{P1}, hold {P2}'s hand and list 5 tiny things about them that nobody else in the world notices.",
        "{P1}, slow dance with {P2} in total silence with your heads resting on each other's shoulders.",
        "{P1}, promise {P2} one special date night activity that you will plan and organize 100% on your own this month.",
    ],
    spicy: [
        "{P1}, place {P2}'s hand directly over your beating heart, then guide it down slowly while kissing them.",
        "{P1}, bite {P2}'s lower lip gently, then whisper what you want next.",
        "{P1}, give {P2} a slow, teasing neck kiss that lasts at least 20 seconds.",
        "{P1}, let {P2} run their hands all over your body while you remain completely still.",
        "{P1}, unbutton or adjust {P2}'s top slightly and kiss the exposed skin along their collarbone.",
        "{P1}, whisper your dirtiest fantasy in full detail without breaking eye contact.",
        "{P1}, pull {P2} onto your lap and kiss them passionately with both hands gripping their waist.",
        "{P1}, run an ice cube down {P2}'s neck and chest, warming it back up with your lips right behind it.",
    ],
    ldr: [
        "{P1}, take a hot or cute selfie right now and send it to {P2} with a 1-line flirty caption.",
        "{P1}, close your eyes on camera and describe in detail how you would kiss {P2} if you were in the same room right now.",
        "{P1}, record a 10-second voice note telling {P2} your favorite memory together and send it.",
        "{P1}, blow a slow kiss directly to the camera and tell {P2} the first thing you will do when you reunite.",
        "{P1}, order {P2}'s favorite midnight snack or sweet treat on a food app right now and surprise them.",
        "{P1}, send a video of you wearing {P2}'s favorite shirt or hoodie with a sweet personalized message.",
        "{P1}, place your phone on your pillow and whisper goodnight wishes into the mic for 60 seconds.",
        "{P1}, sync up and watch the same romantic music video or short clip simultaneously while on call.",
    ]
};

/**
 * Real AI generation via the Groq-backed Edge Function `groq-ai-dare`.
 * The Groq key stays server-side; this only calls our function (auth handled by
 * the supabase client's session). The function also saves the dare to ai_dares
 * and returns its row id as `remoteId` so it can be rated later.
 * Returns null on any failure so the caller can fall back to local templates.
 */
async function generateRemoteDare(options: AIDareOptions): Promise<DareCard | null> {
    const { data, error } = await supabase.functions.invoke('groq-ai-dare', {
        body: {
            prompt: options.prompt || '',
            mood: options.mood || '',
            vibe: options.vibe || 'spicy',
            intensity: options.intensity || 2,
            partner1: options.partner1 || 'Partner 1',
            partner2: options.partner2 || 'Partner 2',
        },
    });
    if (error) throw error;
    const text: string | undefined = data?.text;
    if (!text) return null;

    const vibe = (options.vibe || 'spicy') as CardType;
    const intensity = options.intensity || 2;
    return {
        id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        remoteId: data?.id || undefined,
        type: vibe,
        vibe,
        text,
        intensity,
        timer: intensity >= 2 ? 60 : undefined,
    };
}

/**
 * Public entry point. Tries real AI (server-side Groq) first; on any failure
 * (offline, not configured, quota, etc.) falls back to the local curated
 * templates so the feature always works.
 */
export async function generateAIDare(options: AIDareOptions): Promise<DareCard> {
    try {
        const remote = await generateRemoteDare(options);
        if (remote) return remote;
    } catch (e) {
        // Silent fallback to local templates.
    }
    return generateLocalDare(options);
}

/**
 * Synthesize a custom dare locally from curated templates (offline fallback).
 */
export async function generateLocalDare(options: AIDareOptions): Promise<DareCard> {
    const p1 = options.partner1?.trim() || 'Partner 1';
    const p2 = options.partner2?.trim() || 'Partner 2';
    const vibe = options.vibe || 'spicy';
    const intensity = options.intensity || 2;
    const mood = options.mood || (vibe === 'spicy' ? 'heat' : vibe === 'romantic' ? 'confession' : 'party');
    const customPrompt = options.prompt?.trim();

    // Artificial short delay (300-600ms) for magical UI feedback feel
    await new Promise(res => setTimeout(res, 400));

    let template = '';

    // Check if custom scenario prompt provided
    if (customPrompt && customPrompt.length > 5) {
        // Synthesize dynamic scenario with custom prompt
        if (vibe === 'spicy') {
            template = `{P1}, based on your scenario "${customPrompt}": take {P2} and give them a passionate, teasing experience for the next 2 minutes.`;
        } else if (vibe === 'romantic') {
            template = `{P1}, inspired by "${customPrompt}": share a deep, romantic moment with {P2} and tell them what they mean to you.`;
        } else if (vibe === 'fun') {
            template = `{P1}, taking inspiration from "${customPrompt}": perform a hilarious challenge with {P2}!`;
        } else {
            template = `{P1}, connected by "${customPrompt}": share this intimate virtual dare with {P2}.`;
        }
    } else {
        // Pick from curated mood pool or vibe fallback
        const moodPool = CURATED_AI_TEMPLATES[mood];
        if (moodPool && moodPool.length > 0) {
            template = moodPool[Math.floor(Math.random() * moodPool.length)];
        } else {
            const vibePool = GENERIC_TEMPLATES[vibe] || GENERIC_TEMPLATES.spicy;
            template = vibePool[Math.floor(Math.random() * vibePool.length)];
        }
    }

    // Substitute partner tokens
    const text = template
        .replace(/{P1}/g, p1)
        .replace(/{P2}/g, p2);

    const generatedCard: DareCard = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: vibe,
        vibe: vibe,
        text,
        intensity,
        timer: intensity >= 2 ? 60 : undefined,
    };

    return generatedCard;
}
