# Piemetrics Custom API Integration Specification

This document outlines the requirements and data exchange format for the custom menu pricing endpoint to be developed by Piemetrics for Cribnosh.

## 1. Overview
The goal of this integration is to enable Cribnosh to fetch AI-optimized pricing recommendations for menu items (meals and sides) based on historical sales data, competitor benchmarks, and business constraints provided by Cribnosh.

## 2. API Specification (Cribnosh <- Piemetrics)

We require a custom endpoint from Piemetrics that returns optimized prices for specific menu items.

- **Endpoint**: `POST /api/v1/custom/menu-optimization`
- **Headers**:
    - `Authorization`: `Bearer <API_KEY>`
    - `Content-Type`: `application/json`

### Request Format
You can pass a single item or multiple items in the request body.

```json
{
  "items": [
    {
      "item_id": "meal_id_001",
      "item_type": "meal"
    },
    {
      "item_id": "side_id_002",
      "item_type": "side"
    }
  ],
  "context": {
    "location_city": "Lagos",
    "requested_at": 1734873600
  }
}
```

### Expected Response Format
```json
{
  "optimization_id": "opt_12345",
  "timestamp": 1734873600,
  "recommendations": [
    {
      "item_id": "meal_id_001",
      "item_type": "meal",
      "current_price": 1500,
      "recommended_price": 1650,
      "price_range": {
        "min": 1550,
        "max": 1800
      },
      "confidence_score": 0.92,
      "reasoning": "High demand in current location; competitor pricing averages 1750."
    },
    {
      "item_id": "side_id_002",
      "item_type": "side",
      "current_price": 500,
      "recommended_price": 550,
      "price_range": {
        "min": 500,
        "max": 650
      },
      "confidence_score": 0.85,
      "reasoning": "Optimal bundle pricing with Meal A."
    }
  ]
}
```

## 3. Data Exchange (Cribnosh -> Piemetrics)

Cribnosh will provide the following data sets to Piemetrics via a periodic sync or as part of the request payload if required.

### 3.1 Menu Structure
Based on our `meals` and `sides` schemas:
- **Meals**: `id`, `name`, `description`, `current_price`, `cuisine`, `dietary`, `rating`.
- **Sides**: `id`, `name`, `price`, `mealId` (optional linkage), `category`.

### 3.2 Historical Sales Data
Aggregated data from the `orders` table:
- **Order Details**: `order_id`, `items` (ids and quantities), `total_amount`, `order_date`.
- **Location Context**: `delivery_address.city` (to enable regional pricing analysis).
- **Discounts**: `discount_amount`, `discount_type` (to understand price elasticity).

### 3.3 Business Constraints
- **Minimum Margin**: 20% above base cost (if base cost is provided).
- **Maximum Price Cap**: Standard percentage increase limit (e.g., no more than 30% increase at once).
- **Status Filtering**: Only optimize for items where `status === "available"`.

## 4. Pricing Handling Strategy

### 4.1 Update Mechanism
AI-suggested prices will be handled in a two-stage process:
1.  **Staging/Review**: Suggested prices from Piemetrics are first stored in a `priceSuggestions` metadata field or a dedicated table for admin review.
2.  **Application**: Once approved via the Cribnosh Admin Dashboard, the `price` field in the `meals` or `sides` table will be updated.

### 4.2 Handling Discounts & Offers
- **Dynamic Pricing vs. Fixed Offers**: Special offers (`special_offers` table) and coupons (`coupons` table) will continue to apply *on top* of the base price optimized by Piemetrics.
- **Elasticity Tracking**: We will track if a Piemetrics-optimized price results in a lower conversion rate when combined with existing discounts.

### 4.3 Automation Level
Initially, all updates will be **Manual Approval**. Future iterations may allow **Auto-Pilot** for price changes within a +/- 5% range of a predefined "stable price".

---
**Technical Contact**: Cribnosh Engineering (engineering@cribnosh.com)
