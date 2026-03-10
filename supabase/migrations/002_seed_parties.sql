-- ============================================================================
-- NZ Election Tracker — Seed: NZ Political Parties (as of 2026)
-- ============================================================================

INSERT INTO parties (name, short_name, colour, website_url, sort_order) VALUES
  ('New Zealand National Party',   'NAT', '#00529F', 'https://www.national.org.nz',   1),
  ('New Zealand Labour Party',     'LAB', '#D82A20', 'https://www.labour.org.nz',     2),
  ('Green Party of Aotearoa NZ',   'GRN', '#098137', 'https://www.greens.org.nz',     3),
  ('ACT New Zealand',              'ACT', '#FDE401', 'https://www.act.org.nz',        4),
  ('New Zealand First',            'NZF', '#000000', 'https://www.nzfirst.nz',        5),
  ('Te Pāti Māori',               'TPM', '#B2001A', 'https://www.maoriparty.org.nz', 6),
  ('The Opportunities Party',      'TOP', '#32DAC3', 'https://www.top.org.nz',        7),
  ('New Zealand Loyal',            'NZL', '#512888', NULL,                              8),
  ('Democracy NZ',                 'DNZ', '#FF6600', NULL,                              9),
  ('Other',                        'OTH', '#999999', NULL,                             99)
ON CONFLICT (short_name) DO NOTHING;
