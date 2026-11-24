-- ========================================================================
-- SEED DATA FOR RESTAURANT AGENT (US MARKET - USD PRICING & AMERICAN NAMES)
-- Schema: food_ops
-- ========================================================================

-- 1. Insert Categories
INSERT INTO food_ops.categories (id, name, display_order) VALUES
(1, 'Artisan Burgers', 1),
(2, 'Woodfired Pizzas', 2),
(3, 'Appetizers & Sides', 3),
(4, 'Beverages & Shakes', 4),
(5, 'Desserts', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Insert American Menu Items (USD Pricing)
INSERT INTO food_ops.menu_items (category_id, name, description, price, prep_time_mins, is_available) VALUES
(1, 'The Classic Bacon Cheeseburger', 'Angus beef patty, smoked applewood bacon, aged cheddar, lettuce, tomato, house relish on brioche.', 13.99, 15, true),
(1, 'Smoky Texas BBQ Brisket Burger', 'Double Angus smash patties, pulled smoked brisket, crispy onion rings, hickory BBQ sauce, pepper jack cheese.', 16.50, 18, true),
(1, 'Crispy Nashville Hot Chicken', 'Buttermilk fried chicken breast tossed in cayenne hot honey, dill pickles, creamy coleslaw on toasted potato bun.', 14.25, 15, true),
(1, 'Truffle Mushroom Swiss Burger', 'Prime beef blend, sautéed cremini mushrooms, melted Swiss cheese, black truffle aioli, baby arugula.', 15.75, 16, true),

(2, 'Brooklyn Pepperoni Feast (14" Large)', 'Hand-stretched sourdough crust, San Marzano tomato sauce, double cupping pepperoni, fresh mozzarella, hot honey drizzle.', 21.99, 22, true),
(2, 'Smoked BBQ Chicken Pizza (14" Large)', 'Grilled chicken breast, red onions, smoked gouda, cilantro, tangy Kansas City BBQ base.', 19.50, 20, true),
(2, 'Four-Cheese Margherita (14" Large)', 'Fresh mozzarella, fontina, gorgonzola, parmesan reggiano, crushed plum tomatoes, fresh basil.', 18.25, 18, true),

(3, 'Loaded Truffle Parmesan Fries', 'Hand-cut russet fries tossed in white truffle oil, shaved parmesan, fresh parsley, garlic aioli dip.', 7.50, 10, true),
(3, 'Buffalo Wings (8 Pcs)', 'Jumbo crispy chicken wings tossed in classic buffalo butter sauce, celery sticks, blue cheese dip.', 11.99, 14, true),
(3, 'Mozzarella Sticks (6 Pcs)', 'Beer-battered golden mozzarella sticks with warm house marinara dipping sauce.', 8.25, 10, true),

(4, 'Hand-Spun Salted Caramel Shake', 'Bourbon vanilla bean ice cream blended with salted caramel fudge, pretzel crumbles, whipped cream.', 6.50, 6, true),
(4, 'Fresh Strawberry Lemonade', 'Muddled fresh strawberries, squeezed California lemons, pure cane sugar, mint sprig.', 4.75, 4, true),
(4, 'Iced Cold Brew Coffee', 'Slow-steeped organic cold brew over craft ice cubes.', 4.25, 3, true),
(4, 'Classic Coca-Cola Can (12 oz)', 'Chilled classic Coca-Cola.', 2.50, 1, true),

(5, 'Warm Cast-Iron Chocolate Chip Cookie', 'Freshly baked skillet cookie topped with Madagascar vanilla gelato and chocolate drizzle.', 8.50, 12, true),
(5, 'New York Style Cheesecake', 'Classic creamy cheesecake slice with wild berry compote.', 7.95, 5, true)
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, description = EXCLUDED.description;

-- 3. Insert Realistic American Seed Orders
INSERT INTO food_ops.orders (
    order_number, customer_name, customer_phone, delivery_address, 
    order_items, subtotal, delivery_fee, total_amount, special_notes, 
    status, estimated_prep_mins, created_at
) VALUES
(
    'ORD-2041',
    'Michael Johnson',
    '+1 (555) 234-5678',
    '742 Evergreen Terrace, Springfield, OR 97477',
    '[{"item": "The Classic Bacon Cheeseburger", "qty": 2, "price": 13.99, "total": 27.98}, {"item": "Loaded Truffle Parmesan Fries", "qty": 1, "price": 7.50, "total": 7.50}, {"item": "Hand-Spun Salted Caramel Shake", "qty": 2, "price": 6.50, "total": 13.00}]'::jsonb,
    48.48,
    3.99,
    52.47,
    'Leave at front porch table. Ring doorbell once.',
    'preparing',
    25,
    NOW() - INTERVAL '14 minutes'
),
(
    'ORD-7719',
    'Sarah Jenkins',
    '+1 (555) 876-5432',
    '450 5th Ave, Apt 12B, New York, NY 10018',
    '[{"item": "Brooklyn Pepperoni Feast (14\\" Large)", "qty": 1, "price": 21.99, "total": 21.99}, {"item": "Buffalo Wings (8 Pcs)", "qty": 1, "price": 11.99, "total": 11.99}, {"item": "Classic Coca-Cola Can (12 oz)", "qty": 2, "price": 2.50, "total": 5.00}]'::jsonb,
    38.98,
    3.99,
    42.97,
    'Buzzer code #4021. Elevator is on the left.',
    'received',
    30,
    NOW() - INTERVAL '4 minutes'
),
(
    'ORD-5820',
    'David Miller',
    '+1 (555) 432-1098',
    '1284 Sunset Blvd, Los Angeles, CA 90026',
    '[{"item": "Crispy Nashville Hot Chicken", "qty": 1, "price": 14.25, "total": 14.25}, {"item": "Fresh Strawberry Lemonade", "qty": 1, "price": 4.75, "total": 4.75}]'::jsonb,
    19.00,
    3.99,
    22.99,
    'Please include extra ranch dressing.',
    'out_for_delivery',
    35,
    NOW() - INTERVAL '32 minutes'
),
(
    'ORD-1093',
    'Emily Davis',
    '+1 (555) 987-6543',
    '350 S Michigan Ave, Chicago, IL 60604',
    '[{"item": "Truffle Mushroom Swiss Burger", "qty": 1, "price": 15.75, "total": 15.75}, {"item": "Warm Cast-Iron Chocolate Chip Cookie", "qty": 1, "price": 8.50, "total": 8.50}]'::jsonb,
    24.25,
    3.99,
    28.24,
    'Extra napkins please.',
    'delivered',
    30,
    NOW() - INTERVAL '65 minutes'
)
ON CONFLICT (order_number) DO NOTHING;

-- Log initial events
INSERT INTO food_ops.order_events (order_number, old_status, new_status, triggered_by, notes, created_at)
SELECT order_number, NULL, status::TEXT, 'seed_script', 'Initial order creation', created_at 
FROM food_ops.orders
WHERE order_number IN ('ORD-2041', 'ORD-7719', 'ORD-5820', 'ORD-1093')
ON CONFLICT DO NOTHING;
