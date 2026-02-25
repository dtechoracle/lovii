import FloatingBar from '@/components/home/FloatingBar';
import GalleryCard from '@/components/home/GalleryCard';
import TaskCard from '@/components/home/TaskCard';
import { ThemedText } from '@/components/themed-text';
import ThemePickerModal from '@/components/ThemePickerModal';
import OutlinedCard from '@/components/ui/OutlinedCard';
import WidgetCard from '@/components/WidgetCard';
import { useTheme } from '@/context/ThemeContext';
import { Note, StorageService, UserProfile } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const PointsRing = ({ points, max = 10 }: { points: number; max?: number }) => {
  const size = 32;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Ring drains as points are spent — capped between 0 and 1
  const progress = max > 0 ? Math.min(Math.max(points / max, 0), 1) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          {points > 0 && <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FF6B6B"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />}
        </G>
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Ionicons name="diamond" size={14} color="#FF6B6B" />
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { theme, themePreference, isDark } = useTheme();
  const [latestNote, setLatestNote] = useState<Note | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [streak, setStreak] = useState(0);
  const [streakJustBroke, setStreakJustBroke] = useState(false);
  const [restoringStreak, setRestoringStreak] = useState(false);

  // 1. Load Data & Check Profile
  const loadData = async () => {
    let p = await StorageService.getProfile();

    // Create profile if missing (fallback)
    if (!p) {
      p = await StorageService.createProfile();
    }
    setProfile(p);

    // CRITICAL: Force Modal if theme preference is missing (migration from gender)
    if (!p.themePreference && !p.gender) {
      setShowModal(true);
    }

    // Get the absolute latest note from either me or partner
    const pNotes = await StorageService.getPartnerNotes();
    const mHistory = await StorageService.getMyHistory();

    // Combine and sort
    const allNotes = [...pNotes, ...mHistory].sort((a, b) => b.timestamp - a.timestamp);

    if (allNotes.length > 0) {
      setLatestNote(allNotes[0]);
    }

    // Get pinned notes
    const pinned = mHistory.filter(n => n.pinned);
    setPinnedNotes(pinned);

    // Calculate bidirectional streak
    const restoredDays = await StorageService.getRestoredStreakDays();
    const toMidnight = (ts: number) => {
      const d = new Date(ts);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    };
    const myDays = new Set([...mHistory.map(n => toMidnight(n.timestamp)), ...restoredDays]);
    const partnerDaySet = new Set([...pNotes.map(n => toMidnight(n.timestamp)), ...restoredDays]);
    const bothSentDays = Array.from(myDays).filter(d => partnerDaySet.has(d)).sort((a, b) => b - a);
    const today = toMidnight(Date.now());
    const oneDay = 86400000;

    let currentStreak = 0;
    if (bothSentDays.length > 0 && bothSentDays[0] >= today - oneDay) {
      currentStreak = 1;
      let expected = bothSentDays[0] - oneDay;
      for (let i = 1; i < bothSentDays.length; i++) {
        if (bothSentDays[i] === expected) { currentStreak++; expected -= oneDay; } else break;
      }
    }
    setStreak(currentStreak);

    // Detect if streak just broke: last mutual day was exactly yesterday
    const lastMutual = bothSentDays[0];
    const broke = currentStreak === 0 && lastMutual === today - oneDay;
    setStreakJustBroke(broke);
  };

  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const pNotes = await StorageService.getPartnerNotes();
    const mHistory = await StorageService.getMyHistory();
    const allNotes = [...pNotes, ...mHistory];

    const results = allNotes.filter(note => {
      const searchLower = query.toLowerCase();

      // Search in text content
      if (note.type === 'text' && note.content.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in note type
      if (note.type.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in color
      if (note.color && note.color.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search by date
      const dateStr = new Date(note.timestamp).toLocaleDateString().toLowerCase();
      if (dateStr.includes(searchLower)) {
        return true;
      }

      // Search in tasks content
      if (note.type === 'tasks' && note.tasks) {
        const taskMatch = note.tasks.some(t => t.text.toLowerCase().includes(searchLower));
        if (taskMatch) return true;
      }

      return false;
    }).sort((a, b) => b.timestamp - a.timestamp);

    setSearchResults(results);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Search Bar / Header */}
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            placeholder="Search notes..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <Link href="/pricing" asChild>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.card }]}>
            <PointsRing points={profile?.points || 0} max={profile?.maxPoints || 10} />
          </TouchableOpacity>
        </Link>
        <Link href="/connect" asChild>
          <TouchableOpacity style={[styles.profilePic, { backgroundColor: theme.primary }]}>
            <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              {profile?.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  style={{ width: 44, height: 44 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={20} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={theme.tint} />}
      >
        {/* Search Results */}
        {isSearching ? (
          <View style={styles.searchSection}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: theme.text }]}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </ThemedText>
            {searchResults.length === 0 ? (
              <View style={styles.emptySearch}>
                <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No notes found
                </ThemedText>
              </View>
            ) : (
              <View style={styles.searchResultsGrid}>
                {searchResults.map(note => (
                  <TouchableOpacity
                    key={note.id}
                    activeOpacity={0.8}
                    style={styles.searchResultCard}
                    onPress={() => router.push('/history')}
                  >
                    <OutlinedCard style={[styles.miniCard, { backgroundColor: theme.card }]}>
                      {note.type === 'text' && (
                        <ThemedText style={[styles.miniCardText, { color: theme.text }]} numberOfLines={3}>
                          {note.content}
                        </ThemedText>
                      )}
                      {note.type === 'collage' && note.images && note.images.length > 0 && (
                        <Image
                          source={{ uri: note.images[0] }}
                          style={{ width: '100%', height: '100%', borderRadius: 20 }}
                          resizeMode="cover"
                        />
                      )}
                      {note.type === 'music' && (() => {
                        let track = note.musicTrack;
                        if (!track) { try { track = JSON.parse(note.content); } catch (e) { } }
                        if (track) {
                          return (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                              <Image source={{ uri: track.coverUrl }} style={{ width: '100%', height: '100%', borderRadius: 20, position: 'absolute', opacity: 0.4 }} resizeMode="cover" />
                              <Ionicons name="musical-notes" size={32} color={theme.primary} />
                            </View>
                          );
                        }
                        return null;
                      })()}
                      {note.type === 'drawing' && (() => {
                        let preview: string | null = null;
                        try {
                          const parsed = JSON.parse(note.content);
                          if (parsed.preview) preview = parsed.preview;
                        } catch (e) { }

                        if (preview) {
                          return (
                            <Image
                              source={{ uri: preview }}
                              style={{ width: '100%', height: '100%', borderRadius: 20 }}
                              resizeMode="cover"
                            />
                          );
                        }

                        return (
                          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="brush" size={32} color={note.color || theme.tint} />
                          </View>
                        );
                      })()}
                    </OutlinedCard>
                    <ThemedText style={[styles.searchResultDate, { color: theme.textSecondary }]}>
                      {new Date(note.timestamp).toLocaleDateString()}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Helper text only if new */}
            {!latestNote && <ThemedText style={[styles.helperText, { color: theme.textSecondary }]}>
              Tap the + below to create your first note.
            </ThemedText>}

            {/* Streak Restore Banner — shows when streak just broke */}
            {streakJustBroke && (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={restoringStreak}
                onPress={async () => {
                  setRestoringStreak(true);
                  const result = await StorageService.restoreStreak();
                  setRestoringStreak(false);
                  if (result.success) {
                    setStreakJustBroke(false);
                    await loadData();
                    Alert.alert('🔥 Streak Restored!', 'Your streak is back! Keep it going together.');
                  } else {
                    Alert.alert('Cannot Restore', result.error || 'Failed to restore streak.');
                  }
                }}
                style={[styles.streakBanner, { backgroundColor: '#FF6B00' }]}
              >
                <Ionicons name="flame" size={20} color="#FFF" />
                <Text style={styles.streakBannerText}>
                  {restoringStreak ? 'Restoring...' : 'Streak broke! Restore for 5 💎'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#FFF" />
              </TouchableOpacity>
            )}

            {/* Hero Card - Widget */}
            <WidgetCard
              note={latestNote}
              onPress={() => router.push('/editor')}
              partnerName={profile?.partnerName || 'Partner'}
              myUserId={profile?.id}
              onNoteUpdate={loadData}
            />

            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pin" size={18} color={theme.tint} />
                  <ThemedText type="subtitle" style={[styles.sectionTitle, { color: theme.text }]}>Pinned</ThemedText>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {pinnedNotes.map(note => (
                    <TouchableOpacity key={note.id} activeOpacity={0.8} style={styles.miniCardWrapper} onPress={() => router.push('/history')}>
                      <OutlinedCard style={[styles.miniCard, { backgroundColor: theme.card }]}>
                        {note.type === 'text' && (
                          <ThemedText style={[styles.miniCardText, { color: theme.text }]} numberOfLines={3}>
                            {note.content}
                          </ThemedText>
                        )}
                        {note.type === 'collage' && note.images && note.images.length > 0 && (
                          <Image
                            source={{ uri: note.images[0] }}
                            style={{ width: '100%', height: '100%', borderRadius: 20 }}
                            resizeMode="cover"
                          />
                        )}
                        {note.type === 'music' && (() => {
                          let track = note.musicTrack;
                          if (!track) { try { track = JSON.parse(note.content); } catch (e) { } }
                          if (track) {
                            return (
                              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <Image source={{ uri: track.coverUrl }} style={{ width: '100%', height: '100%', borderRadius: 20, position: 'absolute', opacity: 0.4 }} resizeMode="cover" />
                                <Ionicons name="musical-notes" size={32} color={theme.primary} />
                              </View>
                            );
                          }
                          return null;
                        })()}
                        {note.type === 'drawing' && (() => {
                          let preview: string | null = null;
                          try {
                            const parsed = JSON.parse(note.content);
                            if (parsed.preview) preview = parsed.preview;
                          } catch (e) { }

                          if (preview) {
                            return (
                              <Image
                                source={{ uri: preview }}
                                style={{ width: '100%', height: '100%', borderRadius: 20 }}
                                resizeMode="cover"
                              />
                            );
                          }

                          return (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                              <Ionicons name="brush" size={32} color={note.color || theme.tint} />
                            </View>
                          );
                        })()}
                      </OutlinedCard>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Features Grid - Soft Style */}
            <View style={styles.grid}>
              <View style={styles.gridCol}>
                <TaskCard />
              </View>
              <View style={styles.gridCol}>
                <GalleryCard />
              </View>
            </View>

            {/* Bottom Spacer for Floating Bar */}
            <View style={{ height: 100 }} />
          </>
        )}

      </ScrollView>

      <FloatingBar />

      <ThemePickerModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          loadData(); // Reload to apply theme
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FF6B00',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 16,
  },
  streakBannerText: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: -8,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  gridCol: {
    flex: 1,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  horizontalScroll: {
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  miniCardWrapper: {
    marginRight: 16,
  },
  miniCard: {
    width: 140,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
  },
  miniCardText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  searchSection: {
    marginTop: 16,
  },
  emptySearch: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  searchResultCard: {
    width: '47%',
    gap: 8,
  },
  searchResultDate: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
