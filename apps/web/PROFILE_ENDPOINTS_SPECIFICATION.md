# Profile Screen Endpoints Specification

This document specifies the exact request and response formats for all endpoints needed by the profile screen.

**Base URL**: `https://cribnosh.com/api`  
**Authentication**: Bearer token in `Authorization` header  
**Content-Type**: `application/json`  
**Accept**: `application/json`

---

## 1. ForkPrint Score Endpoint

### `GET /customer/forkprint/score`
**Description**: Get the user's ForkPrint score, current level/status, and progress to next level.

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**: None
- **Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "score": 799,
    "status": "Tastemaker",
    "points_to_next": 3,
    "next_level": "Food Influencer",
    "current_level_icon": null,
    "level_history": [
      {
        "level": "Tastemaker",
        "unlocked_at": "2024-01-10T10:00:00Z"
      }
    ],
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response Fields**:
- `score` (number, required): Current ForkPrint score (e.g., 799)
- `status` (string, required): Current level/status name (e.g., "Tastemaker", "Food Influencer", "Chef's Choice", etc.)
- `points_to_next` (number, required): Number of points needed to reach the next level
- `next_level` (string, required): Name of the next level (e.g., "Food Influencer")
- `current_level_icon` (string | null, optional): Icon/emoji identifier for current level
- `level_history` (array, optional): Array of levels the user has unlocked with timestamps
- `updated_at` (string, ISO 8601): Last time the score was updated

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User has no ForkPrint score yet (new user)

**Example Error Response** (404):
```json
{
  "success": false,
  "message": "ForkPrint score not found for this user",
  "error": "NOT_FOUND"
}
```

---

## 2. Nosh Points/Rewards Endpoint

### `GET /customer/rewards/nosh-points`
**Description**: Get the user's Nosh Points (coins/rewards points) balance and progress.

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**: None
- **Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "available_points": 1240,
    "total_points_earned": 5420,
    "total_points_spent": 4180,
    "progress_percentage": 40,
    "progress_to_next_coin": 40,
    "next_milestone": {
      "points_needed": 60,
      "total_points_required": 1300,
      "reward": "Bonus Coin"
    },
    "currency": "coins",
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

**Response Fields**:
- `available_points` (number, required): Currently available coins/points (e.g., 1240)
- `total_points_earned` (number, optional): Lifetime total points earned
- `total_points_spent` (number, optional): Lifetime total points spent
- `progress_percentage` (number, required): Progress to next coin milestone (0-100)
- `progress_to_next_coin` (number, optional): Alternative name for progress_percentage
- `next_milestone` (object, optional): Information about the next milestone
  - `points_needed` (number): Points needed to reach next milestone
  - `total_points_required` (number): Total points required for milestone
  - `reward` (string): Description of milestone reward
- `currency` (string, optional): Currency/unit name (default: "coins")
- `last_updated` (string, ISO 8601): Last time points were updated

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

---

## 3. Calories Progress Endpoint

### `GET /customer/nutrition/calories-progress`
**Description**: Get the user's daily calorie consumption progress and goals.

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**: 
  - `date` (optional, string, ISO 8601): Specific date to get progress for (default: today)
- **Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "consumed": 1845,
    "goal": 2000,
    "remaining": 155,
    "progress_percentage": 92,
    "goal_type": "daily",
    "breakdown": {
      "breakfast": 420,
      "lunch": 650,
      "dinner": 775,
      "snacks": 0
    },
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response Fields**:
- `date` (string, ISO 8601 date): Date for this progress data
- `consumed` (number, required): Total calories consumed today
- `goal` (number, required): Daily calorie goal
- `remaining` (number, required): Calories remaining to reach goal
- `progress_percentage` (number, required): Progress percentage (0-100, can exceed 100)
- `goal_type` (string, optional): Type of goal (e.g., "daily", "weekly")
- `breakdown` (object, optional): Calorie breakdown by meal type
  - `breakfast` (number): Calories from breakfast
  - `lunch` (number): Calories from lunch
  - `dinner` (number): Calories from dinner
  - `snacks` (number): Calories from snacks
- `updated_at` (string, ISO 8601): Last time calories were logged

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

**Example Query**:
```
GET /customer/nutrition/calories-progress?date=2024-01-15
```

---

## 4. Monthly Overview (KPI Cards) Endpoint

### `GET /customer/stats/monthly-overview`
**Description**: Get monthly statistics including meals logged, calories tracked, and current streak.

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**: 
  - `month` (optional, string, YYYY-MM): Specific month to get stats for (default: current month)
- **Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "month": "2024-01",
    "period_label": "This Month",
    "meals": {
      "count": 24,
      "period": "This Month"
    },
    "calories": {
      "tracked": 2847,
      "period": "This Month"
    },
    "streak": {
      "current": 7,
      "period": "Current",
      "best_streak": 14,
      "streak_start_date": "2024-01-09"
    },
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response Fields**:
- `month` (string, YYYY-MM): Month for this data (e.g., "2024-01")
- `period_label` (string): Human-readable period label (e.g., "This Month")
- `meals` (object, required): Meals statistics
  - `count` (number): Total meals logged this month
  - `period` (string): Period label (e.g., "This Month")
- `calories` (object, required): Calories statistics
  - `tracked` (number): Total calories tracked this month
  - `period` (string): Period label (e.g., "This Month")
- `streak` (object, required): Streak statistics
  - `current` (number): Current streak in days (e.g., 7)
  - `period` (string): Period label (e.g., "Current")
  - `best_streak` (number, optional): Best streak achieved
  - `streak_start_date` (string, ISO 8601 date, optional): When current streak started
- `updated_at` (string, ISO 8601): Last time stats were updated

**Alternative: Separate Endpoints**

If you prefer separate endpoints, here are the individual specs:

#### `GET /customer/stats/meals?period=month`
**Response**:
```json
{
  "success": true,
  "data": {
    "count": 24,
    "period": "This Month",
    "month": "2024-01"
  }
}
```

#### `GET /customer/stats/calories?period=month`
**Response**:
```json
{
  "success": true,
  "data": {
    "tracked": 2847,
    "period": "This Month",
    "month": "2024-01"
  }
}
```

#### `GET /customer/stats/streak`
**Response**:
```json
{
  "success": true,
  "data": {
    "current": 7,
    "period": "Current",
    "best_streak": 14,
    "streak_start_date": "2024-01-09"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

**Example Query**:
```
GET /customer/stats/monthly-overview?month=2024-01
```

---

## 5. Weekly Summary (Bragging Cards) Endpoint

### `GET /customer/stats/weekly-summary`
**Description**: Get weekly statistics for bragging cards including meals per day, calorie comparisons, and cuisines explored.

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**: 
  - `start_date` (optional, string, ISO 8601): Start date for week (default: 7 days ago)
  - `end_date` (optional, string, ISO 8601): End date for week (default: today)
- **Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "week_start": "2024-01-08",
    "week_end": "2024-01-14",
    "week_meals": [2, 3, 4, 3, 5, 1, 2],
    "avg_meals": 2.9,
    "kcal_today": 1420,
    "kcal_yesterday": 1680,
    "cuisines": [
      "Nigerian",
      "Italian",
      "Asian Fusion",
      "Mexican",
      "Indian",
      "Thai"
    ],
    "daily_calories": [
      {
        "date": "2024-01-14",
        "kcal": 1420
      },
      {
        "date": "2024-01-13",
        "kcal": 1680
      },
      {
        "date": "2024-01-12",
        "kcal": 1920
      },
      {
        "date": "2024-01-11",
        "kcal": 1650
      },
      {
        "date": "2024-01-10",
        "kcal": 1780
      },
      {
        "date": "2024-01-09",
        "kcal": 2100
      },
      {
        "date": "2024-01-08",
        "kcal": 1950
      }
    ],
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response Fields**:
- `week_start` (string, ISO 8601 date): Start date of the week (Monday)
- `week_end` (string, ISO 8601 date): End date of the week (Sunday)
- `week_meals` (number[], required): Array of 7 numbers representing meals per day for the week
  - Index 0 = Monday (most recent), Index 6 = Sunday (oldest)
  - Example: [2, 3, 4, 3, 5, 1, 2] means 2 meals on Monday, 3 on Tuesday, etc.
- `avg_meals` (number, required): Average meals per day for the week (rounded to 1 decimal)
- `kcal_today` (number, required): Calories consumed today (or most recent day)
- `kcal_yesterday` (number, required): Calories consumed yesterday (or second most recent day)
- `cuisines` (string[], required): Array of unique cuisine names explored this week
- `daily_calories` (array, optional): Detailed daily calorie breakdown for the week
  - Each object contains:
    - `date` (string, ISO 8601 date): Date
    - `kcal` (number): Calories consumed that day
- `updated_at` (string, ISO 8601): Last time stats were updated

**Notes**:
- `week_meals` array should always have exactly 7 elements (Monday through Sunday)
- Array order: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
- Monday is the most recent day, Sunday is 6 days ago
- `avg_meals` should be calculated as: sum of week_meals / 7, rounded to 1 decimal place

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

**Example Query**:
```
GET /customer/stats/weekly-summary?start_date=2024-01-08&end_date=2024-01-14
```

---

## Alternative: Separate Weekly Endpoints

If you prefer to split the weekly summary into separate endpoints:

### `GET /customer/stats/meals/weekly`
**Response**:
```json
{
  "success": true,
  "data": {
    "week_start": "2024-01-08",
    "week_end": "2024-01-14",
    "week_meals": [2, 3, 4, 3, 5, 1, 2],
    "avg_meals": 2.9,
    "total_meals": 20
  }
}
```

### `GET /customer/stats/calories/daily?days=2`
**Response**:
```json
{
  "success": true,
  "data": {
    "today": {
      "date": "2024-01-15",
      "kcal": 1420
    },
    "yesterday": {
      "date": "2024-01-14",
      "kcal": 1680
    }
  }
}
```

### `GET /customer/stats/cuisines/weekly`
**Response**:
```json
{
  "success": true,
  "data": {
    "week_start": "2024-01-08",
    "week_end": "2024-01-14",
    "cuisines": [
      "Nigerian",
      "Italian",
      "Asian Fusion",
      "Mexican",
      "Indian",
      "Thai"
    ],
    "count": 6
  }
}
```

---

## Common Response Structure

All endpoints follow this structure:

**Success Response**:
```json
{
  "success": true,
  "data": {
    // Endpoint-specific data
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "data": null
}
```

## Error Codes

- `UNAUTHORIZED` (401): Invalid or missing authentication token
- `NOT_FOUND` (404): Resource not found (e.g., no score for new user)
- `BAD_REQUEST` (400): Invalid request parameters
- `INTERNAL_ERROR` (500): Server error

## Date Formats

All dates should be in ISO 8601 format:
- Date only: `YYYY-MM-DD` (e.g., "2024-01-15")
- Date and time: `YYYY-MM-DDTHH:mm:ssZ` (e.g., "2024-01-15T10:30:00Z")
- Month only: `YYYY-MM` (e.g., "2024-01")

## Notes

1. All endpoints require authentication via Bearer token
2. All numeric values should be integers unless otherwise specified (decimals for averages)
3. Arrays should never be null - use empty arrays `[]` if no data
4. Optional fields can be omitted from the response if not applicable
5. Timezone should be UTC for all timestamps
6. Progress percentages should be integers between 0-100 (can exceed 100 for calories if over goal)

