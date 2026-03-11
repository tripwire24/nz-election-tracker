-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text NOT NULL,
  message     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- RLS: no public reads, only service-role inserts via API route
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
