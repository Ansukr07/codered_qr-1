import React from 'react';
import styles from './SeatingMap.module.css';

interface SeatingMapProps {
    teamName?: string;
}

// Global Config
const TOTAL_SEATS = 50; // Limited to 50 teams as requested
const COLUMNS = 4; // 2 left, 2 right

/**
 * Maps a team name to a specific index (0 to 49) deterministically.
 */
function getSeatIndex(teamName: string): number {
    let hash = 0;
    // STRICT normalization: lowercase, remove ALL whitespace
    // This ensures "Team A" and "Team  A" and "team a" all map to the same index
    const str = teamName.toLowerCase().replace(/\s+/g, '');

    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % TOTAL_SEATS;
}

const SeatingMap: React.FC<SeatingMapProps> = ({ teamName }) => {
    const normalizedTeamName = teamName?.trim();
    const activeSeatIndex = normalizedTeamName ? getSeatIndex(normalizedTeamName) : -1;
    const hasTeam = !!normalizedTeamName;

    // Render the grid dynamically with a "Theatre" curve
    const renderSeats = () => {
        const seats = [];
        const seatWidth = 100;
        const seatHeight = 50;
        const gapX = 15;
        const gapY = 50;
        const aisleWidth = 100;

        // Starting offset
        const startX = 140;
        const startY = 150;

        for (let i = 0; i < TOTAL_SEATS; i++) {
            const row = Math.floor(i / COLUMNS);
            const col = i % COLUMNS;

            // X Calculation
            // 2 left cols, aisle, 2 right cols
            let x = startX;

            // Left block: cols 0, 1
            if (col === 0) x += 0;
            if (col === 1) x += seatWidth + gapX;

            // Right block: cols 2, 3 (pushed by aisle)
            if (col >= 2) x += (seatWidth * 2) + gapX + aisleWidth;

            if (col === 2) x += 0;
            if (col === 3) x += seatWidth + gapX;

            // Y Calculation with Theatre Curve
            // Seats further from center are slightly "lower" (higher Y value) to create an arc effect relative to the 'stage' at top
            // Distance from center (1.5) -> 0: 1.5, 1: 0.5, 2: 0.5, 3: 1.5
            const distFromCenter = Math.abs(col - 1.5);
            const curveOffset = distFromCenter * 20; // 20px drop for outer seats

            const y = startY + (row * (seatHeight + gapY)) + curveOffset;

            const isActive = (i === activeSeatIndex);
            const isInactive = hasTeam && !isActive;

            // Define CSS class based on state
            let cssClass = styles.zone;
            if (isActive) cssClass = `${styles.zone} ${styles.zoneActive}`;
            else if (isInactive) cssClass = `${styles.zone} ${styles.zoneInactive}`;

            // SVG Group for Seat
            seats.push(
                <g key={i}>
                    {/* Seat Rectangle (Curved rounded box) */}
                    <rect
                        x={x}
                        y={y}
                        width={seatWidth}
                        height={seatHeight}
                        rx="12" // More rounded for "organic/theatre" feel
                        ry="12"
                        className={cssClass}
                    />

                    {/* NO TEXT LABELS as requested */}
                </g>
            );
        }
        return seats;
    };

    return (
        <div className={styles.container}>
            <svg
                className={styles.mapSvg}
                viewBox="0 0 800 1600"
                preserveAspectRatio="xMidYMin meet"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>
                    {/* Subtle floor grid pattern */}
                    <pattern id="floorGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2a2a35" strokeWidth="1" />
                    </pattern>
                </defs>

                {/* Floor Background */}
                <rect width="100%" height="100%" fill="url(#floorGrid)" opacity="0.3" />

                {/* Entrance Marker (Top Left) */}
                <g transform="translate(40, 40)">
                    {/* Main Arrow Body */}
                    <path
                        d="M 0,0 L 60,35 L 0,70 Z"
                        fill="#fb923c"
                    />
                    {/* Secondary Arrow for depth */}
                    <path
                        d="M 25,0 L 85,35 L 25,70 Z"
                        fill="#fb923c"
                        opacity="0.6"
                    />
                    <text x="20" y="95" fill="#fb923c" fontSize="16" fontWeight="bold" fontFamily="sans-serif">ENTRANCE</text>
                </g>

                {/* Stage / Screen indicator at top center */}
                <path
                    d="M 200,80 Q 400,120 600,80"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="4"
                    opacity="0.3"
                />
                <text x="400" y="60" textAnchor="middle" fill="#555" fontSize="14" letterSpacing="2">STAGE / SCREEN</text>

                {/* Render Grid */}
                {renderSeats()}

            </svg>

            {/* Overlay Message if no team selected */}
            {!hasTeam && (
                <div className={styles.messageContainer}>
                    <div className={styles.messageTitle}>Seating Map</div>
                    <div className={styles.messageSub}>
                        Search for a member or join a team to see your seat.
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeatingMap;
