import React from 'react';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

interface AndroidWidgetProps {
    content: string;
    type: 'text' | 'drawing' | 'collage';
    timestamp: number;
    color?: string;
    streak?: number;
    hasPartnerNote?: boolean;
    partnerName?: string;
}

export function AndroidWidget({
    content,
    type,
    timestamp,
    color = '#FFFFFF',
    streak = 0,
    hasPartnerNote = true,
    partnerName = 'Partner',
    // Font styles
    fontFamily,
    fontWeight,
    fontStyle,
    textDecorationLine
}: AndroidWidgetProps & {
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecorationLine?: string;
}) {

    // Parse content for drawing/collage
    let imageSource = '';

    if (type === 'drawing') {
        try {
            const parsed = JSON.parse(content);
            if (parsed.preview) imageSource = parsed.preview;
        } catch (e) { }
    }

    if (!hasPartnerNote) {
        return (
            <FlexWidget
                style={{
                    height: 'match_parent',
                    width: 'match_parent',
                    backgroundColor: '#1C1C1E', // Dark background
                    borderRadius: 24,
                    padding: 16,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <TextWidget text="💔" style={{ fontSize: 40, marginBottom: 12 }} />
                <TextWidget
                    text="No Connection"
                    style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 'bold' }}
                />
                <TextWidget
                    text="Ask your partner to send a note!"
                    style={{ fontSize: 14, color: '#8E8E93', marginTop: 8 }}
                />
            </FlexWidget>
        );
    }

    const noteColor = color === '#FFFFFF' ? '#000000' : color;
    const bgColor = '#FFFFFF'; // Keep widget background clean white/light

    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: bgColor,
                borderRadius: 24,
                padding: 16,
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
        >
            {/* Header: Lovii + Streak */}
            <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 'match_parent' }}>
                <TextWidget
                    text="Lovii" // Branding
                    style={{ fontSize: 18, color: '#FF231F7C', fontWeight: 'bold', fontFamily: 'sans-serif-medium' }}
                />

                <FlexWidget style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFF0F5', // Light pink pill
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4
                }}>
                    <TextWidget text="🔥" style={{ fontSize: 14, marginRight: 4 }} />
                    <TextWidget
                        text={`${streak}`}
                        style={{ fontSize: 14, color: '#FF231F7C', fontWeight: 'bold' }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* Content Body */}
            <FlexWidget
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 12
                }}
            >
                {type === 'text' ? (
                    <TextWidget
                        text={content}
                        style={{
                            fontSize: 22,
                            color: noteColor as any,
                            fontWeight: (fontWeight as any) || 'bold',
                            fontStyle: (fontStyle as any) || 'normal',
                            // textDecorationLine not supported by widget lib
                            textAlign: 'center',
                            fontFamily: (fontFamily as any) || 'sans-serif-medium'
                        }}
                        maxLines={3}
                    />
                ) : imageSource ? (
                    <ImageWidget
                        image={imageSource as any}
                        imageWidth={160}
                        imageHeight={160}
                        radius={16}
                        style={{ width: 160, height: 160 }}
                    />
                ) : (
                    <FlexWidget style={{ alignItems: 'center' }}>
                        <TextWidget text={type === 'drawing' ? '🎨' : '📸'} style={{ fontSize: 32, marginBottom: 8 }} />
                        <TextWidget
                            text={type === 'drawing' ? 'New Drawing' : 'New Collage'}
                            style={{ fontSize: 18, color: '#1C1C1E' }}
                        />
                    </FlexWidget>
                )}
            </FlexWidget>

            {/* Footer: Date + Partner Name */}
            <FlexWidget style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: 'match_parent',
                borderTopColor: '#F2F2F7',
                borderTopWidth: 1,
                paddingTop: 8
            }}>
                <TextWidget
                    text={`From ${partnerName}`}
                    style={{ fontSize: 12, color: '#8E8E93', fontWeight: 'bold' }}
                    maxLines={1}
                />
                <TextWidget
                    text={new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    style={{ fontSize: 12, color: '#C7C7CC' }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}
