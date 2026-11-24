# Langflow Setup & Integration Guide

This guide explains how to construct the Kitchen Operations Agent inside **Langflow** and connect it to your Supabase `food_ops` database.

---

## 1. Flow Components Architecture in Langflow

```
[Chat Input] ───────► [Prompt Component] ───────► [OpenAI / Anthropic LLM] ───────► [Chat Output]
                             ▲                               │
                             │                               ▼
                 [System Prompt File]                [Tool Calling Agent]
                                                             │
                                        ┌────────────────────┴────────────────────┐
                                        ▼                                         ▼
                            [Tool: Get Active Orders]               [Tool: Update Order Status]
                            (Postgres / Supabase RPC)                 (Postgres / Supabase RPC)
```

---

## 2. Setting Up Tools in Langflow

### Tool 1: `fetch_kitchen_orders` (Python Custom Component in Langflow)
Add a **Custom Component** in Langflow with this Python code:

```python
from langflow.custom import CustomComponent
from typing import Optional
import psycopg2
import json

class FetchKitchenOrders(CustomComponent):
    display_name = "Fetch Kitchen Orders"
    description = "Retrieves live active orders from Supabase food_ops schema."

    def build_config(self):
        return {
            "db_connection_uri": {"display_name": "PostgreSQL Connection String", "password": True},
            "status_filter": {"display_name": "Status Filter (optional)", "value": "active"}
        }

    def build(self, db_connection_uri: str, status_filter: Optional[str] = "active") -> str:
        conn = psycopg2.connect(db_connection_uri)
        cur = conn.cursor()
        
        query = """
            SELECT order_number, customer_name, customer_phone, delivery_address, 
                   order_items, status, ROUND(EXTRACT(EPOCH FROM (NOW() - created_at))/60) as elapsed_mins
            FROM food_ops.orders
            WHERE status IN ('received', 'confirmed', 'preparing', 'out_for_delivery')
            ORDER BY created_at ASC;
        """
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        orders = []
        for r in rows:
            orders.append({
                "order_number": r[0],
                "customer": r[1],
                "phone": r[2],
                "address": r[3],
                "items": r[4],
                "status": r[5],
                "elapsed_mins": r[6]
            })
        return json.dumps(orders, indent=2)
```

### Tool 2: `update_order_status` (Python Custom Component in Langflow)

```python
from langflow.custom import CustomComponent
import psycopg2
import json

class UpdateOrderStatus(CustomComponent):
    display_name = "Update Order Status"
    description = "Updates order status in Supabase and triggers audit log."

    def build_config(self):
        return {
            "db_connection_uri": {"display_name": "PostgreSQL Connection String", "password": True},
            "order_number": {"display_name": "Order Number (e.g. ORD-1024)"},
            "new_status": {"display_name": "New Status (preparing/out_for_delivery/delivered/cancelled)"}
        }

    def build(self, db_connection_uri: str, order_number: str, new_status: str) -> str:
        conn = psycopg2.connect(db_connection_uri)
        cur = conn.cursor()
        
        cur.execute("SELECT food_ops.update_order_status(%s, %s, %s);", (order_number, new_status, 'langflow_agent'))
        result = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return json.dumps(result)
```

---

## 3. Integrating with Langflow Frontend / API

Once your flow is ready in Langflow:
1. Click **API** at the top right of Langflow.
2. You can call this flow directly from your Web Dashboard or WhatsApp Webhook using the Langflow Python Client:
   ```python
   from langflow.load import run_flow_from_json
   result = run_flow_from_json(flow="kitchen_agent.json", input_value="ORD-2041 status kya hai?")
   print(result)
   ```
