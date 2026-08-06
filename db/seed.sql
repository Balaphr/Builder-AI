-- Seed data for AI Website Builder

-- Insert default templates
INSERT INTO templates (id, name, category, description, thumbnail, is_pro) VALUES
('tpl-restaurant', 'Restaurant', 'Food & Drink', 'Modern restaurant website with menu, reservations, and gallery', '/templates/restaurant.jpg', 0),
('tpl-hotel', 'Hotel', 'Hospitality', 'Luxury hotel website with booking, rooms, and amenities', '/templates/hotel.jpg', 0),
('tpl-portfolio', 'Portfolio', 'Creative', 'Stunning portfolio for designers and creatives', '/templates/portfolio.jpg', 0),
('tpl-agency', 'Agency', 'Business', 'Professional agency website with services and team', '/templates/agency.jpg', 0),
('tpl-startup', 'Startup', 'Technology', 'Modern startup landing page with features and pricing', '/templates/startup.jpg', 0),
('tpl-ecommerce', 'E-Commerce', 'Shopping', 'Full-featured online store with product catalog', '/templates/ecommerce.jpg', 1),
('tpl-blog', 'Blog', 'Content', 'Clean and readable blog with categories and search', '/templates/blog.jpg', 0),
('tpl-realestate', 'Real Estate', 'Property', 'Property listings with search and virtual tours', '/templates/realestate.jpg', 1),
('tpl-hospital', 'Hospital', 'Healthcare', 'Medical facility website with departments and doctors', '/templates/hospital.jpg', 0),
('tpl-school', 'School', 'Education', 'Educational institution website with courses and events', '/templates/school.jpg', 0),
('tpl-photography', 'Photography', 'Creative', 'Photography portfolio with gallery and booking', '/templates/photography.jpg', 1),
('tpl-music', 'Music', 'Entertainment', 'Band/artist website with music player and tour dates', '/templates/music.jpg', 0),
('tpl-ngo', 'NGO', 'Non-Profit', 'Non-profit organization with donations and events', '/templates/ngo.jpg', 0),
('tpl-construction', 'Construction', 'Industry', 'Construction company with projects and services', '/templates/construction.jpg', 0),
('tpl-personal', 'Personal', 'Individual', 'Personal website with bio, blog, and contact', '/templates/personal.jpg', 0),
('tpl-landing', 'Landing Page', 'Marketing', 'High-converting landing page with CTA sections', '/templates/landing.jpg', 0),
('tpl-podcast', 'Podcast', 'Media', 'Podcast website with episodes and subscribe', '/templates/podcast.jpg', 0),
('tpl-corporate', 'Corporate', 'Business', 'Professional corporate website with multiple pages', '/templates/corporate.jpg', 1),
('tpl-saas', 'SaaS', 'Technology', 'Software-as-a-service product page with pricing', '/templates/saas.jpg', 1),
('tpl-wedding', 'Wedding', 'Events', 'Beautiful wedding website with RSVP and gallery', '/templates/wedding.jpg', 0);

-- Insert default feature flags
INSERT INTO feature_flags (id, name, description, is_enabled, allowed_plans) VALUES
('ff-ai-builder', 'AI Website Builder', 'AI-powered website generation', 1, '["free","pro","business","enterprise"]'),
('ff-ai-chat', 'AI Chat Assistant', 'Chat-based website editing', 1, '["free","pro","business","enterprise"]'),
('ff-ai-images', 'AI Image Generation', 'AI-powered image creation', 1, '["pro","business","enterprise"]'),
('ff-custom-domains', 'Custom Domains', 'Connect custom domain names', 1, '["pro","business","enterprise"]'),
('ff-team-collab', 'Team Collaboration', 'Real-time team editing', 1, '["business","enterprise"]'),
('ff-advanced-analytics', 'Advanced Analytics', 'Detailed website analytics', 1, '["pro","business","enterprise"]'),
('ff-automation', 'Automation Workflows', 'Automated actions and triggers', 1, '["business","enterprise"]'),
('ff-priority-support', 'Priority Support', '24/7 priority customer support', 0, '["enterprise"]');

-- Insert default admin user (password: admin123)
INSERT INTO users (id, email, name, password_hash, role, plan, ai_credits) VALUES
('usr-admin-001', 'admin@aibuilder.com', 'Admin User', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', 'admin', 'enterprise', 999999);
