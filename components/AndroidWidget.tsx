import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface AndroidWidgetProps {
    content: string;
    type: 'text' | 'drawing' | 'collage';
    timestamp: number;
    color?: string;
}

export function AndroidWidget({ content, type, timestamp, color = '#FFFFFF' }: AndroidWidgetProps) {
    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 16,
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
        >
            <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <TextWidget
                    text="Daily Note"
                    style={{ fontSize: 14, color: '#8E8E93', fontWeight: 'bold' }}
                />
            </FlexWidget>

            <FlexWidget
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 8
                }}
            >
                {type === 'text' ? (
                    <TextWidget
                        text={content}
                        style={{
                            fontSize: 24,
                            color: color === '#FFFFFF' ? '#1C1C1E' : color,
                            fontFamily: 'Inter_700Bold',
                            textAlign: 'center'
                        }}
                    />
                ) : (
                    <TextWidget
                        text={type === 'drawing' ? '🎨 New Drawing' : '📸 New Collage'}
                        style={{ fontSize: 18, color: '#1C1C1E' }}
                    />
                )}
            </FlexWidget>

            <FlexWidget style={{ alignSelf: 'flex-end' }}>
                <TextWidget
                    text={new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    style={{ fontSize: 12, color: '#C7C7CC' }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}
