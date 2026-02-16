import React from 'react';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

interface AndroidWidgetProps {
    content: string;
    type: 'text' | 'drawing' | 'collage';
    timestamp: number;
    color?: string;
    streak?: number;
    hasPartnerNote?: boolean;
}

export function AndroidWidget({
    content,
    type,
    timestamp,
    color = '#FFFFFF',
    streak = 0,
    hasPartnerNote = true
}: AndroidWidgetProps) {

    // Parse content for drawing/collage
    let imageSource = '';
    let displayText = content;

    if (type === 'drawing') {
        try {
            const parsed = JSON.parse(content);
            if (parsed.preview) {
                imageSource = parsed.preview;
            }
        } catch (e) { }
    } else if (type === 'collage') {
        // Collage content is usually just "Collage" text or ignored, images are separate.
        // If we want to show collage, we need to pass a preview image.
        // For now, let's just handle drawing preview.
    }

    if (!hasPartnerNote) {
        return (
            <FlexWidget
                style={{
                    height: 'match_parent',
                    width: 'match_parent',
                    backgroundColor: '#1C1C1E',
                    borderRadius: 24,
                    padding: 16,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <TextWidget
                    text="💔"
                    style={{ fontSize: 32, marginBottom: 8 }}
                />
                <TextWidget
                    text="Partner doesn't love you"
                    style={{
                        fontSize: 16,
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}
                />
                <TextWidget
                    text="(No notes yet)"
                    style={{ fontSize: 12, color: '#8E8E93', marginTop: 4 }}
                />
            </FlexWidget>
        );
    }

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
                {streak > 0 && (
                    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextWidget text="🔥" style={{ fontSize: 14, marginRight: 4 }} />
                        <TextWidget
                            text={`${streak}`}
                            style={{ fontSize: 14, color: '#FF9500', fontWeight: 'bold' }}
                        />
                    </FlexWidget>
                )}
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
                            color: (color === '#FFFFFF' ? '#1C1C1E' : color) as any, // Cast to any to bypass strict ColorProp check if needed, or find correct type
                            fontFamily: 'Inter_700Bold',
                            textAlign: 'center'
                        }}
                    />
                ) : imageSource ? (
                    <ImageWidget
                        image={imageSource as any} // Correct prop is 'image'
                        imageWidth={120}
                        imageHeight={120}
                        style={{
                            width: 120, // localized fix size or match_parent with constraints
                            height: 120
                        }}
                    />
                ) : (
                    <TextWidget
                        text={type === 'drawing' ? '🎨 New Drawing' : '📸 New Collage'}
                        style={{ fontSize: 18, color: '#1C1C1E' }}
                    />
                )}
            </FlexWidget>

            <FlexWidget style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                width: 'match_parent'
            }}>
                <TextWidget
                    text={new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    style={{ fontSize: 12, color: '#C7C7CC' }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}
