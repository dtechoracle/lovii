declare module 'react-native-shared-group-preferences' {
    export interface SharedGroupPreferences {
        isAppGroupAvailable(group: string): Promise<boolean>;
        setItem(key: string, value: any, group: string): Promise<void>;
        getItem(key: string, group: string): Promise<any>;
    }
    const sharedGroupPreferences: SharedGroupPreferences;
    export default sharedGroupPreferences;
}
