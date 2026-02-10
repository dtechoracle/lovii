import FilterChips from '@/components/home/FilterChips';
import FloatingBar from '@/components/home/FloatingBar';
import GalleryCard from '@/components/home/GalleryCard';
import TaskCard from '@/components/home/TaskCard';
import ScreenHeader from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import WidgetCard from '@/components/WidgetCard';
import { Colors } from '@/constants/theme';
import { Note, StorageService, UserProfile } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [latestNote, setLatestNote] = useState<Note | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);
  const [bookmarkedNotes, setBookmarkedNotes] = useState<Note[]>([]);

  const loadData = async () => {
    const p = await StorageService.getProfile();
    setProfile(p);

    // Get the absolute latest note from either me or partner
    const pNotes = await StorageService.getPartnerNotes();
    const mHistory = await StorageService.getMyHistory();

    // Combine and sort
    const allNotes = [...pNotes, ...mHistory].sort((a, b) => b.timestamp - a.timestamp);

    if (allNotes.length > 0) {
      setLatestNote(allNotes[0]);
    }

    // Get pinned and bookmarked notes
    const pinned = mHistory.filter(n => n.pinned);
    const bookmarked = mHistory.filter(n => n.bookmarked);
    setPinnedNotes(pinned);
    setBookmarkedNotes(bookmarked);
  };

  // Initialize profile on first launch
  useEffect(() => {
    const initProfile = async () => {
      let profile = await StorageService.getProfile();
      if (!profile) {
        profile = await StorageService.createProfile();
      }
      setProfile(profile);
    };
    initProfile();
  }, []);

  // Subscribe to partner's notes
  useEffect(() => {
    const subscription = StorageService.subscribeToPartnerNotes((note) => {
      console.log('New note from partner:', note);
      loadData(); // Refresh data when partner sends a note
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={Colors.dark.primary} />}
      >
        <ScreenHeader
          rightAction={
            <Link href="/connect" asChild>
              <TouchableOpacity style={styles.profilePic}>
                <Ionicons name="person" size={20} color="#FFF" />
              </TouchableOpacity>
            </Link>
          }
        />

        <ThemedText type="title" style={styles.appTitle}>Your Notes</ThemedText>

        <FilterChips />

        {/* Hero Card - Widget */}
        <WidgetCard
          note={latestNote}
          onPress={() => router.push('/editor')}
        />

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pin" size={20} color="#FFD60A" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>Pinned</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {pinnedNotes.map(note => (
                <TouchableOpacity key={note.id} style={styles.miniCard}>
                  <ThemedText style={styles.miniCardText} numberOfLines={2}>
                    {note.type === 'text' ? note.content : note.type === 'collage' ? '📸 Collage' : '🎨 Drawing'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bookmarked Notes */}
        {bookmarkedNotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bookmark" size={20} color="#FFD60A" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>Bookmarked</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {bookmarkedNotes.map(note => (
                <TouchableOpacity key={note.id} style={styles.miniCard}>
                  <ThemedText style={styles.miniCardText} numberOfLines={2}>
                    {note.type === 'text' ? note.content : note.type === 'collage' ? '📸 Collage' : '🎨 Drawing'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bento Grid */}
        <View style={styles.bentoRow}>
          <TaskCard />
          <GalleryCard />
        </View>

        {/* Bottom Spacer for Floating Bar */}
        <View style={{ height: 100 }} />

      </ScrollView>

      <FloatingBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  appTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  horizontalScroll: {
    gap: 12,
    paddingHorizontal: 4,
  },
  miniCard: {
    width: 150,
    height: 80,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    justifyContent: 'center',
  },
  miniCardText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
});
