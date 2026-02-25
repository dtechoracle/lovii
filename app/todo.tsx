import ScreenHeader from '@/components/ScreenHeader';
import OutlinedCard from '@/components/ui/OutlinedCard';
import { useTheme } from '@/context/ThemeContext';
import { StorageService, Task } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TodoScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

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

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedTasks);
        if (newSelected.has(id)) {
            newSelected.delete(id);
            if (newSelected.size === 0) setIsSelectionMode(false);
        } else {
            newSelected.add(id);
        }
        setSelectedTasks(newSelected);
    };

    const handleLongPress = (id: string) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            toggleSelection(id);
        }
    };

    const sendSelectedToWidget = async () => {
        const tasksToSend = tasks.filter(t => selectedTasks.has(t.id));
        if (tasksToSend.length === 0) return;

        const result = await StorageService.sendTasksToWidget(tasksToSend);
        if (result.success) {
            Alert.alert("Sent!", `${tasksToSend.length} tasks are now on your partner's widget! 🚀`);
            setIsSelectionMode(false);
            setSelectedTasks(new Set());
        } else {
            Alert.alert("Error", result.error || "Failed to send to widget.");
        }
    };

    const renderItem = ({ item }: { item: Task }) => {
        const isOverdue = item.dueDate && item.dueDate < Date.now() && !item.completed;
        const assignmentColor = item.assignedTo === 'me' ? theme.primary : item.assignedTo === 'partner' ? theme.tint : theme.textSecondary;

        const isSelected = selectedTasks.has(item.id);

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => isSelectionMode ? toggleSelection(item.id) : toggleTask(item.id)}
                onLongPress={() => handleLongPress(item.id)}
            >
                <OutlinedCard style={[
                    styles.item,
                    { backgroundColor: theme.card },
                    item.completed && styles.itemDone,
                    isSelected && { borderColor: theme.primary, borderWidth: 2 }
                ]}>
                    <View style={styles.itemLeft}>
                        {isSelectionMode ? (
                            <View style={[styles.selectCircle, isSelected && { backgroundColor: theme.primary }]}>
                                {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.checkBtn} onPress={() => toggleTask(item.id)}>
                                <Ionicons
                                    name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                                    size={24}
                                    color={item.completed ? theme.success : theme.textSecondary}
                                />
                            </TouchableOpacity>
                        )}
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
                    {!isSelectionMode && (
                        <View style={styles.itemRight}>
                            <TouchableOpacity style={styles.widgetBtn} onPress={async () => {
                                // Fallback for single task send
                                const result = await StorageService.sendTasksToWidget([item]);
                                if (result.success) {
                                    Alert.alert("Sent!", "This task is now on your partner's widget! 🚀");
                                } else {
                                    Alert.alert("Error", result.error || "Failed to send to widget.");
                                }
                            }}>
                                <Ionicons name="share-outline" size={20} color={theme.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(item.id)}>
                                <Ionicons name="trash-outline" size={20} color={theme.error} />
                            </TouchableOpacity>
                        </View>
                    )}
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

            <View style={styles.headerRow}>
                <ScreenHeader title={isSelectionMode ? `${selectedTasks.size} Selected` : "Tasks"} showBack />
                {isSelectionMode && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsSelectionMode(false); setSelectedTasks(new Set()); }}>
                        <Text style={[styles.cancelText, { color: theme.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>

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

            {isSelectionMode ? (
                <View style={styles.selectionFooter}>
                    <TouchableOpacity
                        style={[styles.sendMultipleBtn, selectedTasks.size === 0 && { opacity: 0.5 }]}
                        disabled={selectedTasks.size === 0}
                        onPress={sendSelectedToWidget}
                    >
                        <Ionicons name="share-outline" size={24} color="#FFF" />
                        <Text style={styles.sendMultipleText}>Send to Widget</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { outlineStyle: 'none' } as any]}
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
            )}
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
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
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
    widgetBtn: {
        padding: 8,
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
    selectCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#C7C7CC',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 24,
    },
    cancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
    selectionFooter: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: 'transparent',
    },
    sendMultipleBtn: {
        backgroundColor: '#4B6EFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 24,
        gap: 8,
    },
    sendMultipleText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
