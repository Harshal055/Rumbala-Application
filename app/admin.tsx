import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, FlatList, StatusBar, ActivityIndicator, Dimensions,
    Modal, Alert, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { 
    getFeedbacks, getAdminStats, adminSearchUsers, adminUpdateUserCards, 
    adminGrantPro, adminGetRevenueStats, adminGetGameplayStats,
    adminGetActiveRooms, adminCloseRoom, adminGetCards, adminUpsertCard, 
    adminDeleteCard, adminGetBugReports
} from '../src/services/api';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles } from '../src/constants/glass';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ADMIN_EMAIL = 'adminhr@andx.com';
const ADMIN_PASS = '123456';

type TabType = 'Overview' | 'Users' | 'Revenue' | 'Gameplay' | 'LDR' | 'CMS' | 'Support';

// --- Helper Components ---

function StatCard({ icon, label, value, color, delay }: any) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={[styles.statCard, glassStyles.container]}>
            <View style={[styles.statIconWrap, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Animated.View>
    );
}

function QuickAction({ icon, label, color, onPress }: any) {
    return (
        <TouchableOpacity style={[styles.quickBtn, glassStyles.container]} onPress={onPress}>
            <View style={[styles.quickIcon, {backgroundColor: `${color}15`}]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.quickLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

const getTypeColor = (type: string) => {
    switch(type) {
        case 'fun': return '#6366F1';
        case 'romantic': return '#EC4899';
        case 'spicy': return '#FF6B35';
        case 'ldr': return '#10B981';
        default: return '#64748B';
    }
};

export default function AdminScreen() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('Overview');
    const [loading, setLoading] = useState(false);

    // Data States
    const [stats, setStats] = useState<any>(null);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [gameplayData, setGameplayData] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [dbCards, setDbCards] = useState<any[]>([]);
    const [bugs, setBugs] = useState<any[]>([]);

    // Search/Edit States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);

    const handleLogin = () => {
        if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASS) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsLoggedIn(true);
            loadOverview();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            alert('Invalid Admin Credentials');
        }
    };

    const loadOverview = async () => {
        setLoading(true);
        try {
            const [s, f] = await Promise.all([getAdminStats(), getFeedbacks()]);
            setStats(s);
            setFeedbacks(f);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadRevenue = async () => { setLoading(true); try { setRevenueData(await adminGetRevenueStats()); } catch(e){} finally {setLoading(false);} };
    const loadGameplay = async () => { setLoading(true); try { setGameplayData(await adminGetGameplayStats()); } catch(e){} finally {setLoading(false);} };
    const loadLDR = async () => { setLoading(true); try { setRooms(await adminGetActiveRooms()); } catch(e){} finally {setLoading(false);} };
    const loadCMS = async () => { setLoading(true); try { setDbCards(await adminGetCards()); } catch(e){} finally {setLoading(false);} };
    const loadSupport = async () => { setLoading(true); try { setBugs(await adminGetBugReports()); setFeedbacks(await getFeedbacks()); } catch(e){} finally {setLoading(false);} };

    const handleTabChange = (tab: TabType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveTab(tab);
        switch(tab) {
            case 'Overview': loadOverview(); break;
            case 'Revenue': loadRevenue(); break;
            case 'Gameplay': loadGameplay(); break;
            case 'LDR': loadLDR(); break;
            case 'CMS': loadCMS(); break;
            case 'Support': loadSupport(); break;
        }
    };

    const handleUserSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try { setUsers(await adminSearchUsers(searchQuery)); } catch(e){}
        finally { setLoading(false); }
    };

    const handleGrantPro = async (status: boolean) => {
        try {
            await adminGrantPro(selectedUser.id, status);
            setSelectedUser({...selectedUser, is_pro: status});
            Alert.alert('Success', `Pro status ${status ? 'granted' : 'revoked'}`);
            handleUserSearch();
        } catch(e) { Alert.alert('Error', 'Failed to update Pro status'); }
    };

    const handleSaveUser = async () => {
        try {
            await adminUpdateUserCards(selectedUser.id, selectedUser.card_count);
            setShowUserModal(false);
            Alert.alert('Success', 'User cards updated');
            handleUserSearch();
        } catch(e) { Alert.alert('Error', 'Failed to update user'); }
    };

    const handleUpsertCard = async () => {
        try {
            await adminUpsertCard(selectedCard);
            setShowCardModal(false);
            loadCMS();
            Alert.alert('Success', 'Card content updated live');
        } catch(e) { Alert.alert('Error', 'Failed to save card'); }
    };

    const confirmDeleteCard = (id: string) => {
        Alert.alert('Delete Card', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                await adminDeleteCard(id);
                setShowCardModal(false);
                loadCMS();
            }}
        ]);
    };

    const confirmCloseRoom = (code: string) => {
        Alert.alert('Close Room', 'Force close this session?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Close', style: 'destructive', onPress: async () => {
                await adminCloseRoom(code);
                loadLDR();
            }}
        ]);
    };

    // --- Tab Renderers ---

    const renderOverview = () => (
        <View>
            <View style={styles.statsGrid}>
                <StatCard icon="people" label="Total Users" value={stats?.totalUsers || '0'} color="#6366F1" delay={0} />
                <StatCard icon="diamond" label="Pro Users" value={stats?.proUsers || '0'} color="#FF6B35" delay={100} />
                <StatCard icon="chatbubbles" label="Active Rooms" value={stats?.totalRooms || '0'} color="#10B981" delay={200} />
                <StatCard icon="star" label="Feedback" value={feedbacks.length} color="#F59E0B" delay={300} />
            </View>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickGrid}>
                <QuickAction icon="search" label="Find User" color="#6366F1" onPress={() => setActiveTab('Users')} />
                <QuickAction icon="add-circle" label="New Card" color="#10B981" onPress={() => { setActiveTab('CMS'); setSelectedCard({}); setShowCardModal(true); }} />
                <QuickAction icon="bug" label="Bugs" color="#EF4444" onPress={() => setActiveTab('Support')} />
                <QuickAction icon="wallet" label="Revenue" color="#F59E0B" onPress={() => setActiveTab('Revenue')} />
            </View>
            <Text style={styles.sectionTitle}>Recent Feedback</Text>
            {feedbacks.slice(0, 3).map((f) => (
                <View key={f.id} style={[styles.feedbackMini, glassStyles.container]}>
                    <Text style={styles.fbMiniEmail}>{f.user_email}</Text>
                    <Text style={styles.fbMiniMsg} numberOfLines={2}>{f.message}</Text>
                </View>
            ))}
        </View>
    );

    const renderUsers = () => (
        <View>
            <View style={styles.searchRow}>
                <TextInput 
                    style={[styles.searchInput, glassStyles.container]} 
                    placeholder="Search email or UUID..." 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleUserSearch}>
                    <Ionicons name="search" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
            {loading ? <ActivityIndicator color="#FF6B35" style={{marginTop: 20}} /> : (
                users.map(u => (
                    <TouchableOpacity key={u.id} style={[styles.userCard, glassStyles.container]} onPress={() => { setSelectedUser(u); setShowUserModal(true); }}>
                        <View style={styles.userHead}>
                            <Text style={styles.userName}>{u.display_name || 'Guest User'}</Text>
                            {u.is_pro && <View style={styles.proBadgeMini}><Text style={styles.proTextMini}>PRO</Text></View>}
                        </View>
                        <Text style={styles.userEmail}>{u.email}</Text>
                        <View style={styles.userFooter}>
                            <Text style={styles.userStat}><Ionicons name="card" size={12}/> {u.card_count}</Text>
                            <Text style={styles.userStat}><Ionicons name="calendar" size={12}/> {new Date(u.created_at).toLocaleDateString()}</Text>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );

    const renderRevenue = () => {
        if (!revenueData) return <ActivityIndicator color="#FF6B35" />;
        return (
            <View>
                <View style={[styles.revenueHero, glassStyles.container]}>
                    <Text style={styles.revLabel}>Total Estimated Revenue</Text>
                    <Text style={styles.revAmount}>₹{revenueData.totalRevenue}</Text>
                    <Text style={styles.revSub}>{revenueData.purchaseCount} Transactions</Text>
                </View>
                <Text style={styles.sectionTitle}>Top Card Packs (SKUs)</Text>
                <View style={styles.skuGrid}>
                    {Object.entries(revenueData.skuCounts).map(([sku, count]: any) => (
                        <View key={sku} style={[styles.skuCard, glassStyles.container]}>
                            <Text style={styles.skuName}>{sku}</Text>
                            <Text style={styles.skuValue}>{count} sales</Text>
                        </View>
                    ))}
                </View>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {revenueData.recentPurchases.map((p: any) => (
                    <View key={p.id} style={[styles.transCard, glassStyles.container]}>
                        <View>
                            <Text style={styles.transSku}>{p.sku}</Text>
                            <Text style={styles.transDate}>{new Date(p.created_at).toLocaleString()}</Text>
                        </View>
                        <Text style={styles.transAmt}>+₹{p.amount}</Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderGameplay = () => {
        if (!gameplayData) return <ActivityIndicator color="#FF6B35" />;
        return (
            <View>
                <Text style={styles.sectionTitle}>Most Popular Dares</Text>
                {Object.entries(gameplayData.popularity).sort((a:any,b:any) => b[1] - a[1]).slice(0, 5).map(([text, count]: any) => (
                    <View key={text} style={[styles.popCard, glassStyles.container]}>
                        <Text style={styles.popText} numberOfLines={1}>{text}</Text>
                        <Text style={styles.popCount}>{count} completions</Text>
                    </View>
                ))}
                <Text style={styles.sectionTitle}>Community Proof Gallery</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
                    {gameplayData.recentHistory.filter((h: any) => h.proof_uri).map((h: any) => (
                        <View key={h.id} style={styles.proofWrap}>
                            <Image source={{ uri: h.proof_uri }} style={styles.proofImg} />
                            <View style={styles.proofOverlay}>
                                <Text style={styles.proofUser}>{h.winner}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderLDR = () => (
        <View>
            <Text style={styles.sectionTitle}>Active Dual Rooms</Text>
            {rooms.map(r => (
                <View key={r.code} style={[styles.roomCard, glassStyles.container]}>
                    <View style={styles.roomInfo}>
                        <Text style={styles.roomCode}>{r.code}</Text>
                        <Text style={styles.roomUsers}>{r.host_name} & {r.guest_name || '???'}</Text>
                        <Text style={styles.roomDate}>Active: {new Date(r.updated_at).toLocaleTimeString()}</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => confirmCloseRoom(r.code)}>
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );

    const renderCMS = () => (
        <View>
            <TouchableOpacity style={styles.addNewBtn} onPress={() => { setSelectedCard({}); setShowCardModal(true); }}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.addGrad} start={{x:0, y:0}} end={{x:1, y:1}}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addText}>Add New Card</Text>
                </LinearGradient>
            </TouchableOpacity>
            {dbCards.map(c => (
                <TouchableOpacity key={c.id} style={[styles.cardListItem, glassStyles.container]} onPress={() => { setSelectedCard(c); setShowCardModal(true); }}>
                    <View style={[styles.typePill, {backgroundColor: getTypeColor(c.type)}]}>
                        <Text style={styles.pillText}>{c.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.cardListText} numberOfLines={2}>{c.text}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderSupport = () => (
        <View>
            <Text style={styles.sectionTitle}>Bug Reports</Text>
            {bugs.map(b => (
                <View key={b.id} style={[styles.bugCard, glassStyles.container]}>
                    <View style={styles.bugHead}>
                        <Text style={styles.bugStatus}>{b.status.toUpperCase()}</Text>
                        <Text style={styles.bugDate}>{new Date(b.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.bugMsg}>{b.message}</Text>
                    <Text style={styles.bugUser}>{b.user_email || 'Anonymous'}</Text>
                </View>
            ))}
            <Text style={[styles.sectionTitle, {marginTop: 20}]}>User Feedback</Text>
            {feedbacks.map(f => (
                <View key={f.id} style={[styles.fbDetailCard, glassStyles.container]}>
                    <View style={styles.fbHead}>
                        <Text style={styles.fbEmailText}>{f.user_email}</Text>
                        <Text style={styles.fbRatingText}>⭐ {f.rating}/5</Text>
                    </View>
                    <Text style={styles.fbMsgText}>{f.message}</Text>
                </View>
            ))}
        </View>
    );

    // --- Main Layout ---

    if (!isLoggedIn) {
        return (
            <AnimatedBackground colors={['#0F172A', '#1E293B', '#334155']}>
                <SafeAreaView style={styles.loginContainer}>
                    <Animated.View entering={FadeInDown.duration(600)} style={[styles.loginCard, glassStyles.container]}>
                        <View style={styles.loginIconWrap}><Ionicons name="shield-checkmark" size={40} color="#FF6B35" /></View>
                        <Text style={styles.loginTitle}>Admin Portal</Text>
                        <View style={styles.inputGroup}>
                            <TextInput style={[styles.input, glassStyles.container]} value={email} onChangeText={setEmail} placeholder="Admin Email" placeholderTextColor="#64748B" autoCapitalize="none" />
                        </View>
                        <View style={styles.inputGroup}>
                            <TextInput style={[styles.input, glassStyles.container]} value={password} onChangeText={setPassword} placeholder="••••••" placeholderTextColor="#64748B" secureTextEntry />
                        </View>
                        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                            <LinearGradient colors={['#FF6B35', '#F5511E']} style={styles.loginGradient}><Text style={styles.loginBtnText}>Unlock Dashboard</Text></LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </SafeAreaView>
            </AnimatedBackground>
        );
    }

    return (
        <AnimatedBackground colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}>
            <SafeAreaView style={styles.container}>
                <View style={[styles.header, glassStyles.header]}>
                    <View>
                        <Text style={styles.headerSubtitle}>Admin Portal</Text>
                        <Text style={styles.headerTitle}>{activeTab}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsLoggedIn(false)} style={[styles.logoutBtn, glassStyles.container]}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContent}>
                    {/* Sidebar */}
                    <View style={styles.sidebar}>
                        {(['Overview', 'Users', 'Revenue', 'Gameplay', 'LDR', 'CMS', 'Support'] as TabType[]).map(tab => (
                            <TouchableOpacity key={tab} style={[styles.tabItem, activeTab === tab && styles.tabItemActive]} onPress={() => handleTabChange(tab)}>
                                <Ionicons name={tab === 'Overview' ? 'grid' : tab === 'Users' ? 'people' : tab === 'Revenue' ? 'card' : tab === 'Gameplay' ? 'play' : tab === 'LDR' ? 'heart' : tab === 'CMS' ? 'document-text' : 'help-buoy'} size={20} color={activeTab === tab ? '#FF6B35' : '#64748B'} />
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <ScrollView style={styles.contentArea} contentContainerStyle={styles.scrollContent}>
                        {activeTab === 'Overview' && renderOverview()}
                        {activeTab === 'Users' && renderUsers()}
                        {activeTab === 'Revenue' && renderRevenue()}
                        {activeTab === 'Gameplay' && renderGameplay()}
                        {activeTab === 'LDR' && renderLDR()}
                        {activeTab === 'CMS' && renderCMS()}
                        {activeTab === 'Support' && renderSupport()}
                    </ScrollView>
                </View>

                {/* Modals */}
                <Modal 
                    visible={showUserModal} 
                    transparent 
                    animationType="slide"
                    hardwareAccelerated={true}
                    statusBarTranslucent={true}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, glassStyles.container]}>
                            <Text style={styles.modalTitle}>Manage User</Text>
                            {selectedUser && (
                                <>
                                    <Text style={styles.modalLabel}>Email: {selectedUser.email}</Text>
                                    <TextInput style={[styles.modalInput, glassStyles.container]} defaultValue={String(selectedUser.card_count)} keyboardType="numeric" onChangeText={(v) => setSelectedUser({...selectedUser, card_count: parseInt(v)})} />
                                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: selectedUser.is_pro ? '#EF4444' : '#6366F1'}]} onPress={() => handleGrantPro(!selectedUser.is_pro)}>
                                        <Text style={styles.actionBtnText}>{selectedUser.is_pro ? 'Revoke PRO' : 'Grant PRO'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveUser}><Text style={styles.saveActionText}>Save Changes</Text></TouchableOpacity>
                                </>
                            )}
                            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowUserModal(false)}><Text style={styles.closeModalText}>Cancel</Text></TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal 
                    visible={showCardModal} 
                    transparent 
                    animationType="slide"
                    hardwareAccelerated={true}
                    statusBarTranslucent={true}
                >
                    <View style={styles.modalOverlay}>
                        <ScrollView style={[styles.modalContent, glassStyles.container]}>
                            <Text style={styles.modalTitle}>{selectedCard?.id ? 'Edit Card' : 'New Card'}</Text>
                            {selectedCard && (
                                <>
                                    <TextInput style={[styles.modalInput, glassStyles.container, {height: 80}]} multiline value={selectedCard.text} onChangeText={t => setSelectedCard({...selectedCard, text: t})} />
                                    <TextInput style={[styles.modalInput, glassStyles.container, {marginTop: 10}]} value={selectedCard.type} onChangeText={t => setSelectedCard({...selectedCard, type: t})} placeholder="Type (fun/romantic/spicy/ldr)" />
                                    <TextInput style={[styles.modalInput, glassStyles.container, {marginTop: 10}]} value={selectedCard.timer ? String(selectedCard.timer) : ''} keyboardType="numeric" onChangeText={t => setSelectedCard({...selectedCard, timer: parseInt(t)})} placeholder="Timer (optional)" />
                                    <TouchableOpacity style={styles.saveActionBtn} onPress={handleUpsertCard}><Text style={styles.saveActionText}>Save Card</Text></TouchableOpacity>
                                    {selectedCard.id && (
                                        <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDeleteCard(selectedCard.id)}><Text style={styles.deleteText}>Delete Card</Text></TouchableOpacity>
                                    )}
                                </>
                            )}
                            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowCardModal(false)}><Text style={styles.closeModalText}>Cancel</Text></TouchableOpacity>
                        </ScrollView>
                    </View>
                </Modal>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loginContainer: { flex: 1, justifyContent: 'center', padding: 24 },
    loginCard: { padding: 32, borderRadius: 32, alignItems: 'center' },
    loginIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255, 107, 53, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    loginTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 24 },
    inputGroup: { width: '100%', marginBottom: 15 },
    input: { width: '100%', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, color: '#fff', fontSize: 16 },
    loginBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 12 },
    loginGradient: { paddingVertical: 18, alignItems: 'center' },
    loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
    headerSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
    logoutBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    mainContent: { flex: 1, flexDirection: 'row' },
    sidebar: { width: 70, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.05)', alignItems: 'center', gap: 15, paddingVertical: 10 },
    tabItem: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    tabItemActive: { backgroundColor: 'rgba(255, 107, 53, 0.1)' },
    tabText: { fontSize: 9, color: '#64748B', fontWeight: '700', marginTop: 4 },
    tabTextActive: { color: '#FF6B35' },
    contentArea: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statCard: { width: (width - 100) / 2, padding: 16, borderRadius: 20 },
    statIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    statLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 16, marginTop: 10 },
    quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    quickBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 16 },
    quickIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    quickLabel: { fontSize: 10, fontWeight: '800', color: '#475569' },
    feedbackMini: { padding: 12, borderRadius: 16, marginBottom: 8 },
    fbMiniEmail: { fontSize: 11, fontWeight: '800', color: '#6366F1' },
    fbMiniMsg: { fontSize: 12, color: '#475569', marginTop: 2 },
    searchRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    searchInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, fontSize: 14 },
    searchBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' },
    userCard: { padding: 16, borderRadius: 20, marginBottom: 10 },
    userHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    userName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    userEmail: { fontSize: 13, color: '#64748B', marginBottom: 10 },
    userFooter: { flexDirection: 'row', gap: 15 },
    userStat: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
    proBadgeMini: { backgroundColor: '#FF6B35', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    proTextMini: { color: '#fff', fontSize: 9, fontWeight: '900' },
    revenueHero: { padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 24 },
    revLabel: { fontSize: 13, color: '#64748B', fontWeight: '700', marginBottom: 8 },
    revAmount: { fontSize: 36, fontWeight: '900', color: '#1E293B' },
    revSub: { fontSize: 14, color: '#10B981', fontWeight: '700', marginTop: 4 },
    skuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    skuCard: { width: (width - 106) / 2, padding: 16, borderRadius: 16 },
    skuName: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 4 },
    skuValue: { fontSize: 16, fontWeight: '900', color: '#FF6B35' },
    transCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8 },
    transSku: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    transDate: { fontSize: 11, color: '#94A3B8' },
    transAmt: { fontSize: 15, fontWeight: '900', color: '#10B981' },
    popCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8 },
    popText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#475569', marginRight: 10 },
    popCount: { fontSize: 12, fontWeight: '800', color: '#6366F1' },
    gallery: { marginHorizontal: -16, paddingHorizontal: 16, marginBottom: 24 },
    proofWrap: { width: 120, height: 160, borderRadius: 16, marginRight: 12, overflow: 'hidden' },
    proofImg: { width: '100%', height: '100%' },
    proofOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)' },
    proofUser: { color: '#fff', fontSize: 10, fontWeight: '800' },
    roomCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8 },
    roomInfo: { flex: 1 },
    roomCode: { fontSize: 16, fontWeight: '900', color: '#FF6B35' },
    roomUsers: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 2 },
    roomDate: { fontSize: 11, color: '#94A3B8' },
    closeBtn: { padding: 4 },
    addNewBtn: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
    addGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
    addText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    cardListItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 8, gap: 12 },
    cardListText: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '600' },
    typePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pillText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    bugCard: { padding: 16, borderRadius: 20, marginBottom: 10 },
    bugHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    bugStatus: { fontSize: 10, fontWeight: '900', color: '#EF4444' },
    bugDate: { fontSize: 11, color: '#94A3B8' },
    bugMsg: { fontSize: 14, color: '#1E293B', fontWeight: '700', marginBottom: 8 },
    bugUser: { fontSize: 11, color: '#64748B' },
    fbDetailCard: { padding: 16, borderRadius: 20, marginBottom: 10 },
    fbHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    fbEmailText: { fontSize: 12, fontWeight: '800', color: '#6366F1' },
    fbRatingText: { fontSize: 12, fontWeight: '800', color: '#F59E0B' },
    fbMsgText: { fontSize: 14, color: '#475569', lineHeight: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { padding: 24, borderRadius: 32, backgroundColor: '#fff' },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    modalLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 8, marginTop: 12 },
    modalInput: { padding: 16, borderRadius: 16, fontSize: 15, color: '#1E293B', backgroundColor: 'rgba(0,0,0,0.03)' },
    actionBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 24 },
    actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    saveActionBtn: { backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 },
    saveActionText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    closeModalBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 10 },
    closeModalText: { color: '#94A3B8', fontWeight: '700' },
    deleteBtn: { marginTop: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
    deleteText: { color: '#EF4444', fontWeight: '700' }
});
