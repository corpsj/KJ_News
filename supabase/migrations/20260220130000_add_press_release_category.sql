SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 0));

INSERT INTO categories (name, slug, description, color)
VALUES ('보도자료', 'press_release', '뉴스팩토리 보도자료', '#64748b')
ON CONFLICT (slug) DO NOTHING;
