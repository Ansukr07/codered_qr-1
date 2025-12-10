import React from 'react';
import styles from './SeatingMap.module.css';

interface SeatingMapProps {
    teamName?: string;
}

const TOTAL_SEATS = 50;
const COLUMNS = 4;

function getSeatIndex(teamName: string): number {
    let hash = 0;
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

    const renderGrid = () => {
        const seats = [];
        const seatWidth = 80;
        const seatHeight = 40;
        const gapX = 12;
        const gapY = 30; // Closer vertical spacing
        const aisleWidth = 80;

        // Layout Config
        const startX = 140;
        const startY = 160;

        // Generate Row Labels (A, B, C...)
        const totalRows = Math.ceil(TOTAL_SEATS / COLUMNS);
        const rowLabels = [];

        for (let r = 0; r < totalRows; r++) {
            const yPos = startY + (r * (seatHeight + gapY)) + (seatHeight / 2);
            const labelChar = String.fromCharCode(65 + r); // A, B, C...
            rowLabels.push(
                <text key={`row-${r}`} x="80" y={yPos} className={styles.axisLabel}>{labelChar}</text>
            );
        }

        for (let i = 0; i < TOTAL_SEATS; i++) {
            const row = Math.floor(i / COLUMNS);
            const col = i % COLUMNS;

            let x = startX;
            // Left Bloc
            if (col === 0) x += 0;
            if (col === 1) x += seatWidth + gapX;
            // Right Block
            if (col >= 2) x += (seatWidth * 2) + gapX + aisleWidth;
            if (col === 2) x += 0;
            if (col === 3) x += seatWidth + gapX;

            const y = startY + (row * (seatHeight + gapY));

            const isActive = (i === activeSeatIndex);
            const isInactive = hasTeam && !isActive;

            let cssClass = styles.zone;
            if (isActive) cssClass = `${styles.zone} ${styles.zoneActive}`;
            else if (isInactive) cssClass = `${styles.zone} ${styles.zoneInactive}`;

            // Seat Group
            seats.push(
                <g key={i}>
                    {/* Chair Back (Visual Detail) */}
                    <path
                        d={`M ${x},${y} h ${seatWidth} a 4,4 0 0 1 4,4 v ${seatHeight - 8} a 4,4 0 0 1 -4,4 h -${seatWidth} a 4,4 0 0 1 -4,-4 v -${seatHeight - 8} a 4,4 0 0 1 4,-4 Z`}
                        className={cssClass}
                        data-index={i}
                    />
                    {/* Small Desk Detail line */}
                    <line x1={x + 10} y1={y + 10} x2={x + seatWidth - 10} y2={y + 10} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                </g>
            );
        }

        return { seats, rowLabels };
    };

    const { seats, rowLabels } = renderGrid();

    return (
        <div className={styles.container}>
            <svg
                className={styles.mapSvg}
                viewBox="0 0 700 1200"
                preserveAspectRatio="xMidYMin meet"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* --- ARCHITECTURAL ELEMENTS --- */}

                {/* Stage Area */}
                <g transform="translate(150, 40)">
                    {/* Screen Glow */}
                    <path d="M 0,20 L 400,20 L 350,150 L 50,150 Z" className={styles.screenGlow} />
                    {/* Curved Screen */}
                    <path d="M 20,20 Q 200,50 380,20" fill="none" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
                    <text x="200" y="10" textAnchor="middle" className={styles.screenText}>STAGE</text>
                </g>

                {/* Entrance Indicator - Schematic Style */}
                <g transform="translate(40, 60)">
                    <rect x="0" y="0" width="60" height="24" rx="4" fill="#27272a" stroke="#3f3f46" />
                    <text x="30" y="16" textAnchor="middle" fill="#fb923c" fontSize="10" fontWeight="bold" fontFamily="sans-serif">ENTRY</text>
                    <path d="M 30,28 L 30,50 M 20,40 L 30,50 L 40,40" stroke="#fb923c" strokeWidth="2" fill="none" />
                </g>

                {/* Row Labels */}
                {rowLabels}

                {/* Seats */}
                {seats}

            </svg>

            {!hasTeam && (
                <div className={styles.messageContainer}>
                    <div className={styles.messageTitle}>Seating Map</div>
                    <div className={styles.messageSub}>
                        Enter a team member name to locate your desk.
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeatingMap;
