# n8n Workflows Setup & Configuration Guide

This guide will help you configure the 3 production n8n workflows for your restaurant ordering system.

---

## 1. Overview of Included Workflows

| File | Purpose | Trigger |
| :--- | :--- | :--- |
| `01_customer_whatsapp_agent.json` | Conversational order taker on WhatsApp Number A | Inbound WhatsApp Webhook |
| `02_kitchen_whatsapp_bridge.json` | Kitchen status manager on WhatsApp Number B | Kitchen WhatsApp Webhook |
| `03_dashboard_api_bridge.json` | REST API for Live Kitchen Display System (KDS) | HTTP GET / POST Webhooks |

---

## 2. Importing Workflows into n8n

1. Open your n8n instance.
2. In the top right corner, click **Workflows** -> **Import from File** (or copy contents of the `.json` file and hit `Ctrl + V`).
3. Save the workflow.

---

## 3. Configuring Credentials in n8n

### A. Supabase / PostgreSQL Credentials
In n8n, create a **Postgres** credential:
- **Host**: `db.<your-project-ref>.supabase.co`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `<your-supabase-db-password>`
- **Port**: `5432` or `6543` (Pooler)
- **SSL**: `Require` / `Allow unauthorized: true`

### B. OpenAI Chat Model Credentials (or Anthropic / Google Gemini)
- Go to credentials -> **OpenAI API**.
- Enter your OpenAI API Key (`sk-...`).
- Model recommended: `gpt-4o-mini` (fast, high accuracy on tool calls, cost-effective).

### C. WhatsApp Provider Setup
The workflow includes an **automatic normalizer** in the first Code node that supports:
1. **Meta WhatsApp Cloud API**:
   - Webhook URL: `https://your-n8n.com/webhook/whatsapp-customer-webhook`
   - Verify Token: Matches your Meta Developer app verify token.
   - Headers: Set your permanent System User Access Token in the HTTP Request node.
2. **Evolution API / Baileys / Z-API**:
   - Webhook URL: Point your Evolution instance webhook to `https://your-n8n.com/webhook/whatsapp-customer-webhook`.
   - The parser automatically detects `data.key.remoteJid` and processes it seamlessly!
3. **Local Testing / Direct Simulation**:
   - Send simple JSON: `{"phone": "923001234567", "message": "Hi menu dikhao"}` and n8n processes it immediately!

---

## 4. How the Two Numbers Interact (A & B)

```
[Customer on WhatsApp A] ───► Places Order (Burger + Fries)
                                   │
                                   ▼
                             [n8n Workflow 1]
                                   │
                                   ├─► Inserts order in Supabase `food_ops.orders` (Status: 'received')
                                   │
                                   └─► Sends WhatsApp Alert to Kitchen Number B:
                                       "🔔 NEW ORDER: ORD-8492
                                        Customer: Hamza (0300-1234567)
                                        Items: 2x Zinger, 1x Fries
                                        Reply: STATUS ORD-8492 PREPARING"

[Kitchen Staff on WhatsApp B] ──► Replies: "STATUS ORD-8492 PREPARING"
                                        │
                                        ▼
                                  [n8n Workflow 2]
                                        │
                                        ├─► Updates Supabase `food_ops.orders` -> status = 'preparing'
                                        │
                                        └─► Sends proactive message to Customer Number A:
                                            "🍳 Chef ne aapka order ORD-8492 banana shuru kar diya hai!"
```

---

## 5. Live Testing Checklist

- [ ] Run `supabase/01_schema.sql` in Supabase SQL editor.
- [ ] Run `supabase/02_seed_data.sql` to populate sample menu.
- [ ] In n8n, activate `01_customer_whatsapp_agent.json`.
- [ ] Test via the built-in [WhatsApp Simulator](../simulator/index.html).
- [ ] Open the [Kitchen Display System](../dashboard/index.html) and watch orders appear live!
