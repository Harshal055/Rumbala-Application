import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles } from '../src/constants/glass';
import { useStore } from '../src/store/useStore';
import { COUPLE_QUIZZES, CoupleQuiz, QuizQuestion } from '../src/data/quizzes';

const BG_COLORS = ['#FFF0F5', '#F5F3FF', '#FFF8F0', '#F0FDF4'];

type QuizStage = 'select' | 'p1_play' | 'pass_phone' | 'p2_play' | 'results';

export default function CoupleQuizScreen() {
    const router = useRouter();
    const { partner1, partner2, setSelectedVibe, setSelectedIntensity } = useStore();

    const p1Name = partner1?.trim() || 'Partner 1';
    const p2Name = partner2?.trim() || 'Partner 2';

    const [activeQuiz, setActiveQuiz] = useState<CoupleQuiz | null>(null);
    const [stage, setStage] = useState<QuizStage>('select');
    const [currentQIndex, setCurrentQIndex] = useState<number>(0);
    const [p1Answers, setP1Answers] = useState<Record<string, string>>({});
    const [p2Answers, setP2Answers] = useState<Record<string, string>>({});

    const handleStartQuiz = (quiz: CoupleQuiz) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActiveQuiz(quiz);
        setCurrentQIndex(0);
        setP1Answers({});
        setP2Answers({});
        setStage('p1_play');
    };

    const handleSelectOption = (optionId: string) => {
        if (!activeQuiz) return;
        Haptics.selectionAsync();

        const currentQ = activeQuiz.questions[currentQIndex];

        if (stage === 'p1_play') {
            const updated = { ...p1Answers, [currentQ.id]: optionId };
            setP1Answers(updated);

            if (currentQIndex + 1 < activeQuiz.questions.length) {
                setCurrentQIndex(prev => prev + 1);
            } else {
                // Partner 1 done -> Pass phone screen
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setStage('pass_phone');
                setCurrentQIndex(0);
            }
        } else if (stage === 'p2_play') {
            const updated = { ...p2Answers, [currentQ.id]: optionId };
            setP2Answers(updated);

            if (currentQIndex + 1 < activeQuiz.questions.length) {
                setCurrentQIndex(prev => prev + 1);
            } else {
                // Both done -> calculate results!
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setStage('results');
            }
        }
    };

    // Calculate match percentage
    const calculateScore = () => {
        if (!activeQuiz) return { score: 100, matches: 0, total: 5 };
        const total = activeQuiz.questions.length;
        let matches = 0;
        activeQuiz.questions.forEach(q => {
            if (p1Answers[q.id] && p1Answers[q.id] === p2Answers[q.id]) {
                matches++;
            }
        });
        // Base harmony score with scaling (even slight differences complement!)
        const rawPercent = Math.round((matches / total) * 100);
        // Minimum score 65% for fun & positive couple vibe
        const finalScore = Math.max(65, Math.min(100, 60 + Math.round((matches / total) * 40)));
        return { score: finalScore, matches, total };
    };

    const getInsight = (score: number) => {
        if (score >= 90) {
            return {
                title: '⚡ Pure Soulmate Energy!',
                desc: 'Your wavelength is telepathic. You two intuitively crave the same romantic experiences and rhythm.',
                badgeColor: '#10B981'
            };
        } else if (score >= 80) {
            return {
                title: '💖 Deep Harmony & Balance!',
                desc: 'Your tastes blend like the perfect cocktail—aligned on the big things with just enough spicy variety to keep each day exciting.',
                badgeColor: '#FF6B35'
            };
        } else {
            return {
                title: '🔥 Opposites Attract Fire!',
                desc: 'You bring completely different superpowers to the table, creating immense chemistry and endless new discoveries.',
                badgeColor: '#EC4899'
            };
        }
    };

    const currentQuestion = activeQuiz?.questions[currentQIndex];

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" />

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, glassStyles.header]}>
                    <TouchableOpacity
                        style={[styles.backBtn, glassStyles.container]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            if (stage !== 'select') {
                                setStage('select');
                            } else if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(tabs)');
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={20} color="#1A1A2E" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <Text style={styles.headerTitle}>
                            {stage === 'select' ? 'Couples Quiz Arena 💑' : activeQuiz?.title}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {stage === 'select'
                                ? 'Test your harmony, love language & chemistry'
                                : stage === 'p1_play'
                                    ? `Step 1/2 • ${p1Name}'s Turn`
                                    : stage === 'pass_phone'
                                        ? 'Pass the Device 📱'
                                        : stage === 'p2_play'
                                            ? `Step 2/2 • ${p2Name}'s Turn`
                                            : 'Harmony Score Reveal ✨'}
                        </Text>
                    </View>
                    <View style={{ width: 40 }} />
                </Animated.View>

                {/* ── 1. QUIZ SELECTION STAGE ── */}
                {stage === 'select' && (
                    <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.heroBanner}>
                            <Text style={styles.heroEmoji}>💞</Text>
                            <Text style={styles.heroTitle}>How In-Sync Are You Two?</Text>
                            <Text style={styles.heroSub}>
                                Pick a topic below. Both partners take turns answering 5 quick questions on this device!
                            </Text>
                        </Animated.View>

                        <Text style={styles.sectionHeader}>FEATURED QUIZ PACKS</Text>

                        <View style={{ gap: 14 }}>
                            {COUPLE_QUIZZES.map((quiz, idx) => (
                                <Animated.View key={quiz.id} entering={FadeInDown.delay(150 + idx * 80).duration(400)}>
                                    <TouchableOpacity
                                        style={[styles.quizCard, glassStyles.container]}
                                        onPress={() => handleStartQuiz(quiz)}
                                        activeOpacity={0.85}
                                    >
                                        <LinearGradient
                                            colors={quiz.gradient}
                                            style={styles.quizGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <View style={styles.quizEmojiWrap}>
                                                <Text style={styles.quizEmoji}>{quiz.emoji}</Text>
                                            </View>
                                            <View style={styles.quizInfo}>
                                                <View style={styles.quizBadgeRow}>
                                                    <View style={[styles.quizBadge, { backgroundColor: quiz.color }]}>
                                                        <Text style={styles.quizBadgeText}>5 QUESTIONS</Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.quizTitle}>{quiz.title}</Text>
                                                <Text style={styles.quizTagline}>{quiz.tagline}</Text>
                                            </View>
                                            <View style={[styles.quizArrow, { backgroundColor: `${quiz.color}20` }]}>
                                                <Ionicons name="play" size={16} color={quiz.color} />
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                )}

                {/* ── 2. PLAYING STAGE (P1 or P2) ── */}
                {(stage === 'p1_play' || stage === 'p2_play') && currentQuestion && (
                    <View style={styles.playContainer}>
                        {/* Progress Bar */}
                        <View style={styles.progressBarWrap}>
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${((currentQIndex + 1) / (activeQuiz?.questions.length || 5)) * 100}%`,
                                            backgroundColor: activeQuiz?.color || '#FF6B35'
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                Question {currentQIndex + 1} of {activeQuiz?.questions.length}
                            </Text>
                        </View>

                        {/* Player indicator banner */}
                        <View style={[styles.playerBanner, glassStyles.container]}>
                            <Text style={styles.playerBannerEmoji}>{stage === 'p1_play' ? '👤' : '💖'}</Text>
                            <Text style={styles.playerBannerText}>
                                Answering as: <Text style={{ fontWeight: '800', color: activeQuiz?.color }}>{stage === 'p1_play' ? p1Name : p2Name}</Text>
                            </Text>
                        </View>

                        {/* Question Prompt */}
                        <Animated.View key={`${stage}_${currentQIndex}`} entering={FadeIn.duration(300)} style={[styles.questionCard, glassStyles.container]}>
                            <Text style={styles.questionPrompt}>{currentQuestion.prompt}</Text>
                        </Animated.View>

                        {/* Options */}
                        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                            <View style={{ gap: 12, paddingBottom: 20 }}>
                                {currentQuestion.options.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[styles.optionBtn, glassStyles.container]}
                                        onPress={() => handleSelectOption(opt.id)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                                        <Text style={styles.optionText}>{opt.text}</Text>
                                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* ── 3. PASS PHONE TRANSITION ── */}
                {stage === 'pass_phone' && (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.passPhoneWrap}>
                        <View style={[styles.passCard, glassStyles.container]}>
                            <Text style={styles.passEmoji}>🙈 📱</Text>
                            <Text style={styles.passTitle}>Awesome, {p1Name}!</Text>
                            <Text style={styles.passSub}>
                                Now hand the phone over to <Text style={{ fontWeight: '800', color: '#FF6B35' }}>{p2Name}</Text>.
                            </Text>
                            <Text style={styles.passHint}>
                                (No peeking allowed while they answer! 🤫)
                            </Text>

                            <TouchableOpacity
                                style={styles.passBtn}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                    setStage('p2_play');
                                }}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={['#FF6B35', '#EC4899']}
                                    style={styles.passGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.passBtnText}>I'm Ready, {p2Name}! 🚀</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                {/* ── 4. RESULTS STAGE ── */}
                {stage === 'results' && (
                    <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {(() => {
                            const { score, matches, total } = calculateScore();
                            const insight = getInsight(score);
                            return (
                                <Animated.View entering={FadeInDown.duration(500)} style={{ gap: 16 }}>
                                    {/* Score Card */}
                                    <LinearGradient
                                        colors={['rgba(255, 107, 53, 0.12)', 'rgba(236, 72, 153, 0.15)']}
                                        style={[styles.resultsHero, glassStyles.container]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Text style={styles.scoreNumber}>{score}%</Text>
                                        <Text style={styles.scoreLabel}>COUPLE HARMONY SCORE</Text>
                                        <View style={styles.matchPill}>
                                            <Ionicons name="sparkles" size={14} color="#FF6B35" />
                                            <Text style={styles.matchPillText}>{matches} of {total} Exact Taste Matches</Text>
                                        </View>
                                    </LinearGradient>

                                    {/* Insight Card */}
                                    <View style={[styles.insightCard, glassStyles.container]}>
                                        <View style={[styles.insightBadge, { backgroundColor: `${insight.badgeColor}20` }]}>
                                            <Text style={[styles.insightBadgeText, { color: insight.badgeColor }]}>{insight.title}</Text>
                                        </View>
                                        <Text style={styles.insightDesc}>{insight.desc}</Text>
                                    </View>

                                    {/* Action Buttons */}
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            setSelectedVibe('romantic');
                                            setSelectedIntensity(2);
                                            router.push('/(tabs)');
                                        }}
                                        activeOpacity={0.85}
                                    >
                                        <LinearGradient
                                            colors={['#FF6B35', '#EC4899']}
                                            style={styles.actionGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Ionicons name="flame" size={20} color="#FFF" />
                                            <Text style={styles.actionBtnText}>Draw a Celebration Dare 🔥</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.secondaryBtn, glassStyles.container]}
                                        onPress={() => setStage('select')}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="repeat" size={18} color="#4B5563" />
                                        <Text style={styles.secondaryBtnText}>Try Another Quiz</Text>
                                    </TouchableOpacity>

                                    <View style={{ height: 40 }} />
                                </Animated.View>
                            );
                        })()}
                    </ScrollView>
                )}
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    headerTitleWrap: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1A1A2E',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    heroBanner: {
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 16,
    },
    heroEmoji: {
        fontSize: 38,
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A2E',
        textAlign: 'center',
        marginBottom: 6,
    },
    heroSub: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 18,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6B7280',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    quizCard: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    quizGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
    },
    quizEmojiWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quizEmoji: {
        fontSize: 24,
    },
    quizInfo: {
        flex: 1,
    },
    quizBadgeRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    quizBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    quizBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    quizTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1A1A2E',
        marginBottom: 2,
    },
    quizTagline: {
        fontSize: 12,
        color: '#6B7280',
    },
    quizArrow: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    progressBarWrap: {
        marginBottom: 12,
    },
    progressTrack: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.06)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '700',
        textAlign: 'center',
    },
    playerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        marginBottom: 14,
        alignSelf: 'center',
    },
    playerBannerEmoji: {
        fontSize: 16,
    },
    playerBannerText: {
        fontSize: 13,
        color: '#4B5563',
    },
    questionCard: {
        padding: 20,
        borderRadius: 22,
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    questionPrompt: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '800',
        color: '#1A1A2E',
        textAlign: 'center',
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.65)',
        gap: 12,
    },
    optionEmoji: {
        fontSize: 22,
    },
    optionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 20,
    },
    passPhoneWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    passCard: {
        width: '100%',
        padding: 28,
        borderRadius: 28,
        alignItems: 'center',
    },
    passEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    passTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A1A2E',
        marginBottom: 8,
    },
    passSub: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 22,
    },
    passHint: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginBottom: 24,
    },
    passBtn: {
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
    },
    passGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    passBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    resultsHero: {
        padding: 30,
        borderRadius: 28,
        alignItems: 'center',
        borderColor: 'rgba(255, 107, 53, 0.4)',
        borderWidth: 1.5,
    },
    scoreNumber: {
        fontSize: 60,
        fontWeight: '900',
        color: '#FF6B35',
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6B7280',
        letterSpacing: 1,
        marginTop: 4,
        marginBottom: 14,
    },
    matchPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    matchPillText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FF6B35',
    },
    insightCard: {
        padding: 20,
        borderRadius: 22,
    },
    insightBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 10,
    },
    insightBadgeText: {
        fontSize: 13,
        fontWeight: '800',
    },
    insightDesc: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
    },
    actionBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 6,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    secondaryBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4B5563',
    },
});
