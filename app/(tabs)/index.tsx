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
import { Image, RefreshControl, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, themePreference } = useTheme();
  const [latestNote, setLatestNote] = useState<Note | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
      <StatusBar barStyle="dark-content" />

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
        <Link href="/connect" asChild>
          <TouchableOpacity style={[styles.profilePic, { backgroundColor: theme.primary }]}>
            {profile?.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={20} color="#FFF" />
            )}
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
                    <TouchableOpacity key={note.id} activeOpacity={0.8} style={styles.miniCardWrapper}>
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
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
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
