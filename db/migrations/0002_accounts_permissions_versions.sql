-- Migration: Multi-tenant account system, RBAC, permissions, versions and publishing
-- Adds account management, roles, permissions, website assignment and versioning.
-- NOTE: users/websites/pages column additions and the roles/permissions/account_websites/
-- draft_versions/published_versions tables are defined in db/schema.sql, so this migration
-- only seeds the system roles and permission catalog.

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