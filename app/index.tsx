import { StorageService } from '@/services/storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

export default function Splash() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        // Artificial delay for splash effect (optional, but nice)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const user = await StorageService.getProfile();
        if (user) {
            router.replace('/(tabs)');
        } else {
            router.replace('/auth/login');
        }
    };

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/images/react-logo.png')} // Fallback or app logo if available?
                // Actually let's use a nice text or color background if no logo
                style={{ width: 100, height: 100, opacity: 0 }} // Hidden for now, just background
            />
            <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000'
    }
});
