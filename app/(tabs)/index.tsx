import GenderPickerModal from '@/components/GenderPickerModal';
import FloatingBar from '@/components/home/FloatingBar';
import GalleryCard from '@/components/home/GalleryCard';
import TaskCard from '@/components/home/TaskCard';
import { ThemedText } from '@/components/themed-text';
import OutlinedCard from '@/components/ui/OutlinedCard';
import WidgetCard from '@/components/WidgetCard';
import { useTheme } from '@/context/ThemeContext';
import { Note, StorageService, UserProfile } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [latestNote, setLatestNote] = useState<Note | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);

  // 1. Load Data & Check Profile
  const loadData = async () => {
    let p = await StorageService.getProfile();

    // Create profile if missing (fallback)
    if (!p) {
      p = await StorageService.createProfile();
    }
    setProfile(p);

    // CRITICAL: Force Modal if gender is missing
    if (!p.gender) {
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
      <StatusBar barStyle="dark-content" />

      {/* Search Bar / Header Mock */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Search notes..."
            placeholderTextColor="#8E8E93"
            style={styles.searchInput}
          />
        </View>
        <Link href="/connect" asChild>
          <TouchableOpacity style={styles.profilePic}>
            <Ionicons name="person" size={20} color="#FFF" />
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={theme.tint} />}
      >
        {/* Removed "Hello User" per request */}
        {/* Helper text only if new */}
        {!latestNote && <ThemedText style={styles.helperText}>Tap the + below to create your first note.</ThemedText>}

        {/* Hero Card - Widget */}
        <WidgetCard
          note={latestNote}
          onPress={() => router.push('/editor')}
        />

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pin" size={18} color={theme.tint} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>Pinned</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {pinnedNotes.map(note => (
                <TouchableOpacity key={note.id} activeOpacity={0.8} style={styles.miniCardWrapper}>
                  <OutlinedCard style={styles.miniCard}>
                    {note.type === 'text' && (
                      <ThemedText style={styles.miniCardText} numberOfLines={3}>
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
                    {note.type === 'drawing' && (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="brush" size={32} color={note.color || theme.tint} />
                      </View>
                    )}
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

      </ScrollView>

      <FloatingBar />

      <GenderPickerModal
        visible={showModal}
        onSelect={() => {
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
    paddingBottom: 80, // Space for phone's bottom navbar
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
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1C1C1E',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  helperText: {
    fontSize: 16,
    color: '#8E8E93',
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
    backgroundColor: '#4B6EFF', // Soft Blue
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#1C1C1E',
  },
  horizontalScroll: {
    paddingHorizontal: 4,
    paddingBottom: 16, // Space for shadow
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  miniCardText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
    textAlign: 'center',
  },
});
