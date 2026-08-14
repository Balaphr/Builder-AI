-- Migration: Multi-tenant account system, RBAC, permissions, versions and publishing
-- Adds account management, roles, permissions, website assignment and versioning.

-- 1. Extend users table with account type / disabled / creator / permissions
ALTER TABLE users ADD COLUMN account_type TEXT DEFAULT 'custom' CHECK (account_type IN ('admin', 'sub', 'test', 'custom'));
ALTER TABLE users ADD COLUMN is_disabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN created_by TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '[]';

-- 2. Extend websites with versioning columns
ALTER TABLE websites ADD COLUMN last_published_version INTEGER DEFAULT 0;
ALTER TABLE websites ADD COLUMN published_version INTEGER DEFAULT 0;

-- 3. Extend pages with status / visibility / modified tracking
ALTER TABLE pages ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'modified', 'published', 'scheduled', 'unpublished'));
ALTER TABLE pages ADD COLUMN visibility TEXT DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden'));
ALTER TABLE pages ADD COLUMN modified INTEGER DEFAULT 0;

-- 4. Roles table (RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT DEFAULT '[]',
  is_system INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 5. Permissions catalog
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 6. Website access assignments (tenant isolation for sub/test accounts)
CREATE TABLE IF NOT EXISTS account_websites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  permissions TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, website_id)
);

-- 7. Draft versions (snapshots used for rollback/recovery)
CREATE TABLE IF NOT EXISTS draft_versions (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  label TEXT,
  pages_json TEXT DEFAULT '[]',
  settings_json TEXT DEFAULT '{}',
  theme_json TEXT DEFAULT '{}',
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 8. Published versions (what is live; supports rollback)
CREATE TABLE IF NOT EXISTS published_versions (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  pages_json TEXT DEFAULT '[]',
  settings_json TEXT DEFAULT '{}',
  theme_json TEXT DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'rolled_back')),
  published_by TEXT REFERENCES users(id),
  published_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_account_websites_user_id ON account_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_account_websites_website_id ON account_websites(website_id);
CREATE INDEX IF NOT EXISTS idx_draft_versions_website_id ON draft_versions(website_id);
CREATE INDEX IF NOT EXISTS idx_published_versions_website_id ON published_versions(website_id);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(website_id, status);

-- Seed the default system roles and permission catalog
INSERT OR IGNORE INTO roles (id, name, description, permissions, is_system) VALUES
('role-admin', 'Admin', 'Full platform access', '["*"]', 1),
('role-owner', 'Website Owner', 'Full access to assigned websites', '["dashboard","website.view","website.create","website.edit","builder","pages.create","pages.edit","pages.publish","domain","publish","reports","settings","ai","media","seo"]', 1),
('role-editor', 'Editor', 'Edit assigned website content', '["dashboard","website.view","website.edit","builder","pages.create","pages.edit","ai","media"]', 1),
('role-test', 'Test Account', 'Limited read-only preview access', '["dashboard","website.view","builder","preview"]', 1),
('role-viewer', 'Viewer', 'View only access', '["dashboard","website.view","preview"]', 1);

INSERT OR IGNORE INTO permissions (id, key, name, description, category) VALUES
('perm-dashboard', 'dashboard', 'Dashboard', 'Access the main dashboard', 'general'),
('perm-search', 'search', 'Global Search AI', 'Use the global AI search', 'ai'),
('perm-assist', 'assist', 'Assist AI', 'Use the AI builder assistant', 'ai'),
('perm-website.view', 'website.view', 'View Websites', 'View assigned websites', 'websites'),
('perm-website.create', 'website.create', 'Create Websites', 'Create new websites', 'websites'),
('perm-website.edit', 'website.edit', 'Edit Websites', 'Edit website details', 'websites'),
('perm-website.delete', 'website.delete', 'Delete Websites', 'Delete websites', 'websites'),
('perm-builder', 'builder', 'Builder Access', 'Open and use the website builder', 'builder'),
('perm-pages.create', 'pages.create', 'Create Pages', 'Create and duplicate pages', 'builder'),
('perm-pages.edit', 'pages.edit', 'Edit Pages', 'Edit pages and sections', 'builder'),
('perm-pages.publish', 'pages.publish', 'Publish Pages', 'Publish/unpublish pages', 'builder'),
('perm-publish', 'publish', 'Publish Website', 'Publish the website to production', 'websites'),
('perm-domain', 'domain', 'Domain Management', 'Manage custom domains', 'websites'),
('perm-reports', 'reports', 'Reports', 'View website reports', 'analytics'),
('perm-settings', 'settings', 'Site Settings', 'Change site settings and theme', 'builder'),
('perm-accounts', 'accounts', 'Account Management', 'Manage sub-accounts and roles', 'admin'),
('perm-ai', 'ai', 'AI Features', 'Use AI generation and chat features', 'ai'),
('perm-media', 'media', 'Media Library', 'Upload and manage media', 'media'),
('perm-seo', 'seo', 'SEO', 'Configure SEO settings', 'builder'),
('perm-modules', 'modules', 'Modules', 'Enable and configure modules', 'websites');