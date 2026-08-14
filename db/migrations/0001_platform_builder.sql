-- Migration: Add platform builder columns and tables
-- Adds website type system, module system, and extends templates/pages

-- 1. Add website type columns (additive, preserves existing data)
ALTER TABLE websites ADD COLUMN type TEXT DEFAULT 'business';
ALTER TABLE websites ADD COLUMN type_config TEXT DEFAULT '{}';

-- 2. Extend templates with website_type and module requirements
ALTER TABLE templates ADD COLUMN website_type TEXT DEFAULT 'business';
ALTER TABLE templates ADD COLUMN modules TEXT DEFAULT '[]';

-- 3. Module system tables
CREATE TABLE IF NOT EXISTS website_modules (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  config TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(website_id, module_key)
);

CREATE TABLE IF NOT EXISTS module_data (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for module tables
CREATE INDEX IF NOT EXISTS idx_website_modules_website_id ON website_modules(website_id);
CREATE INDEX IF NOT EXISTS idx_module_data_website_id ON module_data(website_id);
CREATE INDEX IF NOT EXISTS idx_module_data_module_key ON module_data(module_key);
CREATE INDEX IF NOT EXISTS idx_module_data_entity_type ON module_data(entity_type);

-- Indexes for pages
CREATE INDEX IF NOT EXISTS idx_pages_is_homepage ON pages(website_id, is_homepage);