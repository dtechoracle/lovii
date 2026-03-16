'use no memo';
import React from 'react';
import { FlexWidget, ImageWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

// ─── Widget canvas: 320 × 120 dp (4x2) ─────────────────────────────────────────
// Usable after 10dp padding: ~300 × 100dp
// Left art column: 110dp  |  Right text section: ~190dp
//
// KNOWN LIBRARY CONSTRAINTS (react-native-android-widget):
//   • backgroundColor / borderColor must be `#RRGGBB` or `rgba(r,g,b,a)` — no shorthand, no hex+alpha
//   • TextWidget style does NOT support lineHeight — use fontSize to control sizing
//   • No opacity prop on primitives — encode alpha in rgba() or hex if needed
//   • borderLeftWidth + borderLeftColor work; don't combine with borderWidth simultaneously

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
        previewUrl?: string;
        externalUrl?: string;
    };
    tasks?: { id: string; text: string; completed: boolean }[];
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecorationLine?: string;
    isDark?: boolean;
    widgetWidth?: number;
    widgetHeight?: number;
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
    isDark,
    images,
    musicTrack,
    tasks,
    widgetWidth = 320,
    widgetHeight = 110,
}: AndroidWidgetProps) {

    // ─── Theme tokens — all colours are valid #hex or rgba() ─────────────
    const bg = isDark ? '#111114' : '#FFFFFF';
    const musicBg = (type === 'music' && musicTrack)
        ? ((color && color !== '#FFFFFF' && color !== '#1C1C1E') ? color : (isDark ? '#1A1A1E' : '#2A2A30'))
        : bg;
    const surface = isDark ? '#1E1E23' : '#F5F4F1';
    const borderClr = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
    const textPrimary = isDark ? '#EDEBE4' : '#18181B';
    const textMuted = isDark ? '#5E5D68' : '#A09E98';
    const accent = '#FF3B6B';
    const accentSoft = isDark ? 'rgba(255, 59, 107, 0.15)' : 'rgba(255, 59, 107, 0.10)';
    const gold = '#F5A623';
    const goldSoft = isDark ? 'rgba(245, 166, 35, 0.12)' : 'rgba(245, 166, 35, 0.15)';

    // ─── Note colour safety ───────────────────────────────────────────────
    const isVeryDark = !color || color === '#000000' || color === '#1C1C1E' || color === '#333333';
    const isVeryLight = color === '#FFFFFF' || color === '#F2F2F7';
    const noteColor: `#${string}` =
        isDark && isVeryDark ? '#EDEBE4' :
            !isDark && isVeryLight ? '#18181B' :
                (color as `#${string}`) || (isDark ? '#EDEBE4' : '#18181B');

    // ─── Drawing / SVG parse ──────────────────────────────────────────────
    let imageSource = '';
    let svgString = '';

    if (type === 'drawing') {
        try {
            const parsed = JSON.parse(content);
            if (parsed.preview) imageSource = parsed.preview;

            let drawingPaths: { path: string; color: string }[] = [];
            if (Array.isArray(parsed)) {
                drawingPaths = parsed.length > 0 && 'path' in parsed[0]
                    ? parsed
                    : parsed.map((p: string) => ({ path: p, color: noteColor }));
            } else if (parsed?.paths) {
                drawingPaths = parsed.paths.length > 0 && typeof parsed.paths[0] === 'object'
                    ? parsed.paths
                    : parsed.paths.map((p: string) => ({ path: p, color: noteColor }));
            }

            if (drawingPaths.length > 0) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                let hasPoints = false;
                drawingPaths.forEach(p => {
                    const ms = p.path.match(/[0-9.-]+,[0-9.-]+/g);
                    if (ms) ms.forEach(c => {
                        const [x, y] = c.split(',').map(Number);
                        if (!isNaN(x) && !isNaN(y)) {
                            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                            hasPoints = true;
                        }
                    });
                });
                if (hasPoints && (maxX - minX) > 0 && (maxY - minY) > 0) {
                    const pad = 12;
                    const vb = `${minX - pad} ${minY - pad} ${(maxX - minX) + pad * 2} ${(maxY - minY) + pad * 2}`;
                    const pathsXml = drawingPaths.map(p => {
                        const pc = p.color || noteColor;
                        const sc =
                            (isDark && (pc === '#000000' || pc === '#1C1C1E' || pc === '#333333')) ? '#EDEBE4' :
                                (!isDark && pc === '#FFFFFF') ? '#18181B' : pc;
                        return `<path d="${p.path}" stroke="${sc}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
                    }).join('');
                    svgString = `<svg width="96" height="96" viewBox="${vb}">${pathsXml}</svg>`;
                }
            }
        } catch (_) { }
    }

    // ─── Shared sub-components ────────────────────────────────────────────

    // 3dp left-edge accent bar
    function AccentBar() {
        return (
            <FlexWidget style={{
                width: 3,
                height: 'match_parent',
                backgroundColor: accent,
                borderRadius: 2,
                marginRight: 10,
            }} />
        );
    }

    // Right-aligned streak + partner name, fixed 52dp wide
    function MetaBadge() {
        return (
            <FlexWidget style={{
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'center',
                width: 52,
                marginLeft: 6,
            }}>
                {streak > 0 && (
                    <FlexWidget style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: goldSoft,
                        borderRadius: 10,
                        paddingHorizontal: 5,
                        paddingVertical: 2,
                        marginBottom: 5,
                    }}>
                        <TextWidget text="🔥" style={{ fontSize: 9 }} />
                        <TextWidget
                            text={`${streak}`}
                            style={{ fontSize: 10, color: gold, fontWeight: 'bold' }}
                        />
                    </FlexWidget>
                )}
                <TextWidget
                    text={partnerName}
                    style={{ fontSize: 9, color: textMuted }}
                    maxLines={1}
                />
            </FlexWidget>
        );
    }

    // Outer shell shared by all types
    function Shell({ children }: { children: React.ReactNode }) {
        return (
            <FlexWidget style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: bg,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 10,
                borderRadius: 20,
            }}>
                <AccentBar />
                {children}
                <MetaBadge />
            </FlexWidget>
        );
    }

    // ─── EMPTY STATE ──────────────────────────────────────────────────────
    if (!hasPartnerNote) {
        return (
            <Shell>
                <TextWidget text="💌" style={{ fontSize: 26 }} />
                <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', paddingLeft: 10 }}>
                    <TextWidget
                        text="No note yet"
                        style={{ fontSize: 14, color: textPrimary, fontWeight: 'bold' }}
                    />
                    <TextWidget
                        text={`Waiting for ${partnerName}…`}
                        style={{ fontSize: 11, color: textMuted }}
                        maxLines={1}
                    />
                </FlexWidget>
            </Shell>
        );
    }

    // ─── TEXT ─────────────────────────────────────────────────────────────
    if (type === 'text') {
        const isShort = content.length <= 40;
        return (
            <Shell>
                {/* Open-quote decoration — rendered as a plain TextWidget */}
                <FlexWidget style={{ height: 'match_parent' }}>
                    <TextWidget
                        text={'\u201C'}
                        style={{
                            fontSize: 34,
                            color: accent,
                            fontFamily: 'serif',
                            fontWeight: 'bold',
                        }}
                    />
                </FlexWidget>
                <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', paddingLeft: 4 }}>
                    <TextWidget
                        text={content || 'A love note\u2026'}
                        style={{
                            fontSize: isShort ? 17 : 13,
                            color: noteColor,
                            fontWeight: (fontWeight as any) || 'bold',
                            fontStyle: (fontStyle as any) || 'normal',
                            fontFamily: (fontFamily as any) || 'serif',
                        }}
                        maxLines={2}
                    />
                </FlexWidget>
            </Shell>
        );
    }

    // ─── MUSIC ────────────────────────────────────────────────────────────
    // Split-Screen Player: 50% Art | 50% Info + Controls
    if (type === 'music' && musicTrack) {

        return (
            <OverlapWidget style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: musicBg as any,
                borderRadius: 20,
            }}>
                {/* Layer 1: Main Split-Screen Layout (50/50 Flex) */}
                <FlexWidget style={{
                    height: 'match_parent',
                    width: 'match_parent',
                    flexDirection: 'row',
                    borderRadius: 20,
                    overflow: 'hidden',
                }}>
                    {/* Left: Artist Image - Fixed-width 60% split to avoid "grey space" and jitter */}
                    <FlexWidget style={{
                        width: 180,
                        height: 'match_parent',
                        backgroundColor: musicBg as any
                    }}>
                        <ImageWidget
                            image={musicTrack.coverUrl as any}
                            imageWidth={180}
                            imageHeight={120}
                            style={{ width: 'match_parent', height: 'match_parent' }}
                        />
                    </FlexWidget>

                    {/* Right: Info & Controls - 40% width */}
                    <FlexWidget style={{
                        flex: 1,
                        height: 'match_parent',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        backgroundColor: 'rgba(0, 0, 0, 0.25)' as any,
                    }}>
                        {/* Song Details */}
                        <TextWidget
                            text={musicTrack.title}
                            style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 'bold' }}
                            maxLines={1}
                        />
                        <TextWidget
                            text={musicTrack.artist}
                            style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' as any, marginTop: 1 }}
                            maxLines={1}
                        />

                        {/* Progress Bar (Thin & High Fidelity) */}
                        <FlexWidget style={{
                            width: 'match_parent',
                            height: 12,
                            flexDirection: 'column',
                            justifyContent: 'center',
                            marginTop: 10,
                        }}>
                            <FlexWidget style={{
                                width: 'match_parent',
                                height: 2,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)' as any,
                                borderRadius: 1,
                            }}>
                                <FlexWidget style={{
                                    width: 70, // Simulated progress
                                    height: 2,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 1,
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                }}>
                                    <FlexWidget style={{
                                        width: 6, height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#FFFFFF',
                                        marginRight: -3,
                                    }} />
                                </FlexWidget>
                            </FlexWidget>
                        </FlexWidget>

                        {/* Playback Controls */}
                        <FlexWidget style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 8,
                        }}>
                            <TextWidget text="⏮" style={{ fontSize: 20, color: '#FFFFFF', marginRight: 20 }} />

                            <FlexWidget
                                style={{
                                    width: 36, height: 36,
                                    borderRadius: 18,
                                    backgroundColor: '#FFFFFF',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 20,
                                }}
                                clickAction={musicTrack.externalUrl ? "OPEN_URI" : "OPEN_APP"}
                                clickActionData={musicTrack.externalUrl ? { uri: musicTrack.externalUrl } : undefined}
                            >
                                <TextWidget text="▶" style={{ fontSize: 16, color: musicBg as any, marginLeft: 2 }} />
                            </FlexWidget>

                            <TextWidget text="⏭" style={{ fontSize: 20, color: '#FFFFFF' }} />
                        </FlexWidget>
                    </FlexWidget>
                </FlexWidget>

                {/* Layer 2: Floating Streak Badge Overlay */}
                {streak > 0 && (
                    <FlexWidget style={{
                        width: 'match_parent',
                        height: 'match_parent',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-end',
                        paddingTop: 8,
                        paddingRight: 8,
                    }}>
                        <FlexWidget style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)' as any,
                            borderRadius: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                        }}>
                            <TextWidget text="🔥" style={{ fontSize: 10 }} />
                            <TextWidget
                                text={` ${streak}`}
                                style={{ fontSize: 11, color: gold, fontWeight: 'bold' }}
                            />
                        </FlexWidget>
                    </FlexWidget>
                )}
            </OverlapWidget>
        );
    }

    // ─── TASKS ────────────────────────────────────────────────────────────
    // 2 rows max (each ~38dp) → fits in 100dp usable height with spacing
    if (type === 'tasks' && tasks && tasks.length > 0) {
        const visible = tasks.slice(0, 2);
        const doneCount = tasks.filter(t => t.completed).length;
        const pct = Math.round((doneCount / tasks.length) * 100);

        return (
            <Shell>
                {/* Progress summary */}
                <FlexWidget style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    marginRight: 10,
                }}>
                    <TextWidget
                        text={`${pct}%`}
                        style={{ fontSize: 15, color: accent, fontWeight: 'bold' }}
                    />
                    <TextWidget
                        text={`${doneCount}/${tasks.length}`}
                        style={{ fontSize: 9, color: textMuted }}
                    />
                    {/* Progress bar — background track */}
                    <FlexWidget style={{
                        width: 34,
                        height: 3,
                        backgroundColor: surface,
                        borderRadius: 2,
                        marginTop: 5,
                    }}>
                        {/* Filled portion */}
                        <FlexWidget style={{
                            width: Math.round(34 * pct / 100),
                            height: 3,
                            backgroundColor: accent,
                            borderRadius: 2,
                        }} />
                    </FlexWidget>
                </FlexWidget>

                {/* Task rows */}
                <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                    {visible.map((task, idx) => (
                        <FlexWidget
                            key={task.id}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: task.completed ? surface : bg,
                                paddingVertical: 6,
                                paddingHorizontal: 8,
                                borderRadius: 10,
                                marginBottom: idx === 0 ? 5 : 0,
                                // Use borderLeftWidth for accent stripe on incomplete tasks
                                // Don't combine with borderWidth to avoid Android rendering issues
                                borderLeftWidth: task.completed ? 0 : 2,
                                borderLeftColor: task.completed ? bg : accent,
                            }}
                            clickAction="TOGGLE_TASK"
                            clickActionData={{ taskId: task.id }}
                        >
                            <TextWidget
                                text={task.completed ? '\u2713' : '\u25CB'}
                                style={{
                                    fontSize: 11,
                                    color: task.completed ? accent : textMuted,
                                    fontWeight: 'bold',
                                }}
                            />
                            <TextWidget
                                text={'  ' + task.text}
                                style={{
                                    fontSize: 12,
                                    color: task.completed ? textMuted : noteColor,
                                    fontWeight: task.completed ? 'normal' : '500',
                                }}
                                maxLines={1}
                            />
                        </FlexWidget>
                    ))}
                    {tasks.length > 2 && (
                        <TextWidget
                            text={`+${tasks.length - 2} more`}
                            style={{ fontSize: 10, color: textMuted }}
                        />
                    )}
                </FlexWidget>
            </Shell>
        );
    }

    // ─── DRAWING ─────────────────────────────────────────────────────────
    if (type === 'drawing') {
        const ArtContent = () => {
            if (svgString) {
                return (
                    <FlexWidget style={{
                        borderRadius: 12,
                        backgroundColor: isDark ? '#22222A' : '#F8F7F4',
                        borderWidth: 1,
                        borderColor: borderClr,
                        padding: 2,
                        marginRight: 12,
                    }}>
                        <SvgWidget svg={svgString} style={{ width: 92, height: 92 }} />
                    </FlexWidget>
                );
            }
            if (imageSource) {
                return (
                    <FlexWidget style={{ marginRight: 12 }}>
                        <ImageWidget
                            image={imageSource as any}
                            imageWidth={96}
                            imageHeight={96}
                            radius={12}
                            style={{ width: 96, height: 96 }}
                        />
                    </FlexWidget>
                );
            }
            return (
                <FlexWidget style={{
                    width: 96,
                    height: 96,
                    borderRadius: 12,
                    backgroundColor: accentSoft,
                    borderWidth: 1,
                    borderColor: accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                }}>
                    <TextWidget text="\uD83C\uDFA8" style={{ fontSize: 30, color: textPrimary }} />
                </FlexWidget>
            );
        };

        return (
            <Shell>
                <ArtContent />
                <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                    <TextWidget
                        text="New Drawing"
                        style={{ fontSize: 14, color: textPrimary, fontWeight: 'bold' }}
                        maxLines={1}
                    />
                    <TextWidget
                        text="from your partner"
                        style={{ fontSize: 11, color: textMuted }}
                    />
                </FlexWidget>
            </Shell>
        );
    }

    // ─── COLLAGE ─────────────────────────────────────────────────────────
    // Max 3 images. Widths by count:
    //   1 image  → 200dp  (fills most of the right side)
    //   2 images → 112dp each + 5dp gap = 229dp ✓
    //   3 images → 75dp each + 2×5dp gap = 235dp ✓
    // All images 96dp tall — fits 100dp usable height
    if (type === 'collage') {
        const grid = images && images.length > 0 ? images.slice(0, 3) : [];
        const imgWidth = grid.length === 1 ? 200 : grid.length === 2 ? 112 : 75;

        if (grid.length === 0) {
            return (
                <Shell>
                    <FlexWidget style={{
                        width: 96,
                        height: 96,
                        borderRadius: 12,
                        backgroundColor: accentSoft,
                        borderWidth: 1,
                        borderColor: accent,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                    }}>
                        <TextWidget text="\uD83D\uDCF8" style={{ fontSize: 30, color: textPrimary }} />
                    </FlexWidget>
                    <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                        <TextWidget text="New Collage" style={{ fontSize: 14, color: textPrimary, fontWeight: 'bold' }} />
                        <TextWidget text="from your partner" style={{ fontSize: 11, color: textMuted }} />
                    </FlexWidget>
                </Shell>
            );
        }

        return (
            <Shell>
                <FlexWidget style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    {grid.map((img, i) => (
                        <FlexWidget
                            key={i}
                            style={{
                                borderRadius: 12,
                                // First image gets accent border, rest get subtle border
                                borderWidth: 2,
                                borderColor: i === 0 ? accent : borderClr,
                                marginRight: i < grid.length - 1 ? 5 : 0,
                            }}
                        >
                            <ImageWidget
                                image={img as any}
                                imageWidth={imgWidth}
                                imageHeight={96}
                                radius={10}
                                style={{ width: imgWidth, height: 96 }}
                            />
                        </FlexWidget>
                    ))}
                    {images && images.length > 3 && (
                        <TextWidget
                            text={`+${images.length - 3}`}
                            style={{ fontSize: 11, color: textMuted, fontWeight: 'bold' }}
                        />
                    )}
                </FlexWidget>
            </Shell>
        );
    }

    // ─── FALLBACK ─────────────────────────────────────────────────────────
    return (
        <Shell>
            <TextWidget text="\uD83D\uDC9D" style={{ fontSize: 26, color: textPrimary }} />
            <FlexWidget style={{ flex: 1, paddingLeft: 10 }}>
                <TextWidget text={partnerName} style={{ fontSize: 14, color: textPrimary, fontWeight: 'bold' }} />
            </FlexWidget>
        </Shell>
    );
}