const fs = require('fs');
try {
    const content = fs.readFileSync('c:/Users/kj896/codered_qr-2/backend/scripts/participants_qr_export.csv', 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const teams = {};

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        // Basic CSV parse: Name,Team ID,...
        // Some lines might be "First Last", "Team", ...
        // Regex to capture "Name","Team"
        const match = lines[i].match(/"([^"]+)","([^"]+)"/);
        if (match) {
            const name = match[1];
            const team = match[2];
            if (!teams[team]) teams[team] = [];
            teams[team].push(name);
        }
    }

    const output = Object.entries(teams).map(([teamName, members]) => ({
        teamName,
        members
    }));

    const tsContent = `export interface TeamData {
  teamName: string;
  members: string[];
}

export const TEAMS_DB: TeamData[] = ${JSON.stringify(output, null, 2)};

export function findTeamByMember(memberName: string): string | undefined {
  const normalizedSearch = memberName.toLowerCase().trim();
  const foundTeam = TEAMS_DB.find(team => 
    team.members.some(member => member.toLowerCase().includes(normalizedSearch))
  );
  return foundTeam?.teamName;
}
`;

    fs.writeFileSync('c:/Users/kj896/codered_qr-2/frontend/lib/teamData.ts', tsContent);
    console.log('Successfully wrote teamData.ts');

} catch (e) {
    console.error(e);
}
