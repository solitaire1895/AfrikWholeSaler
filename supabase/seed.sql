-- ============================================================================
-- AfrikWholesaler — Seed Data
-- Run this AFTER schema.sql to populate initial catalog data.
-- This script is IDEMPOTENT — it uses ON CONFLICT to avoid duplicates.
-- ============================================================================

-- 1. Categories (let DB auto-generate UUIDs, use slug for dedup)
INSERT INTO categories (name, slug, icon, product_count) VALUES
  ('Electronics', 'electronics', 'Smartphone', 8),
  ('Textiles & Apparel', 'textiles-apparel', 'Shirt', 2),
  ('Machinery & Tools', 'machinery-tools', 'Wrench', 1),
  ('Home & Garden', 'home-garden', 'Home', 1),
  ('Beauty & Personal Care', 'beauty-personal-care', 'Sparkles', 1),
  ('Automotive Parts', 'automotive-parts', 'Car', 0),
  ('Construction Materials', 'construction-materials', 'Building2', 0),
  ('Packaging & Printing', 'packaging-printing', 'Package', 1)
ON CONFLICT (slug) DO NOTHING;

-- 2. Sub-Categories (look up category_id by slug)
INSERT INTO sub_categories (name, slug, icon, category_id, category_slug, product_count, is_active)
SELECT v.name, v.slug, v.icon, c.id, v.category_slug, v.product_count, true
FROM (VALUES
  ('Chargers & Adapters', 'chargers-adapters', 'Plug', 'electronics', 2),
  ('Audio Devices', 'audio-devices', 'Headphones', 'electronics', 1),
  ('Lighting', 'lighting', 'Lightbulb', 'electronics', 1),
  ('T-Shirts & Tops', 'tshirts-tops', 'Shirt', 'textiles-apparel', 1),
  ('Activewear', 'activewear', 'Activity', 'textiles-apparel', 0),
  ('Power Tools', 'power-tools', 'Drill', 'machinery-tools', 1),
  ('Hand Tools', 'hand-tools', 'Wrench', 'machinery-tools', 0),
  ('Kitchenware', 'kitchenware', 'Utensils', 'home-garden', 1),
  ('Decor', 'decor', 'Sofa', 'home-garden', 0),
  ('Skincare', 'skincare', 'Sparkles', 'beauty-personal-care', 1),
  ('Hair Care', 'hair-care', 'Scissors', 'beauty-personal-care', 0),
  ('Engine Parts', 'engine-parts', 'Cog', 'automotive-parts', 0),
  ('Accessories', 'auto-accessories', 'Car', 'automotive-parts', 0),
  ('Cement & Concrete', 'cement-concrete', 'Box', 'construction-materials', 0),
  ('Roofing', 'roofing', 'Home', 'construction-materials', 0),
  ('Shipping Supplies', 'shipping-supplies', 'Package', 'packaging-printing', 1),
  ('Printing Materials', 'printing-materials', 'Printer', 'packaging-printing', 0)
) AS v(name, slug, icon, category_slug, product_count)
JOIN categories c ON c.slug = v.category_slug
ON CONFLICT (slug) DO NOTHING;

-- 3. Products (look up category_id and sub_category_id by slug)
INSERT INTO products (name, slug, description, category, category_slug, category_id, sub_category, sub_category_slug, sub_category_id, origin_country, images, video_url, moq, price_tiers, stock_status, stock_quantity, badges, specs, featured, rating, review_count, shipping_estimate, import_tax_rate, delivery_days_min, delivery_days_max, is_active)
SELECT v.name, v.slug, v.description, v.category, v.category_slug, c.id, v.sub_category, v.sub_category_slug, sc.id, v.origin_country, v.images, NULL, v.moq, v.price_tiers, v.stock_status, v.stock_quantity, v.badges, v.specs, v.featured, v.rating, v.review_count, v.shipping_estimate, v.import_tax_rate, v.delivery_days_min, v.delivery_days_max, true
FROM (VALUES
  ('Wholesale USB-C Fast Chargers 20W', 'wholesale-usb-c-chargers-20w',
   'High-quality 20W USB-C power adapters with PD fast charging support. Compatible with iPhone, Samsung, and other USB-C devices. CE/FCC/RoHS certified.',
   'Electronics', 'electronics', 'Chargers & Adapters', 'chargers-adapters', 'China',
   '["https://images.unsplash.com/photo-1583863788434-e58a36330269?w=800&q=80"]'::jsonb, 100,
   '[{"minQuantity":100,"maxQuantity":499,"price":3.2,"currency":"USD"},{"minQuantity":500,"maxQuantity":999,"price":2.8,"currency":"USD"},{"minQuantity":1000,"maxQuantity":null,"price":2.4,"currency":"USD"}]'::jsonb,
   'In Stock'::stock_status, 5000, '["Best Seller","Fast Shipping"]'::jsonb,
   '[{"label":"Power Output","value":"20W"},{"label":"Connector","value":"USB-C"},{"label":"Certification","value":"CE/FCC/RoHS"},{"label":"Input","value":"100-240V AC"}]'::jsonb,
   true, 4.8, 124, '1.2', 0.30, 15, 25),
  ('Bulk Cotton T-Shirts 180gsm', 'bulk-cotton-t-shirts-180gsm',
   'Premium 100% cotton t-shirts at 180gsm weight. Available in 20+ colors and sizes S-3XL. Custom branding and screen printing available.',
   'Textiles & Apparel', 'textiles-apparel', 'T-Shirts & Tops', 'tshirts-tops', 'China',
   '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"]'::jsonb, 200,
   '[{"minQuantity":200,"maxQuantity":499,"price":2.5,"currency":"USD"},{"minQuantity":500,"maxQuantity":1999,"price":2.1,"currency":"USD"},{"minQuantity":2000,"maxQuantity":null,"price":1.8,"currency":"USD"}]'::jsonb,
   'In Stock'::stock_status, 10000, '["Featured","Wholesale"]'::jsonb,
   '[{"label":"Material","value":"100% Cotton"},{"label":"Weight","value":"180gsm"},{"label":"Sizes","value":"S-3XL"},{"label":"Colors","value":"20+ available"}]'::jsonb,
   true, 4.7, 89, '0.8', 0.20, 20, 30),
  ('Industrial LED Flood Lights 100W', 'industrial-led-flood-lights-100w',
   'High-efficiency 100W LED flood lights for industrial and outdoor use. IP65 waterproof rating, 50,000+ hour lifespan.',
   'Electronics', 'electronics', 'Lighting', 'lighting', 'China',
   '["https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800&q=80"]'::jsonb, 50,
   '[{"minQuantity":50,"maxQuantity":199,"price":18.5,"currency":"USD"},{"minQuantity":200,"maxQuantity":499,"price":16.0,"currency":"USD"},{"minQuantity":500,"maxQuantity":null,"price":13.5,"currency":"USD"}]'::jsonb,
   'In Stock'::stock_status, 800, '["Premium","AI Recommended"]'::jsonb,
   '[{"label":"Power","value":"100W"},{"label":"Lumens","value":"10,000 lm"},{"label":"IP Rating","value":"IP65"},{"label":"Lifespan","value":"50,000+ hours"}]'::jsonb,
   true, 4.9, 67, '3.5', 0.80, 18, 28),
  ('Wholesale Bluetooth Earbuds 5.3', 'wholesale-bluetooth-earbuds-5-3',
   'True wireless earbuds with Bluetooth 5.3, active noise cancellation, and 30-hour battery life with charging case.',
   'Electronics', 'electronics', 'Audio Devices', 'audio-devices', 'China',
   '["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80"]'::jsonb, 100,
   '[{"minQuantity":100,"maxQuantity":499,"price":8.5,"currency":"USD"},{"minQuantity":500,"maxQuantity":999,"price":7.2,"currency":"USD"},{"minQuantity":1000,"maxQuantity":null,"price":6.0,"currency":"USD"}]'::jsonb,
   'In Stock'::stock_status, 3000, '["New","Best Seller"]'::jsonb,
   '[{"label":"Bluetooth","value":"5.3"},{"label":"Battery","value":"30 hours (with case)"},{"label":"ANC","value":"Yes"},{"label":"Water Resistance","value":"IPX4"}]'::jsonb,
   true, 4.6, 203, '1.0', 0.25, 15, 25),
  ('Bulk Ceramic Mugs 350ml', 'bulk-ceramic-mugs-350ml',
   'Classic white ceramic coffee mugs, 350ml capacity. Dishwasher and microwave safe. Custom logo printing available.',
   'Home & Garden', 'home-garden', 'Kitchenware', 'kitchenware', 'China',
   '["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80"]'::jsonb, 500,
   '[{"minQuantity":500,"maxQuantity":1999,"price":1.2,"currency":"USD"},{"minQuantity":2000,"maxQuantity":4999,"price":0.95,"currency":"USD"},{"minQuantity":5000,"maxQuantity":null,"price":0.75,"currency":"USD"}]'::jsonb,
   'In Stock'::stock_status, 15000, '["Wholesale","Fast Shipping"]'::jsonb,
   '[{"label":"Capacity","value":"350ml"},{"label":"Material","value":"Ceramic"},{"label":"Microwave Safe","value":"Yes"},{"label":"Dishwasher Safe","value":"Yes"}]'::jsonb,
   true, 4.5, 45, '0.5', 0.10, 20, 35),
  ('Cordless Drill Set 21V', 'cordless-drill-set-21v',
   'Professional 21V cordless drill set with 2 batteries, charger, and 30-piece accessory kit. Brushless motor.',
   'Machinery & Tools', 'machinery-tools', 'Power Tools', 'power-tools', 'China',
   '["https://images.unsplash.com/photo-1504148455338-c2583d470217?w=800&q=80"]'::jsonb, 30,
   '[{"minQuantity":30,"maxQuantity":99,"price":42.0,"currency":"USD"},{"minQuantity":100,"maxQuantity":299,"price":38.0,"currency":"USD"},{"minQuantity":300,"maxQuantity":null,"price":32.0,"currency":"USD"}]'::jsonb,
   'Low Stock'::stock_status, 150, '["Premium","Limited Stock"]'::jsonb,
   '[{"label":"Voltage","value":"21V"},{"label":"Motor","value":"Brushless"},{"label":"Batteries","value":"2x 2.0Ah"},{"label":"Accessories","value":"30 pieces"}]'::jsonb,
   true, 4.8, 34, '5.0', 1.50, 20, 30),
  ('Wholesale Natural Skincare Set', 'wholesale-natural-skincare-set',
   'Complete skincare set with cleanser, toner, serum, and moisturizer. Natural ingredients, cruelty-free.',
   'Beauty & Personal Care', 'beauty-personal-care', 'Skincare', 'skincare', 'China',
   '["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80"]'::jsonb, 100,
   '[{"minQuantity":100,"maxQuantity":499,"price":12.5,"currency":"USD"},{"minQuantity":500,"maxQuantity":999,"price":10.8,"currency":"USD"},{"minQuantity":1000,"maxQuantity":null,"price":8.5,"currency":"USD"}]'::jsonb,
   'In Stock'::stock_status, 2000, '["New","Featured"]'::jsonb,
   '[{"label":"Pieces","value":"4 (cleanser, toner, serum, moisturizer)"},{"label":"Ingredients","value":"Natural, cruelty-free"},{"label":"Skin Type","value":"All types"},{"label":"Private Label","value":"Available"}]'::jsonb,
   true, 4.7, 56, '2.0', 0.50, 18, 28),
  ('Bulk Corrugated Shipping Boxes', 'bulk-corrugated-shipping-boxes',
   'Heavy-duty corrugated cardboard shipping boxes in various sizes. 3-layer construction for maximum protection.',
   'Packaging & Printing', 'packaging-printing', 'Shipping Supplies', 'shipping-supplies', 'China',
   '["https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80"]'::jsonb, 1000,
   '[{"minQuantity":1000,"maxQuantity":4999,"price":0.45,"currency":"USD"},{"minQuantity":5000,"maxQuantity":9999,"price":0.38,"currency":"USD"},{"minQuantity":10000,"maxQuantity":null,"price":0.30,"currency":"USD"}]'::jsonb,
   'In Stock'::stock_status, 50000, '["Wholesale","Fast Shipping"]'::jsonb,
   '[{"label":"Material","value":"3-layer corrugated"},{"label":"Sizes","value":"Multiple available"},{"label":"Custom Print","value":"Available"},{"label":"Eco-Friendly","value":"Recyclable"}]'::jsonb,
   false, 4.4, 28, '0.15', 0.05, 15, 25)
) AS v(name, slug, description, category, category_slug, sub_category, sub_category_slug, origin_country, images, moq, price_tiers, stock_status, stock_quantity, badges, specs, featured, rating, review_count, shipping_estimate, import_tax_rate, delivery_days_min, delivery_days_max)
JOIN categories c ON c.slug = v.category_slug
LEFT JOIN sub_categories sc ON sc.slug = v.sub_category_slug
ON CONFLICT (slug) DO NOTHING;
