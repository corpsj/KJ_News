-- Store the editor's reason when an article is rejected in the review workflow.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '';
