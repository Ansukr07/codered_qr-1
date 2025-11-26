const express = require('express');
const router = express.Router();
const Seating = require('../models/Seating');
const User = require('../models/User');

// Import centralized authentication middleware
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Seating API is running' });
});

// Generate seating arrangement with team-based consecutive seats (Admin only)
router.post('/generate', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { totalSeats, sections, rows, columns } = req.body;

        // Get team information with member counts
        const teamMembers = await User.aggregate([
            { $match: { role: 'participant', teamId: { $exists: true, $ne: null } } },
            { $group: { _id: '$teamId', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        if (teamMembers.length === 0) {
            return res.status(400).json({ message: 'No teams found with participants' });
        }

        // Calculate total seats needed
        const totalSeatsNeeded = teamMembers.reduce((sum, team) => sum + team.count, 0);

        // Validation
        if (totalSeatsNeeded > totalSeats) {
            return res.status(400).json({
                message: `Need ${totalSeatsNeeded} seats for ${teamMembers.length} teams, but only ${totalSeats} available.`
            });
        }

        const leftSeats = sections.left || 0;
        const rightSeats = sections.right || 0;

        if (leftSeats + rightSeats !== totalSeats) {
            return res.status(400).json({
                message: 'Left seats + Right seats must equal total seats'
            });
        }

        // Clear existing seating - drop collection to remove old indexes
        await Seating.collection.drop().catch(() => {
            // Ignore error if collection doesn't exist
        });

        // Auto-calculate rows/columns if not provided
        const leftRows = rows?.left || Math.ceil(Math.sqrt(leftSeats));
        const leftCols = columns?.left || Math.ceil(leftSeats / leftRows);
        const rightRows = rows?.right || Math.ceil(Math.sqrt(rightSeats));
        const rightCols = columns?.right || Math.ceil(rightSeats / rightRows);

        // Generate seating with balanced distribution and consecutive seats for teams
        const seatingArrangements = [];

        // Calculate how many seats each section can handle
        let leftSeatsUsed = 0;
        let rightSeatsUsed = 0;
        let currentLeftSeat = 0;
        let currentRightSeat = 0;

        for (const team of teamMembers) {
            const teamSize = team.count;
            const teamSeats = [];
            let assignedSection = '';

            // Determine which section has more available space
            const leftAvailable = leftSeats - leftSeatsUsed;
            const rightAvailable = rightSeats - rightSeatsUsed;

            // Try to balance: assign to section with more available space
            if (leftAvailable >= teamSize && (leftAvailable > rightAvailable || rightAvailable < teamSize)) {
                // Assign to left section
                assignedSection = 'left';

                for (let i = 0; i < teamSize; i++) {
                    const row = Math.floor(currentLeftSeat / leftCols) + 1;
                    const column = (currentLeftSeat % leftCols) + 1;

                    teamSeats.push({
                        seatNumber: currentLeftSeat + 1,
                        row: row,
                        column: column
                    });
                    currentLeftSeat++;
                    leftSeatsUsed++;
                }
            } else if (rightAvailable >= teamSize) {
                // Assign to right section
                assignedSection = 'right';

                for (let i = 0; i < teamSize; i++) {
                    const row = Math.floor(currentRightSeat / rightCols) + 1;
                    const column = (currentRightSeat % rightCols) + 1;

                    teamSeats.push({
                        seatNumber: currentRightSeat + 1,
                        row: row,
                        column: column
                    });
                    currentRightSeat++;
                    rightSeatsUsed++;
                }
            } else {
                // Not enough space in either section for this team
                return res.status(400).json({
                    message: `Not enough consecutive space for team ${team._id} (size: ${teamSize}). 
                             Left available: ${leftAvailable}, Right available: ${rightAvailable}`
                });
            }

            seatingArrangements.push({
                teamId: team._id,
                teamSize: teamSize,
                section: assignedSection,
                seats: teamSeats,
                labName: 'APJ Abdul Kalam Lab'
            });
        }

        // Save to database
        await Seating.insertMany(seatingArrangements);

        res.status(201).json({
            message: 'Seating arrangement generated successfully',
            stats: {
                totalTeams: teamMembers.length,
                totalSeats,
                totalSeatsUsed: totalSeatsNeeded,
                remaining: totalSeats - totalSeatsNeeded,
                sections: {
                    left: {
                        teams: seatingArrangements.filter(s => s.section === 'left').length,
                        seatsUsed: leftSeatsUsed,
                        total: leftSeats,
                        rows: leftRows,
                        columns: leftCols
                    },
                    right: {
                        teams: seatingArrangements.filter(s => s.section === 'right').length,
                        seatsUsed: rightSeatsUsed,
                        total: rightSeats,
                        rows: rightRows,
                        columns: rightCols
                    }
                }
            },
            seating: seatingArrangements
        });

    } catch (error) {
        console.error('Seating generation error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all seating arrangements (Admin only)
router.get('/all', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const seating = await Seating.find({}).sort({ section: 1 });

        // Calculate max rows and columns for each section to show full layout
        let leftMaxRow = 0, leftMaxCol = 0;
        let rightMaxRow = 0, rightMaxCol = 0;

        seating.forEach(team => {
            team.seats.forEach(seat => {
                if (team.section === 'left') {
                    if (seat.row > leftMaxRow) leftMaxRow = seat.row;
                    if (seat.column > leftMaxCol) leftMaxCol = seat.column;
                } else {
                    if (seat.row > rightMaxRow) rightMaxRow = seat.row;
                    if (seat.column > rightMaxCol) rightMaxCol = seat.column;
                }
            });
        });

        // Add some padding to show empty seats beyond occupied ones
        // This ensures we show the full configured section
        leftMaxRow = Math.max(leftMaxRow, 10); // Minimum 10 rows
        leftMaxCol = Math.max(leftMaxCol, 10); // Minimum 10 cols
        rightMaxRow = Math.max(rightMaxRow, 10);
        rightMaxCol = Math.max(rightMaxCol, 10);

        const stats = {
            total: seating.length,
            left: seating.filter(s => s.section === 'left').length,
            right: seating.filter(s => s.section === 'right').length,
            sectionLayout: {
                left: { rows: leftMaxRow, columns: leftMaxCol },
                right: { rows: rightMaxRow, columns: rightMaxCol }
            }
        };

        res.json({ seating, stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get my seat (Participant/Volunteer/Admin)
router.get('/my-seat', requireAuth, async (req, res) => {
    try {
        console.log('🪑 My-seat endpoint hit by user:', req.user?.userId);

        const user = await User.findById(req.user.userId).select('teamId');
        console.log('🪑 User found:', user);

        if (!user || !user.teamId) {
            console.log('🪑 No teamId for user');
            return res.status(404).json({ message: 'No team assigned to your account' });
        }

        const mySeating = await Seating.findOne({ teamId: user.teamId });
        console.log('🪑 Seating found for team', user.teamId, ':', mySeating);

        if (!mySeating) {
            console.log('🪑 No seating found for team:', user.teamId);
            return res.status(404).json({ message: 'Seating not yet assigned for your team' });
        }

        // Get ALL seating to build the full map
        const allSeating = await Seating.find({});

        let leftMaxRow = 0, leftMaxCol = 0;
        let rightMaxRow = 0, rightMaxCol = 0;
        const occupiedSeats = [];

        allSeating.forEach(team => {
            team.seats.forEach(seat => {
                // Add to occupied list
                occupiedSeats.push({
                    row: seat.row,
                    column: seat.column,
                    section: team.section
                });

                // Calculate dimensions
                if (team.section === 'left') {
                    if (seat.row > leftMaxRow) leftMaxRow = seat.row;
                    if (seat.column > leftMaxCol) leftMaxCol = seat.column;
                } else {
                    if (seat.row > rightMaxRow) rightMaxRow = seat.row;
                    if (seat.column > rightMaxCol) rightMaxCol = seat.column;
                }
            });
        });

        // Add padding (min 10x10)
        leftMaxRow = Math.max(leftMaxRow, 10);
        leftMaxCol = Math.max(leftMaxCol, 10);
        rightMaxRow = Math.max(rightMaxRow, 10);
        rightMaxCol = Math.max(rightMaxCol, 10);

        const response = {
            mySeating: {
                teamId: mySeating.teamId,
                section: mySeating.section,
                teamSize: mySeating.teamSize,
                seats: mySeating.seats,
                labName: mySeating.labName
            },
            allOccupiedSeats: occupiedSeats,
            sectionLayout: {
                left: { rows: leftMaxRow, columns: leftMaxCol },
                right: { rows: rightMaxRow, columns: rightMaxCol }
            }
        };

        console.log('🪑 Sending response with full map data');
        res.json(response);
    } catch (error) {
        console.error('🪑 Error in my-seat:', error);
        res.status(500).json({ message: error.message });
    }
});

// Clear all seating (Admin only)
router.delete('/', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        // Drop the collection to remove old indexes
        await Seating.collection.drop().catch(() => {
            // Ignore error if collection doesn't exist
        });

        res.json({
            message: 'All seating arrangements cleared and indexes reset',
            deletedCount: 'all'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
