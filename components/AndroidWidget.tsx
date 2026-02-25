import React from 'react';
import { FlexWidget, ImageWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

interface AndroidWidgetProps {
    content: string;
    type: 'text' | 'drawing' | 'collage' | 'music' | 'tasks';
    timestamp: number;
    color?: string;
    streak?: number;
    hasPartnerNote?: boolean;
    partnerName?: string;
    images?: string[];
    musicTrack?: {
        title: string;
        artist: string;
        coverUrl: string;
    };
    tasks?: { id: string; text: string; completed: boolean }[];
}

export function AndroidWidget({
    content,
    type,
    timestamp,
    color = '#FFFFFF',
    streak = 0,
    hasPartnerNote = true,
    partnerName = 'Partner',
    fontFamily,
    fontWeight,
    fontStyle,
    textDecorationLine,
    isDark,
    images,
    musicTrack,
    tasks
}: AndroidWidgetProps & {
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecorationLine?: string;
    isDark?: boolean;
    images?: string[];
    musicTrack?: {
        title: string;
        artist: string;
        coverUrl: string;
    };
    tasks?: { id: string; text: string; completed: boolean }[];
}) {

    // Parse content for drawing/collage
    let imageSource = '';
    let drawingPaths: { path: string, color: string }[] = [];
    let svgString = '';

    if (type === 'drawing') {
        try {
            const parsed = JSON.parse(content);
            if (parsed.preview) imageSource = parsed.preview;

            // Extract paths
            if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === 'object' && 'path' in parsed[0]) {
                    drawingPaths = parsed;
                } else {
                    drawingPaths = parsed.map((p: string) => ({ path: p, color: color === '#FFFFFF' ? '#000000' : color }));
                }
            } else if (parsed && parsed.paths) {
                if (parsed.paths.length > 0 && typeof parsed.paths[0] === 'object') {
                    drawingPaths = parsed.paths;
                } else {
                    drawingPaths = parsed.paths.map((p: string) => ({ path: p, color: color === '#FFFFFF' ? '#000000' : color }));
                }
            }

            // Generate SVG String if paths exist
            if (drawingPaths.length > 0) {
                // Calculate Bounding Box
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                let hasPoints = false;

                drawingPaths.forEach(p => {
                    const matches = p.path.match(/[0-9.-]+,[0-9.-]+/g);
                    if (matches) {
                        matches.forEach(coord => {
                            const [x, y] = coord.split(',').map(Number);
                            if (!isNaN(x) && !isNaN(y)) {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                                hasPoints = true;
                            }
                        });
                    }
                });

                if (hasPoints) {
                    const vbX = minX - 10;
                    const vbY = minY - 10;
                    const vbW = (maxX - minX) + 20;
                    const vbH = (maxY - minY) + 20;

                    if (vbW > 0 && vbH > 0) {
                        const viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;

                        // Build paths
                        const pathsXml = drawingPaths.map(p => {
                            // Color Logic: If dark mode and color is black/default, make it white
                            const isDefaultColor = p.color === '#000000' || p.color === '#FFFFFF' || !p.color;
                            const strokeColor = (isDark && isDefaultColor) ? '#FFFFFF' : (p.color || '#000000');
                            return `<path d="${p.path}" stroke="${strokeColor}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
                        }).join('');

                        svgString = `<svg width="300" height="300" viewBox="${viewBox}">${pathsXml}</svg>`;
                    }
                }
            }

        } catch (e) { }
    }

    // Theme Colors
    const backgroundColor = isDark ? '#1C1C1E' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#000000';
    const secondaryTextColor = isDark ? '#8E8E93' : '#8E8E93';
    const brandColor = '#FF231F7C';

    if (!hasPartnerNote) {
        return (
            <FlexWidget
                style={{
                    height: 'match_parent',
                    width: 'match_parent',
                    backgroundColor: isDark ? '#000000' : '#f1f1f1',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 16
                }}
            >
                <TextWidget text="💔" style={{ fontSize: 40, marginBottom: 12 }} />
                <TextWidget
                    text="Nothing to display here"
                    style={{ fontSize: 18, color: textColor, fontWeight: 'bold' }}
                />
                <TextWidget
                    text="Ask your partner to send a note!"
                    style={{ fontSize: 14, color: secondaryTextColor, marginTop: 8 }}
                />
            </FlexWidget>
        );
    }

    const noteColor = color === '#FFFFFF' ? textColor : color;

    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: backgroundColor,
                padding: 16,
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
        >
            {/* Header: Lovii + Streak */}
            <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 'match_parent' }}>
                <TextWidget
                    text="Lovii"
                    style={{ fontSize: 18, color: brandColor, fontWeight: 'bold' }}
                />

                <FlexWidget style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#2C2C2E' : '#FFF0F5',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4
                }}>
                    <TextWidget text="🔥" style={{ fontSize: 14, marginRight: 4 }} />
                    <TextWidget
                        text={`${streak}`}
                        style={{ fontSize: 14, color: brandColor, fontWeight: 'bold' }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* Content Body */}
            <FlexWidget
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 12,
                    width: 'match_parent'
                }}
            >
                {type === 'music' && musicTrack ? (
                    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
                        <ImageWidget
                            image={musicTrack.coverUrl as any}
                            imageWidth={180}
                            imageHeight={180}
                            radius={16}
                            style={{ width: 180, height: 180, marginBottom: 12 }}
                        />
                        <TextWidget
                            text={musicTrack.title}
                            style={{ fontSize: 18, color: textColor, fontWeight: 'bold', textAlign: 'center' }}
                            maxLines={1}
                        />
                        <TextWidget
                            text={musicTrack.artist}
                            style={{ fontSize: 14, color: secondaryTextColor, textAlign: 'center' }}
                            maxLines={1}
                        />
                    </FlexWidget>
                ) : type === 'tasks' && tasks && tasks.length > 0 ? (
                    <FlexWidget style={{ flexDirection: 'column', width: 'match_parent', paddingHorizontal: 16 }}>
                        {tasks.slice(0, 4).map((task) => (
                            <FlexWidget
                                key={task.id}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: 8,
                                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                                    padding: 12,
                                    borderRadius: 12,
                                    width: 'match_parent'
                                }}
                                clickAction="TOGGLE_TASK"
                                clickActionData={{ taskId: task.id }}
                            >
                                <TextWidget text={task.completed ? "✅" : "⭕"} style={{ fontSize: 18, marginRight: 12 }} />
                                <FlexWidget style={{ flex: 1 }}>
                                    <TextWidget
                                        text={task.text}
                                        style={{
                                            fontSize: 16,
                                            color: task.completed ? secondaryTextColor : textColor,
                                        }}
                                        maxLines={1}
                                    />
                                </FlexWidget>
                            </FlexWidget>
                        ))}
                        {tasks.length > 4 && (
                            <TextWidget text={`+ ${tasks.length - 4} more`} style={{ fontSize: 12, color: secondaryTextColor, textAlign: 'center', marginTop: 4 }} />
                        )}
                    </FlexWidget>
                ) : type === 'text' ? (
                    <TextWidget
                        text={content || "Empty Note"}
                        style={{
                            fontSize: 22,
                            color: noteColor as any,
                            fontWeight: (fontWeight as any) || 'bold',
                            fontStyle: (fontStyle as any) || 'normal',
                            textAlign: 'center',
                            fontFamily: (fontFamily as any) || 'sans-serif-medium'
                        }}
                        maxLines={3}
                    />
                ) : svgString ? (
                    <SvgWidget
                        svg={svgString}
                        style={{ width: 280, height: 280 }}
                    />
                ) : (type === 'collage' && images && images.length > 0) ? (
                    <FlexWidget style={{ flexDirection: 'column', width: 280, alignItems: 'center' }}>
                        {/* Row 1 */}
                        <FlexWidget style={{ flexDirection: 'row' }}>
                            {images.slice(0, 2).map((img, index) => (
                                <ImageWidget
                                    key={index}
                                    image={img as any}
                                    imageWidth={120}
                                    imageHeight={120}
                                    radius={16}
                                    style={{ width: 120, height: 120, margin: 4 }}
                                />
                            ))}
                        </FlexWidget>
                        {/* Row 2 (if needed) */}
                        {images.length > 2 && (
                            <FlexWidget style={{ flexDirection: 'row' }}>
                                {images.slice(2, 4).map((img, index) => (
                                    <ImageWidget
                                        key={index + 2}
                                        image={img as any}
                                        imageWidth={120}
                                        imageHeight={120}
                                        radius={16}
                                        style={{ width: 120, height: 120, margin: 4 }}
                                    />
                                ))}
                            </FlexWidget>
                        )}
                    </FlexWidget>
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
                            style={{ fontSize: 18, color: textColor }}
                        />
                    </FlexWidget>
                )}
            </FlexWidget>

            {/* Footer: Date + Partner Name */}
            <FlexWidget style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: 'match_parent',
                borderTopColor: isDark ? '#3A3A3C' : '#F2F2F7',
                borderTopWidth: 1,
                paddingTop: 8
            }}>
                <TextWidget
                    text={`From ${partnerName}`}
                    style={{ fontSize: 12, color: secondaryTextColor, fontWeight: 'bold' }}
                    maxLines={1}
                />
                <TextWidget
                    text={new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    style={{ fontSize: 12, color: secondaryTextColor }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}
