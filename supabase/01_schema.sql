-- ========================================================================
-- FOOD OPERATIONS SCHEMA (ZERO-CONFLICT ISOLATED ARCHITECTURE)
-- Project: WhatsApp Multi-Agent Restaurant Ordering System
-- Author: Autonomous AI Restaurant Automation
-- ========================================================================

-- 1. Create Dedicated Isolated Schema
CREATE SCHEMA IF NOT EXISTS food_ops;

-- 2. Create Custom ENUM for Order Lifecycle
DO $$ BEGIN
    CREATE TYPE food_ops.order_status AS ENUM (
        'received',          -- Placed by customer via WhatsApp A
        'confirmed',         -- Confirmed by Kitchen / System
        'preparing',         -- Kitchen actively preparing
        'out_for_delivery',  -- Rider dispatched
        'delivered',         -- Handed to customer
        'cancelled'          -- Cancelled by customer or restaurant
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Menu Categories
CREATE TABLE IF NOT EXISTS food_ops.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Menu Items Table
CREATE TABLE IF NOT EXISTS food_ops.menu_items (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES food_ops.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    prep_time_mins INT DEFAULT 20,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders Table (Primary Transaction Table)
CREATE TABLE IF NOT EXISTS food_ops.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    order_items JSONB NOT NULL, -- e.g. [{"item": "Zinger Burger", "qty": 2, "price": 600, "total": 1200}]
    subtotal NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 100.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    special_notes TEXT,
    status food_ops.order_status DEFAULT 'received',
    estimated_prep_mins INT DEFAULT 35,
    
    -- Lifecycle Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    prepared_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

-- 6. Order Audit & Event History (Logs every status change)
CREATE TABLE IF NOT EXISTS food_ops.order_events (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES food_ops.orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    triggered_by TEXT DEFAULT 'system', -- 'customer_wa_a', 'kitchen_wa_b', 'dashboard', 'system'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Conversational Chat Memory Table (For n8n LangChain Memory)
CREATE TABLE IF NOT EXISTS food_ops.chat_memory (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL, -- customer_phone e.g. "923001234567"
    message JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_memory_session ON food_ops.chat_memory(session_id);

-- 8. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_phone ON food_ops.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_number ON food_ops.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON food_ops.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON food_ops.orders(created_at DESC);

-- 9. Auto-Update Timestamp Trigger Function
CREATE OR REPLACE FUNCTION food_ops.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_orders_timestamp ON food_ops.orders;
CREATE TRIGGER set_orders_timestamp
    BEFORE UPDATE ON food_ops.orders
    FOR EACH ROW
    EXECUTE FUNCTION food_ops.trigger_set_timestamp();

-- 10. Helper Function: Generate Clean Human-Friendly Order ID (e.g. ORD-8492)
CREATE OR REPLACE FUNCTION food_ops.generate_order_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    id_exists BOOLEAN;
BEGIN
    LOOP
        new_id := 'ORD-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM food_ops.orders WHERE order_number = new_id) INTO id_exists;
        IF NOT id_exists THEN
            RETURN new_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 11. Stored Procedure: Atomic Status Transition with Timestamp & Audit Log
CREATE OR REPLACE FUNCTION food_ops.update_order_status(
    p_order_number TEXT,
    p_new_status food_ops.order_status,
    p_actor TEXT DEFAULT 'kitchen_dashboard',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT * INTO v_order FROM food_ops.orders WHERE order_number = p_order_number;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Update Order and set specific timestamp
    UPDATE food_ops.orders
    SET 
        status = p_new_status,
        confirmed_at = CASE WHEN p_new_status = 'confirmed' AND confirmed_at IS NULL THEN NOW() ELSE confirmed_at END,
        prepared_at = CASE WHEN p_new_status = 'preparing' AND prepared_at IS NULL THEN NOW() ELSE prepared_at END,
        dispatched_at = CASE WHEN p_new_status = 'out_for_delivery' AND dispatched_at IS NULL THEN NOW() ELSE dispatched_at END,
        delivered_at = CASE WHEN p_new_status = 'delivered' AND delivered_at IS NULL THEN NOW() ELSE delivered_at END,
        cancelled_at = CASE WHEN p_new_status = 'cancelled' AND cancelled_at IS NULL THEN NOW() ELSE cancelled_at END,
        cancellation_reason = CASE WHEN p_new_status = 'cancelled' THEN COALESCE(p_notes, cancellation_reason) ELSE cancellation_reason END
    WHERE order_number = p_order_number;

    -- Insert into Audit Log
    INSERT INTO food_ops.order_events (order_id, order_number, old_status, new_status, triggered_by, notes)
    VALUES (v_order.id, p_order_number, v_order.status::TEXT, p_new_status::TEXT, p_actor, p_notes);

    RETURN jsonb_build_object(
        'success', true,
        'order_number', p_order_number,
        'old_status', v_order.status,
        'new_status', p_new_status,
        'customer_phone', v_order.customer_phone,
        'customer_name', v_order.customer_name
    );
END;
$$ LANGUAGE plpgsql;

-- 12. Security & RLS / Permissions Setup
-- Grant usage on schema to standard roles
GRANT USAGE ON SCHEMA food_ops TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA food_ops TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA food_ops TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA food_ops TO anon, authenticated, service_role;

-- Enable RLS with permissive policies for food_ops tables
ALTER TABLE food_ops.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_ops.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_ops.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_ops.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_ops.chat_memory ENABLE ROW LEVEL SECURITY;

-- Allow read & write for anon and authenticated (ideal for frontend dashboard and n8n)
CREATE POLICY "Public Read Menu Categories" ON food_ops.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Menu Items" ON food_ops.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow All on Orders" ON food_ops.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All on Events" ON food_ops.order_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All on Chat Memory" ON food_ops.chat_memory FOR ALL USING (true) WITH CHECK (true);
