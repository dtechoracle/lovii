import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FILTERS = [
    { label: 'All', count: null },
    { label: 'Pinned', count: null },
    { label: 'Bookmarked', count: null },
];

export default function FilterChips() {
    const [selected, setSelected] = React.useState('All');

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {FILTERS.map((f) => {
                    const isSelected = selected === f.label;
                    return (
                        <TouchableOpacity
                            key={f.label}
                            style={[styles.chip, isSelected && styles.chipSelected]}
                            onPress={() => setSelected(f.label)}
                        >
                            <Text style={[styles.text, isSelected && styles.textSelected]}>
                                {f.label} {f.count !== null ? `(${f.count})` : ''}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    scroll: {
        gap: 12,
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    chipSelected: {
        backgroundColor: '#FFD60A', // Yellow
        borderColor: '#FFD60A',
    },
    text: {
        color: '#8E8E93',
        fontWeight: '600',
        fontSize: 14,
    },
    textSelected: {
        color: '#000',
        fontWeight: '700',
    },
});
