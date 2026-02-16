import ScreenHeader from '@/components/ScreenHeader';
import OutlinedCard from '@/components/ui/OutlinedCard';
import { useTheme } from '@/context/ThemeContext';
import { StorageService, Task } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TodoScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const t = await StorageService.getTasks();
        setTasks(t);
    };

    const handleAddTask = async () => {
        if (!newTask.trim()) return;
        const t: Task = {
            id: Date.now().toString(),
            text: newTask,
            completed: false,
            assignedTo: 'both',
            category: 'other',
        };
        const updated = [t, ...tasks];
        setTasks(updated);
        await StorageService.saveTasks(updated);
        setNewTask('');
    };

    const toggleTask = async (id: string) => {
        const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setTasks(updated);
        await StorageService.saveTasks(updated);
    };

    const deleteTask = async (id: string) => {
        const updated = tasks.filter(t => t.id !== id);
        setTasks(updated);
        await StorageService.saveTasks(updated);
    };

    const renderItem = ({ item }: { item: Task }) => {
        const isOverdue = item.dueDate && item.dueDate < Date.now() && !item.completed;
        const assignmentColor = item.assignedTo === 'me' ? theme.primary : item.assignedTo === 'partner' ? theme.tint : theme.textSecondary;

        return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => toggleTask(item.id)}>
                <OutlinedCard style={[styles.item, { backgroundColor: theme.card }, item.completed && styles.itemDone]}>
                    <View style={styles.itemLeft}>
                        <TouchableOpacity style={styles.checkBtn} onPress={() => toggleTask(item.id)}>
                            <Ionicons
                                name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                                size={24}
                                color={item.completed ? theme.success : theme.textSecondary}
                            />
                        </TouchableOpacity>
                        <View style={styles.itemContent}>
                            <Text style={[styles.itemText, { color: theme.text }, item.completed && styles.itemTextDone]}>
                                {item.text}
                            </Text>
                            <View style={styles.itemMeta}>
                                {item.assignedTo && (
                                    <View style={[styles.assignmentBadge, { backgroundColor: assignmentColor + '15' }]}>
                                        <Ionicons name="person" size={10} color={assignmentColor} />
                                        <Text style={[styles.badgeText, { color: assignmentColor }]}>
                                            {item.assignedTo === 'me' ? 'You' : item.assignedTo === 'partner' ? 'Partner' : 'Both'}
                                        </Text>
                                    </View>
                                )}
                                {item.dueDate && (
                                    <View style={[styles.dueBadge, isOverdue ? { backgroundColor: theme.error + '15' } : undefined]}>
                                        <Ionicons name="calendar-outline" size={10} color={isOverdue ? theme.error : theme.textSecondary} />
                                        <Text style={[styles.badgeText, { color: isOverdue ? theme.error : theme.textSecondary }]}>
                                            {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(item.id)}>
                        <Ionicons name="trash-outline" size={20} color={theme.error} />
                    </TouchableOpacity>
                </OutlinedCard>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <StatusBar barStyle="dark-content" />
            <ScreenHeader title="Tasks" showBack />

            <View style={{ flex: 1 }}>
                <FlatList
                    data={tasks}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="checkbox-outline" size={64} color="#C7C7CC" />
                            <Text style={styles.emptyText}>No tasks yet</Text>
                        </View>
                    }
                />
            </View>

            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Add a new task..."
                        placeholderTextColor="#8E8E93"
                        value={newTask}
                        onChangeText={setNewTask}
                        onSubmitEditing={handleAddTask}
                        autoCapitalize="sentences"
                        autoCorrect={true}
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddTask}>
                        <Ionicons name="arrow-up" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 100,
        gap: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 24,
    },
    itemDone: {
        opacity: 0.5,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    checkBtn: {
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
        gap: 6,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemTextDone: {
        textDecorationLine: 'line-through',
    },
    itemMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    assignmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    dueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    deleteBtn: {
        padding: 8,
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 18,
        fontWeight: '600',
    },
    inputContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        // Soft Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    input: {
        flex: 1,
        color: '#1C1C1E',
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 8,
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4B6EFF', // Primary
        alignItems: 'center',
        justifyContent: 'center',
    },
});
