-- ============================================
-- Add github_link column to participants table
-- ============================================

-- Add github_link column to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS github_link VARCHAR(500);

-- Add index for faster queries on github_link
CREATE INDEX IF NOT EXISTS idx_participants_github_link 
ON participants(github_link) 
WHERE github_link IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN participants.github_link IS 'GitHub repository link submitted by the participant';

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'participants' 
AND column_name = 'github_link';

