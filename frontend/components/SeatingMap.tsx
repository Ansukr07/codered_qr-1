'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import styles from './SeatingMap.module.css';

interface SeatingMapProps {
    teamName?: string;
}

function getTeamIndex(teamName: string, maxTeams: number): number {
    let hash = 0;
    const str = teamName.toLowerCase().replace(/\s+/g, '');
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % maxTeams;
}

// Helper to create path for rectangle with specific rounded corners
function getRoundedRectPath(x: number, y: number, w: number, h: number, r: number, corners: boolean[]) {
    // corners: [tl, tr, br, bl]
    const [tl, tr, br, bl] = corners;

    // Start top-left
    let d = `M${x + (tl ? r : 0)},${y}`;

    // Top line
    d += ` L${x + w - (tr ? r : 0)},${y}`;
    // Top-right corner
    if (tr) d += ` Q${x + w},${y} ${x + w},${y + r}`;

    // Right line
    d += ` L${x + w},${y + h - (br ? r : 0)}`;
    // Bottom-right corner
    if (br) d += ` Q${x + w},${y + h} ${x + w - r},${y + h}`;

    // Bottom line
    d += ` L${x + (bl ? r : 0)},${y + h}`;
    // Bottom-left corner
    if (bl) d += ` Q${x},${y + h} ${x},${y + h - r}`;

    // Left line
    d += ` L${x},${y + (tl ? r : 0)}`;
    // Top-left corner
    if (tl) d += ` Q${x},${y} ${x + r},${y}`;

    d += " Z";

    return d;
}

const SeatingMap: React.FC<SeatingMapProps> = ({ teamName = '' }) => {
    const normalizedName = teamName.trim().toUpperCase();
    const totalTeams = 52;
    const activeIndex = normalizedName ? getTeamIndex(normalizedName, totalTeams) : -1;

    const containerRef = useRef<HTMLDivElement>(null);
    const [viewBox, setViewBox] = useState('0 0 1000 800');

    // Layout Constants
    const BLOCK_WIDTH = 70;
    const BLOCK_HEIGHT = 100;
    const COLUMN_SPACING = 150;
    const AISLE_GAP = 60;
    const CORNER_RADIUS = 12; // Smooth architectural radius

    const layout = useMemo(() => {
        const blocks: any[] = [];

        // Final geometry tuning
        const cx = -1200;
        const cy = 400;
        const startRadius = 1450;
        const numColumns = 13;

        for (let col = 0; col < numColumns; col++) {
            const radius = startRadius + col * COLUMN_SPACING;

            // Offsets
            // Pair 1 (Top): Inner at Offset 1, Outer at Offset 2
            const innerOffset = (AISLE_GAP / 2) + (BLOCK_HEIGHT / 2);
            // Gap between inner/outer is 0 for connection.
            // Center distance = Height.
            const outerOffset = innerOffset + BLOCK_HEIGHT;

            // Angles
            const thetaInner = Math.asin(innerOffset / radius);
            const thetaOuter = Math.asin(outerOffset / radius);

            const positions = [
                { angle: -thetaOuter, posType: 'top-outer', index: col * 4 },
                { angle: -thetaInner, posType: 'top-inner', index: col * 4 + 1 },
                { angle: thetaInner, posType: 'bottom-inner', index: col * 4 + 2 },
                { angle: thetaOuter, posType: 'bottom-outer', index: col * 4 + 3 }
            ];

            positions.forEach(pos => {
                if (pos.index >= totalTeams) return;

                const rotation = pos.angle * (180 / Math.PI);
                const x = cx + radius * Math.cos(pos.angle);
                const y = cy + radius * Math.sin(pos.angle);

                blocks.push({
                    index: pos.index,
                    x,
                    y,
                    rotation,
                    width: BLOCK_WIDTH,
                    height: BLOCK_HEIGHT,
                    posType: pos.posType,
                    col
                });
            });
        }

        return blocks;
    }, [totalTeams]);

    useEffect(() => {
        if (layout.length > 0) {
            const xs = layout.map(b => b.x);
            const maxX = Math.max(...xs) + 200;
            setViewBox(`0 0 ${maxX} 800`);
        }
    }, [layout]);

    useEffect(() => {
        if (activeIndex !== -1 && containerRef.current && layout.find(b => b.index === activeIndex)) {
            const target = layout.find(b => b.index === activeIndex);
            if (target) {
                const container = containerRef.current;
                const clientW = container.clientWidth;
                // Center target
                const scrollLeft = target.x - clientW / 2;
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [activeIndex, layout]);

    return (
        <div className={styles.container}>
            <div className={styles.scrollContainer} ref={containerRef}>
                <svg
                    className={styles.mapSvg}
                    viewBox={viewBox}
                    preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="blockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            {/* Vertical gradient */}
                            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                    </defs>

                    {/* Stage Group */}
                    <g transform="translate(50, 200)">
                        <rect
                            x="0" y="0"
                            width="60" height="400"
                            className={styles.stageRect}
                        />
                        <text
                            x="30" y="200"
                            transform="rotate(-90, 30, 200)"
                            className={styles.stageText}
                        >
                            STAGE
                        </text>
                    </g>

                    {/* Teams */}
                    {layout.map((block) => {
                        const isActive = block.index === activeIndex;

                        // Determine corners [tl, tr, br, bl]
                        // Standard rotation: Top is Top?
                        // Rotation aligns block tangent to arc.
                        // For 'top-outer', it's the top-most block. The "Outer" edge is Top.
                        // So Top-Outer needs Round Top ([1,1,0,0]).
                        // Top-Inner needs Round Bottom ([0,0,1,1]) -> Touches Aisle.
                        // Wait. Top-Inner touches Top-Outer at Top edge.
                        // LayoutStack: [Top-Outer]
                        //              [Top-Inner]
                        //              (Aisle)

                        // top-outer: Radius Top.
                        // top-inner: Radius Bottom.

                        // bottom-inner: Radius Top (Touches Aisle).
                        // bottom-outer: Radius Bottom.

                        let corners = [false, false, false, false];
                        if (block.posType === 'top-outer') corners = [true, true, false, false];
                        if (block.posType === 'top-inner') corners = [false, false, true, true];
                        if (block.posType === 'bottom-inner') corners = [true, true, false, false];
                        if (block.posType === 'bottom-outer') corners = [false, false, true, true];

                        // Generate Path
                        // Local coords centered at 0,0 for rotation
                        // x: -w/2, y: -h/2
                        const pathD = getRoundedRectPath(
                            -block.width / 2,
                            -block.height / 2,
                            block.width,
                            block.height,
                            CORNER_RADIUS,
                            corners
                        );

                        return (
                            <g
                                key={`block-${block.index}`}
                                transform={`translate(${block.x}, ${block.y}) rotate(${block.rotation})`}
                            >
                                <path
                                    d={pathD}
                                    className={`${isActive ? styles.blockActive : styles.blockInactive}`}
                                />

                                {/* Overlay / Detail */}
                                <path
                                    d={pathD}
                                    fill="url(#blockGradient)"
                                    pointerEvents="none"
                                />

                                {/* Divider Line if needed? 
                                    Connected blocks touch.
                                    Maybe distinct border color?
                                */}

                                {isActive && (
                                    <text
                                        x="0"
                                        y="6"
                                        className={styles.activeText}
                                        textAnchor="middle"
                                    >
                                        YOU
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {!teamName && (
                <div className={styles.overlay}>
                    <h2 className={styles.overlayTitle}>FLOOR PLAN</h2>
                    <p className={styles.overlaySub}>Scroll to explore teams</p>
                </div>
            )}
        </div>
    );
};

export default SeatingMap;
