-- View all teams and their member counts in Supabase
SELECT 
    team_id,
    COUNT(*) as member_count,
    COUNT(DISTINCT track) as track_count,
    STRING_AGG(DISTINCT track, ', ') as tracks
FROM participants
WHERE team_id IS NOT NULL
GROUP BY team_id
ORDER BY team_id;