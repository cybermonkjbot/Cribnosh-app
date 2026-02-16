{
  "schemas": {
    "AnalyticsOverviewResponse": {
      "properties": {
        "total_revenue": {
          "type": "number",
          "title": "Total Revenue",
          "description": "Total revenue for the period"
        },
        "total_orders": {
          "type": "integer",
          "title": "Total Orders",
          "description": "Total number of orders"
        },
        "average_order_value": {
          "type": "number",
          "title": "Average Order Value",
          "description": "Average order value"
        },
        "total_users": {
          "type": "integer",
          "title": "Total Users",
          "description": "Total number of users"
        },
        "revenue_trend": {
          "type": "number",
          "title": "Revenue Trend",
          "description": "Revenue trend percentage"
        },
        "orders_trend": {
          "type": "number",
          "title": "Orders Trend",
          "description": "Orders trend percentage"
        },
        "aov_trend": {
          "type": "number",
          "title": "Aov Trend",
          "description": "AOV trend percentage"
        },
        "users_trend": {
          "type": "number",
          "title": "Users Trend",
          "description": "Users trend percentage"
        }
      },
      "type": "object",
      "required": [
        "total_revenue",
        "total_orders",
        "average_order_value",
        "total_users",
        "revenue_trend",
        "orders_trend",
        "aov_trend",
        "users_trend"
      ],
      "title": "AnalyticsOverviewResponse"
    },
    "AverageRatingResponse": {
      "properties": {
        "average_rating": {
          "type": "number",
          "maximum": 5,
          "minimum": 0,
          "title": "Average Rating",
          "default": 0
        },
        "total_ratings": {
          "type": "integer",
          "title": "Total Ratings",
          "default": 0
        },
        "rating_distribution": {
          "anyOf": [
            {
              "additionalProperties": {
                "type": "integer"
              },
              "type": "object"
            },
            {
              "type": "null"
            }
          ],
          "title": "Rating Distribution"
        }
      },
      "type": "object",
      "title": "AverageRatingResponse"
    },
    "Body_login_user_v1_auth_login_post": {
      "properties": {
        "grant_type": {
          "anyOf": [
            {
              "type": "string",
              "pattern": "^password$"
            },
            {
              "type": "null"
            }
          ],
          "title": "Grant Type"
        },
        "username": {
          "type": "string",
          "title": "Username"
        },
        "password": {
          "type": "string",
          "title": "Password"
        },
        "scope": {
          "type": "string",
          "title": "Scope",
          "default": ""
        },
        "client_id": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Client Id"
        },
        "client_secret": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Client Secret"
        }
      },
      "type": "object",
      "required": [
        "username",
        "password"
      ],
      "title": "Body_login_user_v1_auth_login_post"
    },
    "Body_upload_food_creator_profile_image_v1_images_food_creator_profile_post": {
      "properties": {
        "file": {
          "type": "string",
          "format": "binary",
          "title": "File",
          "description": "Profile image (JPEG, PNG, WebP max 5MB)"
        }
      },
      "type": "object",
      "required": [
        "file"
      ],
      "title": "Body_upload_food_creator_profile_image_v1_images_food_creator_profile_post"
    },
    "Body_upload_dish_images_v1_images_food_creator_dish__dish_id__post": {
      "properties": {
        "files": {
          "items": {
            "type": "string",
            "format": "binary"
          },
          "type": "array",
          "title": "Files",
          "description": "Dish images (JPEG, PNG, WebP max 10MB each, max 10 images)"
        }
      },
      "type": "object",
      "required": [
        "files"
      ],
      "title": "Body_upload_dish_images_v1_images_food_creator_dish__dish_id__post"
    },
    "Body_upload_document_v1_food_creator_documents_upload_post": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name",
          "description": "Name/title of the document"
        }
      },
      "type": "object",
      "required": [
        "name",
        "document_type",
        "file"
      ],
      "title": "Body_upload_document_v1_food_creator_documents_upload_post"
    },
    "ChatCreate": {
      "properties": {
        "customer_id": {
          "type": "string",
          "title": "Customer Id",
          "description": "Customer profile ID"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id",
          "description": "Food Creator profile ID"
        }
      },
      "type": "object",
      "required": [
        "customer_id",
        "chef_id"
      ],
      "title": "ChatCreate"
    },
    "FoodCreatorAnalyticsResponse": {
      "properties": {
        "total_chefs": {
          "type": "integer",
          "title": "Total Food Creators",
          "description": "Total number of food creators"
        },
        "approved_chefs": {
          "type": "integer",
          "title": "Approved Food Creators",
          "description": "Number of approved food creators"
        },
        "pending_chefs": {
          "type": "integer",
          "title": "Pending Food Creators",
          "description": "Number of pending food creators"
        },
        "active_chefs": {
          "type": "integer",
          "title": "Active Food Creators",
          "description": "Number of active food creators"
        },
        "chef_distribution_by_cuisine": {
          "additionalProperties": {
            "type": "integer"
          },
          "type": "object",
          "title": "Food Creator Distribution By Cuisine",
          "description": "Food creator distribution by cuisine"
        },
        "period": {
          "type": "string",
          "title": "Period",
          "description": "Date range for the analytics"
        }
      },
      "type": "object",
      "required": [
        "total_chefs",
        "approved_chefs",
        "pending_chefs",
        "active_chefs",
        "chef_distribution_by_cuisine",
        "period"
      ],
      "title": "ChefAnalyticsResponse"
    },
    "ChefCuisineCreate": {
      "properties": {
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        }
      },
      "type": "object",
      "required": [
        "cuisine_id"
      ],
      "title": "ChefCuisineCreate"
    },
    "ChefCuisineResponse": {
      "properties": {
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        },
        "id": {
          "type": "string",
          "title": "Id"
        },
        "is_approved": {
          "type": "boolean",
          "title": "Is Approved",
          "default": false
        },
        "approval_date": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Approval Date"
        }
      },
      "type": "object",
      "required": [
        "chef_id",
        "cuisine_id",
        "id"
      ],
      "title": "ChefCuisineResponse"
    },
    "ChefCuisineUpdate": {
      "properties": {
        "is_approved": {
          "type": "boolean",
          "title": "Is Approved"
        }
      },
      "type": "object",
      "required": [
        "is_approved"
      ],
      "title": "ChefCuisineUpdate"
    },
    "ChefCuisineWithProfileResponse": {
      "properties": {
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        },
        "id": {
          "type": "string",
          "title": "Id"
        },
        "is_approved": {
          "type": "boolean",
          "title": "Is Approved",
          "default": false
        },
        "approval_date": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Approval Date"
        },
        "chef_profile": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/ChefProfileResponse"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "type": "object",
      "required": [
        "chef_id",
        "cuisine_id",
        "id"
      ],
      "title": "ChefCuisineWithProfileResponse",
      "description": "Chef cuisine response with food creator profile data included"
    },
    "ChefDishesResponse": {
      "properties": {
        "chef_profile": {
          "$ref": "#/components/schemas/ChefProfileResponse"
        },
        "dishes": {
          "items": {
            "$ref": "#/components/schemas/DishResponse"
          },
          "type": "array",
          "title": "Dishes"
        }
      },
      "type": "object",
      "required": [
        "chef_profile",
        "dishes"
      ],
      "title": "ChefDishesResponse"
    },
    "ChefDocumentListResponse": {
      "properties": {
        "documents": {
          "items": {
            "$ref": "#/components/schemas/ChefDocumentResponse"
          },
          "type": "array",
          "title": "Documents"
        },
        "total": {
          "type": "integer",
          "title": "Total"
        }
      },
      "type": "object",
      "required": [
        "documents",
        "total"
      ],
      "title": "ChefDocumentListResponse",
      "description": "Schema for listing food creator documents"
    },
    "ChefDocumentResponse": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name",
          "description": "Name/title of the document"
        },
        "document_type": {
          "$ref": "#/components/schemas/DocumentType",
          "description": "Type of document"
        },
        "document_id": {
          "type": "string",
          "title": "Document Id"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "status": {
          "$ref": "#/components/schemas/DocumentStatus"
        },
        "file_url": {
          "type": "string",
          "title": "File Url"
        },
        "file_size": {
          "type": "integer",
          "title": "File Size"
        },
        "mime_type": {
          "type": "string",
          "title": "Mime Type"
        },
        "original_filename": {
          "type": "string",
          "title": "Original Filename"
        },
        "upload_date": {
          "type": "string",
          "format": "date-time",
          "title": "Upload Date"
        },
        "reviewed_date": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Reviewed Date"
        },
        "reviewed_by": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Reviewed By"
        },
        "rejection_reason": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Rejection Reason"
        },
        "expiry_date": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Expiry Date"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        },
        "document_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Document Url",
          "description": "Convert document file path to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "name",
        "document_type",
        "document_id",
        "chef_id",
        "status",
        "file_url",
        "file_size",
        "mime_type",
        "original_filename",
        "upload_date",
        "created_at",
        "updated_at",
        "document_url"
      ],
      "title": "ChefDocumentResponse",
      "description": "Schema for food creator document response"
    },
    "ChefOrderUpdateSchema": {
      "properties": {
        "status": {
          "$ref": "#/components/schemas/OrderStatus"
        },
        "estimated_prep_time_minutes": {
          "anyOf": [
            {
              "type": "integer"
            },
            {
              "type": "null"
            }
          ],
          "title": "Estimated Prep Time Minutes",
          "description": "Estimated preparation time in minutes for the order."
        },
        "chef_notes": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Food Creator Notes",
          "description": "Notes from the chef, especially when declining an order."
        }
      },
      "type": "object",
      "required": [
        "status"
      ],
      "title": "ChefOrderUpdateSchema"
    },
    "ChefProfileResponse": {
      "properties": {
        "first_name": {
          "type": "string",
          "title": "First Name"
        },
        "last_name": {
          "type": "string",
          "title": "Last Name"
        },
        "profile_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile Image"
        },
        "latitude": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Latitude"
        },
        "longitude": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Longitude"
        },
        "address": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Address"
        },
        "experience": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Experience"
        },
        "profile_id": {
          "type": "string",
          "title": "Profile Id"
        },
        "user_id": {
          "type": "string",
          "title": "User Id"
        },
        "is_approved": {
          "type": "boolean",
          "title": "Is Approved"
        },
        "approval_date": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Approval Date"
        },
        "status": {
          "$ref": "#/components/schemas/ChefStatus"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_reviews": {
          "type": "integer",
          "title": "Total Reviews"
        },
        "total_orders": {
          "type": "integer",
          "title": "Total Orders"
        },
        "is_available": {
          "type": "boolean",
          "title": "Is Available"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        },
        "profile_image_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile Image Url",
          "description": "Convert profile_image object name to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "first_name",
        "last_name",
        "profile_id",
        "user_id",
        "is_approved",
        "status",
        "avg_rating",
        "total_reviews",
        "total_orders",
        "is_available",
        "created_at",
        "updated_at",
        "profile_image_url"
      ],
      "title": "ChefProfileResponse",
      "description": "Response schema for food creator profiles"
    },
    "ChefProfileUpdate": {
      "properties": {
        "first_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "First Name"
        },
        "last_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Last Name"
        },
        "profile_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile Image"
        },
        "latitude": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Latitude"
        },
        "longitude": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Longitude"
        },
        "address": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Address"
        },
        "experience": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Experience"
        },
        "is_available": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "null"
            }
          ],
          "title": "Is Available"
        }
      },
      "type": "object",
      "title": "ChefProfileUpdate"
    },
    "ChefReviewsResponse": {
      "properties": {
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_reviews": {
          "type": "integer",
          "title": "Total Reviews"
        },
        "reviews": {
          "items": {
            "$ref": "#/components/schemas/ReviewResponse"
          },
          "type": "array",
          "title": "Reviews"
        }
      },
      "type": "object",
      "required": [
        "chef_id",
        "avg_rating",
        "total_reviews",
        "reviews"
      ],
      "title": "ChefReviewsResponse"
    },
    "ChefSearchResult": {
      "properties": {
        "first_name": {
          "type": "string",
          "title": "First Name"
        },
        "last_name": {
          "type": "string",
          "title": "Last Name"
        },
        "profile_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile Image"
        },
        "latitude": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Latitude"
        },
        "longitude": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Longitude"
        },
        "address": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Address"
        },
        "experience": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Experience"
        },
        "profile_id": {
          "type": "string",
          "title": "Profile Id"
        },
        "user_id": {
          "type": "string",
          "title": "User Id"
        },
        "is_approved": {
          "type": "boolean",
          "title": "Is Approved"
        },
        "approval_date": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Approval Date"
        },
        "status": {
          "$ref": "#/components/schemas/ChefStatus"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_reviews": {
          "type": "integer",
          "title": "Total Reviews"
        },
        "total_orders": {
          "type": "integer",
          "title": "Total Orders"
        },
        "is_available": {
          "type": "boolean",
          "title": "Is Available"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        },
        "distance": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Distance"
        },
        "relevance_score": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Relevance Score"
        },
        "matched_cuisines": {
          "anyOf": [
            {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            {
              "type": "null"
            }
          ],
          "title": "Matched Cuisines"
        },
        "profile_image_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile Image Url",
          "description": "Convert profile_image object name to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "first_name",
        "last_name",
        "profile_id",
        "user_id",
        "is_approved",
        "status",
        "avg_rating",
        "total_reviews",
        "total_orders",
        "is_available",
        "created_at",
        "updated_at",
        "profile_image_url"
      ],
      "title": "ChefSearchResult"
    },
    "ChefStatus": {
      "type": "string",
      "enum": [
        "active",
        "inactive",
        "applications"
      ],
      "title": "ChefStatus"
    },
    "ChefSummary": {
      "properties": {
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "first_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "First Name"
        },
        "last_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Last Name"
        }
      },
      "type": "object",
      "required": [
        "chef_id"
      ],
      "title": "ChefSummary",
      "description": "Minimal food creator information exposed in admin review endpoints."
    },
    "ContactResponse": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name",
          "examples": [
            "John Doe"
          ]
        },
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email",
          "examples": [
            "john.doe@cribnosh.co.uk"
          ]
        },
        "message": {
          "type": "string",
          "title": "Message",
          "examples": [
            "I'd like to know more about your services."
          ]
        },
        "id": {
          "type": "string",
          "format": "uuid",
          "title": "Id"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        }
      },
      "type": "object",
      "required": [
        "name",
        "email",
        "message",
        "id",
        "created_at"
      ],
      "title": "ContactResponse"
    },
    "CuisineCreate": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "cuisine_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Image"
        }
      },
      "type": "object",
      "required": [
        "name"
      ],
      "title": "CuisineCreate"
    },
    "CuisineImageUploadResponse": {
      "properties": {
        "message": {
          "type": "string",
          "title": "Message"
        },
        "image_url": {
          "type": "string",
          "title": "Image Url"
        },
        "object_name": {
          "type": "string",
          "title": "Object Name"
        },
        "upload_date": {
          "type": "string",
          "format": "date-time",
          "title": "Upload Date"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        }
      },
      "type": "object",
      "required": [
        "message",
        "image_url",
        "object_name",
        "upload_date",
        "cuisine_id"
      ],
      "title": "CuisineImageUploadResponse",
      "description": "Schema for cuisine image upload response"
    },
    "CuisineInDB": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "cuisine_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Image"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        },
        "created_at": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Created At"
        },
        "updated_at": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Updated At"
        }
      },
      "type": "object",
      "required": [
        "name",
        "cuisine_id"
      ],
      "title": "CuisineInDB"
    },
    "CuisineResponse": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "cuisine_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Image"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        },
        "cuisine_image_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Image Url",
          "description": "Convert cuisine_image object name to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "name",
        "cuisine_id",
        "created_at",
        "updated_at",
        "cuisine_image_url"
      ],
      "title": "CuisineResponse"
    },
    "CuisineSearchResult": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "cuisine_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Image"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        },
        "chef_count": {
          "anyOf": [
            {
              "type": "integer"
            },
            {
              "type": "null"
            }
          ],
          "title": "Food Creator Count"
        },
        "dish_count": {
          "anyOf": [
            {
              "type": "integer"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Count"
        },
        "relevance_score": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Relevance Score"
        },
        "cuisine_image_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Image Url",
          "description": "Convert cuisine_image object name to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "name",
        "cuisine_id",
        "created_at",
        "updated_at",
        "cuisine_image_url"
      ],
      "title": "CuisineSearchResult"
    },
    "CuisineUpdate": {
      "properties": {
        "name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "cuisine_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Image"
        }
      },
      "type": "object",
      "title": "CuisineUpdate"
    },
    "CurrentOrdersResponse": {
      "properties": {
        "current_order_count": {
          "type": "integer",
          "title": "Current Order Count"
        },
        "orders": {
          "items": {
            "$ref": "#/components/schemas/OrderSummaryItem"
          },
          "type": "array",
          "title": "Orders"
        }
      },
      "type": "object",
      "required": [
        "current_order_count",
        "orders"
      ],
      "title": "CurrentOrdersResponse"
    },
    "CustomOrderCreate": {
      "properties": {
        "requirements": {
          "type": "string",
          "title": "Requirements"
        },
        "dietary_restrictions": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dietary Restrictions"
        },
        "serving_size": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "title": "Serving Size"
        },
        "desired_delivery_time": {
          "type": "string",
          "format": "date-time",
          "title": "Desired Delivery Time"
        }
      },
      "type": "object",
      "required": [
        "requirements",
        "serving_size",
        "desired_delivery_time"
      ],
      "title": "CustomOrderCreate"
    },
    "CustomOrderInDB": {
      "properties": {
        "requirements": {
          "type": "string",
          "title": "Requirements"
        },
        "dietary_restrictions": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dietary Restrictions"
        },
        "serving_size": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "title": "Serving Size"
        },
        "desired_delivery_time": {
          "type": "string",
          "format": "date-time",
          "title": "Desired Delivery Time"
        },
        "custom_order_id": {
          "type": "string",
          "title": "Custom Order Id"
        },
        "order_id": {
          "type": "string",
          "title": "Order Id"
        }
      },
      "type": "object",
      "required": [
        "requirements",
        "serving_size",
        "desired_delivery_time",
        "custom_order_id",
        "order_id"
      ],
      "title": "CustomOrderInDB"
    },
    "CustomOrderUpdate": {
      "properties": {
        "requirements": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Requirements"
        },
        "dietary_restrictions": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dietary Restrictions"
        },
        "serving_size": {
          "anyOf": [
            {
              "type": "integer",
              "exclusiveMinimum": 0
            },
            {
              "type": "null"
            }
          ],
          "title": "Serving Size"
        },
        "desired_delivery_time": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Desired Delivery Time"
        }
      },
      "type": "object",
      "title": "CustomOrderUpdate"
    },
    "CustomerInfo": {
      "properties": {
        "customer_id": {
          "type": "string",
          "title": "Customer Id"
        },
        "first_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "First Name"
        },
        "last_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Last Name"
        }
      },
      "type": "object",
      "required": [
        "customer_id"
      ],
      "title": "CustomerInfo"
    },
    "CustomerOrderStatusUpdate": {
      "properties": {
        "order_status": {
          "type": "string",
          "title": "Order Status"
        }
      },
      "type": "object",
      "required": [
        "order_status"
      ],
      "title": "CustomerOrderStatusUpdate"
    },
    "CustomerProfileResponse": {
      "properties": {
        "first_name": {
          "type": "string",
          "title": "First Name"
        },
        "last_name": {
          "type": "string",
          "title": "Last Name"
        },
        "bio": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Bio"
        },
        "profile_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile Image"
        },
        "location_coordinates": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Location Coordinates"
        },
        "address": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Address"
        },
        "profile_id": {
          "type": "string",
          "title": "Profile Id"
        },
        "user_id": {
          "type": "string",
          "title": "User Id"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        },
        "profile_image_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile Image Url",
          "description": "Convert profile_image object name to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "first_name",
        "last_name",
        "profile_id",
        "user_id",
        "created_at",
        "updated_at",
        "profile_image_url"
      ],
      "title": "CustomerProfileResponse",
      "description": "Response schema for customer profiles"
    },
    "CustomerProfileUpdate": {
      "properties": {
        "first_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "First Name"
        },
        "last_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Last Name"
        },
        "bio": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Bio"
        },
        "profile_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile Image"
        },
        "location_coordinates": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Location Coordinates"
        },
        "address": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Address"
        }
      },
      "type": "object",
      "title": "CustomerProfileUpdate"
    },
    "CustomerSummary": {
      "properties": {
        "customer_id": {
          "type": "string",
          "title": "Customer Id"
        },
        "first_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "First Name"
        },
        "last_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Last Name"
        },
        "email": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Email"
        }
      },
      "type": "object",
      "required": [
        "customer_id"
      ],
      "title": "CustomerSummary",
      "description": "Minimal customer information exposed in admin review endpoints."
    },
    "DeliveryApplicationResponse": {
      "properties": {
        "full_name": {
          "type": "string",
          "title": "Full Name"
        },
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email"
        },
        "phone": {
          "type": "string",
          "title": "Phone"
        },
        "city": {
          "type": "string",
          "title": "City"
        },
        "vehicle_type": {
          "$ref": "#/components/schemas/VehicleType"
        },
        "has_driving_license": {
          "type": "boolean",
          "title": "Has Driving License"
        },
        "has_insurance": {
          "type": "boolean",
          "title": "Has Insurance"
        },
        "availability": {
          "items": {
            "type": "string"
          },
          "type": "array",
          "title": "Availability"
        },
        "why_join": {
          "type": "string",
          "title": "Why Join"
        },
        "experience": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Experience"
        },
        "preferences": {
          "anyOf": [
            {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            {
              "type": "null"
            }
          ],
          "title": "Preferences"
        },
        "id": {
          "type": "string",
          "format": "uuid",
          "title": "Id"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        }
      },
      "type": "object",
      "required": [
        "full_name",
        "email",
        "phone",
        "city",
        "vehicle_type",
        "has_driving_license",
        "has_insurance",
        "availability",
        "why_join",
        "id",
        "created_at"
      ],
      "title": "DeliveryApplicationResponse"
    },
    "DishAdminUpdate": {
      "properties": {
        "status": {
          "$ref": "#/components/schemas/DishStatus"
        },
        "admin_notes": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Admin Notes"
        }
      },
      "type": "object",
      "required": [
        "status"
      ],
      "title": "DishAdminUpdate"
    },
    "DishCreate": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "price": {
          "type": "number",
          "exclusiveMinimum": 0,
          "title": "Price"
        },
        "dish_type": {
          "$ref": "#/components/schemas/DishType"
        },
        "dish_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image"
        },
        "is_available": {
          "type": "boolean",
          "title": "Is Available",
          "default": true
        },
        "ingredients": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Ingredients"
        },
        "dietary_info": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dietary Info"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_reviews": {
          "type": "integer",
          "title": "Total Reviews"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        }
      },
      "type": "object",
      "required": [
        "name",
        "price",
        "dish_type",
        "avg_rating",
        "total_reviews",
        "cuisine_id"
      ],
      "title": "DishCreate"
    },
    "DishImageInfo": {
      "properties": {
        "image_id": {
          "type": "string",
          "title": "Image Id"
        },
        "image_url": {
          "type": "string",
          "title": "Image Url"
        },
        "image_type": {
          "type": "string",
          "title": "Image Type"
        },
        "display_order": {
          "type": "integer",
          "title": "Display Order"
        },
        "is_primary": {
          "type": "boolean",
          "title": "Is Primary"
        },
        "alt_text": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Alt Text"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        }
      },
      "type": "object",
      "required": [
        "image_id",
        "image_url",
        "image_type",
        "display_order",
        "is_primary",
        "created_at"
      ],
      "title": "DishImageInfo",
      "description": "Schema for dish image information"
    },
    "DishImageUploadResponse": {
      "properties": {
        "message": {
          "type": "string",
          "title": "Message"
        },
        "images": {
          "items": {
            "type": "object"
          },
          "type": "array",
          "title": "Images"
        },
        "upload_date": {
          "type": "string",
          "format": "date-time",
          "title": "Upload Date"
        },
        "dish_id": {
          "type": "string",
          "title": "Dish Id"
        }
      },
      "type": "object",
      "required": [
        "message",
        "images",
        "upload_date",
        "dish_id"
      ],
      "title": "DishImageUploadResponse",
      "description": "Schema for dish image upload response"
    },
    "DishInDB": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "price": {
          "type": "number",
          "exclusiveMinimum": 0,
          "title": "Price"
        },
        "dish_type": {
          "$ref": "#/components/schemas/DishType"
        },
        "dish_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image"
        },
        "is_available": {
          "type": "boolean",
          "title": "Is Available",
          "default": true
        },
        "ingredients": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Ingredients"
        },
        "dietary_info": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dietary Info"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_reviews": {
          "type": "integer",
          "title": "Total Reviews"
        },
        "dish_id": {
          "type": "string",
          "title": "Dish Id"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        },
        "status": {
          "$ref": "#/components/schemas/DishStatus"
        },
        "admin_notes": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Admin Notes"
        }
      },
      "type": "object",
      "required": [
        "name",
        "price",
        "dish_type",
        "avg_rating",
        "total_reviews",
        "dish_id",
        "chef_id",
        "cuisine_id",
        "status"
      ],
      "title": "DishInDB"
    },
    "DishResponse": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "price": {
          "type": "number",
          "exclusiveMinimum": 0,
          "title": "Price"
        },
        "dish_type": {
          "$ref": "#/components/schemas/DishType"
        },
        "dish_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image"
        },
        "is_available": {
          "type": "boolean",
          "title": "Is Available",
          "default": true
        },
        "ingredients": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Ingredients"
        },
        "dietary_info": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dietary Info"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_reviews": {
          "type": "integer",
          "title": "Total Reviews"
        },
        "dish_id": {
          "type": "string",
          "title": "Dish Id"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        },
        "status": {
          "$ref": "#/components/schemas/DishStatus"
        },
        "admin_notes": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Admin Notes"
        },
        "reviews": {
          "items": {
            "$ref": "#/components/schemas/ReviewResponse"
          },
          "type": "array",
          "title": "Reviews",
          "default": []
        },
        "dish_image_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image Url",
          "description": "Convert dish_image object name to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "name",
        "price",
        "dish_type",
        "avg_rating",
        "total_reviews",
        "dish_id",
        "chef_id",
        "cuisine_id",
        "status",
        "dish_image_url"
      ],
      "title": "DishResponse"
    },
    "DishReviewsResponse": {
      "properties": {
        "dish_id": {
          "type": "string",
          "title": "Dish Id"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_reviews": {
          "type": "integer",
          "title": "Total Reviews"
        },
        "reviews": {
          "items": {
            "$ref": "#/components/schemas/ReviewResponse"
          },
          "type": "array",
          "title": "Reviews"
        }
      },
      "type": "object",
      "required": [
        "dish_id",
        "avg_rating",
        "total_reviews",
        "reviews"
      ],
      "title": "DishReviewsResponse"
    },
    "DishSearchResult": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "price": {
          "type": "number",
          "exclusiveMinimum": 0,
          "title": "Price"
        },
        "dish_type": {
          "$ref": "#/components/schemas/DishType"
        },
        "dish_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image"
        },
        "is_available": {
          "type": "boolean",
          "title": "Is Available",
          "default": true
        },
        "ingredients": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Ingredients"
        },
        "dietary_info": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dietary Info"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_reviews": {
          "type": "integer",
          "title": "Total Reviews"
        },
        "dish_id": {
          "type": "string",
          "title": "Dish Id"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        },
        "status": {
          "$ref": "#/components/schemas/DishStatus"
        },
        "admin_notes": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Admin Notes"
        },
        "reviews": {
          "items": {
            "$ref": "#/components/schemas/ReviewResponse"
          },
          "type": "array",
          "title": "Reviews",
          "default": []
        },
        "chef_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Food Creator Name"
        },
        "cuisine_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Name"
        },
        "distance": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Distance"
        },
        "relevance_score": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Relevance Score"
        },
        "dish_image_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image Url",
          "description": "Convert dish_image object name to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "name",
        "price",
        "dish_type",
        "avg_rating",
        "total_reviews",
        "dish_id",
        "chef_id",
        "cuisine_id",
        "status",
        "dish_image_url"
      ],
      "title": "DishSearchResult"
    },
    "DishSimpleResponse": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "price": {
          "type": "number",
          "exclusiveMinimum": 0,
          "title": "Price"
        },
        "dish_type": {
          "$ref": "#/components/schemas/DishType"
        },
        "dish_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image"
        },
        "is_available": {
          "type": "boolean",
          "title": "Is Available",
          "default": true
        },
        "ingredients": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Ingredients"
        },
        "dietary_info": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dietary Info"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_reviews": {
          "type": "integer",
          "title": "Total Reviews"
        },
        "dish_id": {
          "type": "string",
          "title": "Dish Id"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        },
        "status": {
          "$ref": "#/components/schemas/DishStatus"
        },
        "admin_notes": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Admin Notes"
        },
        "dish_image_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image Url",
          "description": "Convert dish_image object name to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "name",
        "price",
        "dish_type",
        "avg_rating",
        "total_reviews",
        "dish_id",
        "chef_id",
        "cuisine_id",
        "status",
        "dish_image_url"
      ],
      "title": "DishSimpleResponse",
      "description": "Simple dish response without reviews for listing endpoints"
    },
    "DishStatus": {
      "type": "string",
      "enum": [
        "pending",
        "approved",
        "rejected"
      ],
      "title": "DishStatus"
    },
    "DishSummary": {
      "properties": {
        "dish_id": {
          "type": "string",
          "title": "Dish Id"
        },
        "name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Name"
        },
        "price": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Price"
        }
      },
      "type": "object",
      "required": [
        "dish_id"
      ],
      "title": "DishSummary",
      "description": "Minimal dish information exposed in admin review endpoints."
    },
    "DishType": {
      "type": "string",
      "enum": [
        "appetizer",
        "main_course",
        "dessert",
        "beverage",
        "side"
      ],
      "title": "DishType"
    },
    "DishUpdate": {
      "properties": {
        "name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "price": {
          "anyOf": [
            {
              "type": "number",
              "exclusiveMinimum": 0
            },
            {
              "type": "null"
            }
          ],
          "title": "Price"
        },
        "dish_type": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/DishType"
            },
            {
              "type": "null"
            }
          ]
        },
        "dish_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image"
        },
        "is_available": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "null"
            }
          ],
          "title": "Is Available"
        },
        "ingredients": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Ingredients"
        },
        "dietary_info": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dietary Info"
        },
        "cuisine_id": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Id"
        }
      },
      "type": "object",
      "title": "DishUpdate"
    },
    "DishWithChefProfileResponse": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "price": {
          "type": "number",
          "exclusiveMinimum": 0,
          "title": "Price"
        },
        "dish_type": {
          "$ref": "#/components/schemas/DishType"
        },
        "dish_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image"
        },
        "is_available": {
          "type": "boolean",
          "title": "Is Available",
          "default": true
        },
        "ingredients": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Ingredients"
        },
        "dietary_info": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dietary Info"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_reviews": {
          "type": "integer",
          "title": "Total Reviews"
        },
        "dish_id": {
          "type": "string",
          "title": "Dish Id"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "cuisine_id": {
          "type": "string",
          "title": "Cuisine Id"
        },
        "status": {
          "$ref": "#/components/schemas/DishStatus"
        },
        "admin_notes": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Admin Notes"
        },
        "chef_profile": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/ChefProfileResponse"
            },
            {
              "type": "null"
            }
          ]
        },
        "dish_image_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Image Url",
          "description": "Convert dish_image object name to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "name",
        "price",
        "dish_type",
        "avg_rating",
        "total_reviews",
        "dish_id",
        "chef_id",
        "cuisine_id",
        "status",
        "dish_image_url"
      ],
      "title": "DishWithChefProfileResponse",
      "description": "Dish response with food creator profile data included for admin endpoints"
    },
    "DocumentReviewRequest": {
      "properties": {
        "status": {
          "$ref": "#/components/schemas/DocumentStatus",
          "description": "New status for the document"
        },
        "rejection_reason": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Rejection Reason",
          "description": "Reason for rejection (required if status is rejected)"
        },
        "expiry_date": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Expiry Date",
          "description": "Expiry date for the document"
        }
      },
      "type": "object",
      "required": [
        "status"
      ],
      "title": "DocumentReviewRequest",
      "description": "Schema for admin document review"
    },
    "DocumentStatus": {
      "type": "string",
      "enum": [
        "pending",
        "approved",
        "rejected",
        "expired"
      ],
      "title": "DocumentStatus",
      "description": "Status of document review"
    },
    "DocumentType": {
      "type": "string",
      "enum": [
        "business_license",
        "food_safety_certificate",
        "professional_certificate",
        "identity_document",
        "insurance_certificate",
        "other"
      ],
      "title": "DocumentType",
      "description": "Document types that chefs can upload for verification"
    },
    "DocumentUploadResponse": {
      "properties": {
        "message": {
          "type": "string",
          "title": "Message"
        },
        "document_id": {
          "type": "string",
          "title": "Document Id"
        },
        "file_url": {
          "type": "string",
          "title": "File Url"
        },
        "upload_date": {
          "type": "string",
          "format": "date-time",
          "title": "Upload Date"
        }
      },
      "type": "object",
      "required": [
        "message",
        "document_id",
        "file_url",
        "upload_date"
      ],
      "title": "DocumentUploadResponse",
      "description": "Schema for document upload response"
    },
    "HTTPValidationError": {
      "properties": {
        "detail": {
          "items": {
            "$ref": "#/components/schemas/ValidationError"
          },
          "type": "array",
          "title": "Detail"
        }
      },
      "type": "object",
      "title": "HTTPValidationError"
    },
    "ImageDeleteResponse": {
      "properties": {
        "message": {
          "type": "string",
          "title": "Message"
        },
        "success": {
          "type": "boolean",
          "title": "Success"
        },
        "object_name": {
          "type": "string",
          "title": "Object Name"
        }
      },
      "type": "object",
      "required": [
        "message",
        "success",
        "object_name"
      ],
      "title": "ImageDeleteResponse",
      "description": "Schema for image deletion response"
    },
    "LocationData": {
      "properties": {
        "latitude": {
          "type": "number",
          "maximum": 90,
          "minimum": -90,
          "title": "Latitude"
        },
        "longitude": {
          "type": "number",
          "maximum": 180,
          "minimum": -180,
          "title": "Longitude"
        }
      },
      "type": "object",
      "required": [
        "latitude",
        "longitude"
      ],
      "title": "LocationData"
    },
    "LocationUpdate": {
      "properties": {
        "coordinates": {
          "type": "string",
          "title": "Coordinates",
          "description": "Latitude,longitude string (e.g., '37.7749,-122.4194')"
        }
      },
      "type": "object",
      "required": [
        "coordinates"
      ],
      "title": "LocationUpdate"
    },
    "LogoutResponse": {
      "properties": {
        "message": {
          "type": "string",
          "title": "Message"
        },
        "success": {
          "type": "boolean",
          "title": "Success"
        }
      },
      "type": "object",
      "required": [
        "message",
        "success"
      ],
      "title": "LogoutResponse",
      "description": "Response model for logout endpoint"
    },
    "MenuItemResponse": {
      "properties": {
        "dish_id": {
          "type": "string",
          "title": "Dish Id"
        },
        "price": {
          "type": "number",
          "title": "Price"
        },
        "is_available": {
          "type": "boolean",
          "title": "Is Available",
          "default": true
        },
        "menu_item_id": {
          "type": "string",
          "title": "Menu Item Id"
        },
        "menu_id": {
          "type": "string",
          "title": "Menu Id"
        },
        "dish": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/DishInDB"
            },
            {
              "type": "null"
            }
          ]
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        }
      },
      "type": "object",
      "required": [
        "dish_id",
        "price",
        "menu_item_id",
        "menu_id",
        "dish",
        "created_at",
        "updated_at"
      ],
      "title": "MenuItemResponse"
    },
    "MenuResponse": {
      "properties": {
        "name": {
          "type": "string",
          "title": "Name"
        },
        "description": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Description"
        },
        "is_active": {
          "type": "boolean",
          "title": "Is Active",
          "default": true
        },
        "menu_id": {
          "type": "string",
          "title": "Menu Id"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        },
        "items": {
          "items": {
            "$ref": "#/components/schemas/MenuItemResponse"
          },
          "type": "array",
          "title": "Items",
          "default": []
        }
      },
      "type": "object",
      "required": [
        "name",
        "menu_id",
        "chef_id",
        "created_at",
        "updated_at"
      ],
      "title": "MenuResponse"
    },
    "Message": {
      "properties": {
        "content": {
          "type": "string",
          "maxLength": 2000,
          "minLength": 1,
          "title": "Content"
        },
        "message_id": {
          "type": "string",
          "title": "Message Id"
        },
        "chat_id": {
          "type": "string",
          "title": "Chat Id"
        },
        "sender_user_id": {
          "type": "string",
          "title": "Sender User Id"
        },
        "sent_at": {
          "type": "string",
          "format": "date-time",
          "title": "Sent At"
        },
        "is_read": {
          "type": "boolean",
          "title": "Is Read"
        }
      },
      "type": "object",
      "required": [
        "content",
        "message_id",
        "chat_id",
        "sender_user_id",
        "sent_at",
        "is_read"
      ],
      "title": "Message"
    },
    "MessageResponse": {
      "properties": {
        "message_id": {
          "type": "string",
          "title": "Message Id"
        },
        "chat_id": {
          "type": "string",
          "title": "Chat Id"
        },
        "sender_id": {
          "type": "string",
          "title": "Sender Id"
        },
        "content": {
          "type": "string",
          "title": "Content"
        },
        "sent_at": {
          "type": "string",
          "format": "date-time",
          "title": "Sent At"
        },
        "is_read": {
          "type": "boolean",
          "title": "Is Read"
        }
      },
      "type": "object",
      "required": [
        "message_id",
        "chat_id",
        "sender_id",
        "content",
        "sent_at",
        "is_read"
      ],
      "title": "MessageResponse"
    },
    "MessageResponseSchema": {
      "properties": {
        "message_id": {
          "type": "string",
          "title": "Message Id"
        },
        "sender_user_id": {
          "type": "string",
          "title": "Sender User Id"
        },
        "content": {
          "type": "string",
          "title": "Content"
        },
        "sent_at": {
          "type": "string",
          "format": "date-time",
          "title": "Sent At"
        },
        "is_read": {
          "type": "boolean",
          "title": "Is Read"
        }
      },
      "type": "object",
      "required": [
        "message_id",
        "sender_user_id",
        "content",
        "sent_at",
        "is_read"
      ],
      "title": "MessageResponseSchema"
    },
    "NotificationResponse": {
      "properties": {
        "type": {
          "$ref": "#/components/schemas/NotificationType"
        },
        "message": {
          "type": "string",
          "title": "Message"
        },
        "related_entity_id": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Related Entity Id"
        },
        "related_entity_type": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Related Entity Type"
        },
        "id": {
          "type": "string",
          "format": "uuid",
          "title": "Id"
        },
        "user_id": {
          "type": "string",
          "format": "uuid",
          "title": "User Id"
        },
        "is_read": {
          "type": "boolean",
          "title": "Is Read"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        }
      },
      "type": "object",
      "required": [
        "type",
        "message",
        "id",
        "user_id",
        "is_read",
        "created_at",
        "updated_at"
      ],
      "title": "NotificationResponse"
    },
    "NotificationType": {
      "type": "string",
      "enum": [
        "new_order",
        "order_status_update",
        "new_chat_message",
        "chef_approved",
        "chef_rejected",
        "new_review",
        "special_order_request"
      ],
      "title": "NotificationType"
    },
    "OrderChatMessage": {
      "properties": {
        "message_id": {
          "type": "string",
          "title": "Message Id"
        },
        "order_id": {
          "type": "string",
          "title": "Order Id"
        },
        "sender_id": {
          "type": "string",
          "title": "Sender Id"
        },
        "sender_type": {
          "type": "string",
          "title": "Sender Type"
        },
        "message_content": {
          "type": "string",
          "title": "Message Content"
        },
        "timestamp": {
          "type": "string",
          "title": "Timestamp"
        },
        "is_read": {
          "type": "boolean",
          "title": "Is Read"
        }
      },
      "type": "object",
      "required": [
        "message_id",
        "order_id",
        "sender_id",
        "sender_type",
        "message_content",
        "timestamp",
        "is_read"
      ],
      "title": "OrderChatMessage"
    },
    "OrderCreate": {
      "properties": {
        "special_instructions": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Special Instructions"
        },
        "delivery_time": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Delivery Time"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "order_items": {
          "items": {
            "$ref": "#/components/schemas/OrderItemCreate"
          },
          "type": "array",
          "title": "Order Items"
        },
        "payment_method": {
          "type": "string",
          "title": "Payment Method"
        }
      },
      "type": "object",
      "required": [
        "chef_id",
        "order_items",
        "payment_method"
      ],
      "title": "OrderCreate"
    },
    "OrderInDB": {
      "properties": {
        "special_instructions": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Special Instructions"
        },
        "delivery_time": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Delivery Time"
        },
        "order_id": {
          "type": "string",
          "title": "Order Id"
        },
        "customer_id": {
          "type": "string",
          "title": "Customer Id"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "order_date": {
          "type": "string",
          "format": "date-time",
          "title": "Order Date"
        },
        "total_amount": {
          "type": "number",
          "title": "Total Amount"
        },
        "order_status": {
          "$ref": "#/components/schemas/OrderStatus"
        },
        "payment_status": {
          "type": "string",
          "title": "Payment Status"
        },
        "payment_method": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Payment Method"
        },
        "payment_id": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Payment Id"
        }
      },
      "type": "object",
      "required": [
        "order_id",
        "customer_id",
        "chef_id",
        "order_date",
        "total_amount",
        "order_status",
        "payment_status"
      ],
      "title": "OrderInDB"
    },
    "OrderItemCreate": {
      "properties": {
        "menu_item_id": {
          "type": "string",
          "title": "Menu Item Id"
        },
        "quantity": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "title": "Quantity"
        },
        "special_requests": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Special Requests"
        }
      },
      "type": "object",
      "required": [
        "menu_item_id",
        "quantity"
      ],
      "title": "OrderItemCreate"
    },
    "OrderItemInDB": {
      "properties": {
        "menu_item_id": {
          "type": "string",
          "title": "Menu Item Id"
        },
        "quantity": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "title": "Quantity"
        },
        "special_requests": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Special Requests"
        },
        "item_id": {
          "type": "string",
          "title": "Item Id"
        },
        "order_id": {
          "type": "string",
          "title": "Order Id"
        },
        "price": {
          "type": "number",
          "title": "Price"
        }
      },
      "type": "object",
      "required": [
        "menu_item_id",
        "quantity",
        "item_id",
        "order_id",
        "price"
      ],
      "title": "OrderItemInDB"
    },
    "OrderItemResponseSchema": {
      "properties": {
        "item_id": {
          "type": "string",
          "title": "Item Id"
        },
        "order_id": {
          "type": "string",
          "title": "Order Id"
        },
        "menu_item_id": {
          "type": "string",
          "title": "Menu Item Id"
        },
        "quantity": {
          "type": "integer",
          "title": "Quantity"
        },
        "price": {
          "type": "number",
          "title": "Price"
        },
        "special_requests": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Special Requests"
        }
      },
      "type": "object",
      "required": [
        "item_id",
        "order_id",
        "menu_item_id",
        "quantity",
        "price"
      ],
      "title": "OrderItemResponseSchema"
    },
    "OrderResponseSchema": {
      "properties": {
        "order_id": {
          "type": "string",
          "title": "Order Id"
        },
        "customer_id": {
          "type": "string",
          "title": "Customer Id"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "order_date": {
          "type": "string",
          "format": "date-time",
          "title": "Order Date"
        },
        "total_amount": {
          "type": "number",
          "title": "Total Amount"
        },
        "order_status": {
          "$ref": "#/components/schemas/OrderStatus"
        },
        "special_instructions": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Special Instructions"
        },
        "estimated_prep_time_minutes": {
          "anyOf": [
            {
              "type": "integer"
            },
            {
              "type": "null"
            }
          ],
          "title": "Estimated Prep Time Minutes"
        },
        "chef_notes": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Food Creator Notes"
        },
        "payment_status": {
          "type": "string",
          "title": "Payment Status"
        },
        "order_items": {
          "items": {
            "$ref": "#/components/schemas/OrderItemResponseSchema"
          },
          "type": "array",
          "title": "Order Items"
        }
      },
      "type": "object",
      "required": [
        "order_id",
        "customer_id",
        "chef_id",
        "order_date",
        "total_amount",
        "order_status",
        "special_instructions",
        "estimated_prep_time_minutes",
        "chef_notes",
        "payment_status",
        "order_items"
      ],
      "title": "OrderResponseSchema"
    },
    "OrderStatus": {
      "type": "string",
      "enum": [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "DELIVERED",
        "CANCELLED",
        "DECLINED"
      ],
      "title": "OrderStatus"
    },
    "OrderSummary": {
      "properties": {
        "order_id": {
          "type": "string",
          "title": "Order Id"
        },
        "order_date": {
          "type": "string",
          "format": "date-time",
          "title": "Order Date"
        },
        "total_amount": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Total Amount"
        },
        "order_status": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/OrderStatus"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "type": "object",
      "required": [
        "order_id",
        "order_date"
      ],
      "title": "OrderSummary",
      "description": "Minimal order information exposed in admin review endpoints."
    },
    "OrderSummaryItem": {
      "properties": {
        "order_id": {
          "type": "string",
          "title": "Order Id"
        },
        "customer_name": {
          "type": "string",
          "title": "Customer Name"
        },
        "order_date": {
          "type": "string",
          "format": "date-time",
          "title": "Order Date"
        },
        "total_amount": {
          "type": "number",
          "title": "Total Amount"
        },
        "order_status": {
          "$ref": "#/components/schemas/OrderStatus"
        }
      },
      "type": "object",
      "required": [
        "order_id",
        "customer_name",
        "order_date",
        "total_amount",
        "order_status"
      ],
      "title": "OrderSummaryItem"
    },
    "OrderWithItems": {
      "properties": {
        "special_instructions": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Special Instructions"
        },
        "delivery_time": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Delivery Time"
        },
        "order_id": {
          "type": "string",
          "title": "Order Id"
        },
        "customer_id": {
          "type": "string",
          "title": "Customer Id"
        },
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id"
        },
        "order_date": {
          "type": "string",
          "format": "date-time",
          "title": "Order Date"
        },
        "total_amount": {
          "type": "number",
          "title": "Total Amount"
        },
        "order_status": {
          "$ref": "#/components/schemas/OrderStatus"
        },
        "payment_status": {
          "type": "string",
          "title": "Payment Status"
        },
        "payment_method": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Payment Method"
        },
        "payment_id": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Payment Id"
        },
        "order_items": {
          "items": {
            "$ref": "#/components/schemas/OrderItemInDB"
          },
          "type": "array",
          "title": "Order Items"
        }
      },
      "type": "object",
      "required": [
        "order_id",
        "customer_id",
        "chef_id",
        "order_date",
        "total_amount",
        "order_status",
        "payment_status",
        "order_items"
      ],
      "title": "OrderWithItems"
    },
    "PaymentIntentResponse": {
      "properties": {
        "client_secret": {
          "type": "string",
          "title": "Client Secret"
        }
      },
      "type": "object",
      "required": [
        "client_secret"
      ],
      "title": "PaymentIntentResponse"
    },
    "PopularChefResponse": {
      "properties": {
        "profile_id": {
          "type": "string",
          "title": "Profile Id"
        },
        "user_id": {
          "type": "string",
          "title": "User Id"
        },
        "first_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "First Name"
        },
        "last_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Last Name"
        },
        "profile_image": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile Image"
        },
        "avg_rating": {
          "type": "number",
          "title": "Avg Rating"
        },
        "total_orders": {
          "type": "integer",
          "title": "Total Orders"
        },
        "popularity_score": {
          "type": "number",
          "title": "Popularity Score"
        },
        "distance": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Distance"
        },
        "profile_image_url": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile Image Url",
          "description": "Convert profile_image object name to full presigned URL",
          "readOnly": true
        }
      },
      "type": "object",
      "required": [
        "profile_id",
        "user_id",
        "avg_rating",
        "total_orders",
        "popularity_score",
        "profile_image_url"
      ],
      "title": "PopularChefResponse"
    },
    "ProfileImageUploadResponse": {
      "properties": {
        "message": {
          "type": "string",
          "title": "Message"
        },
        "image_url": {
          "type": "string",
          "title": "Image Url"
        },
        "object_name": {
          "type": "string",
          "title": "Object Name"
        },
        "upload_date": {
          "type": "string",
          "format": "date-time",
          "title": "Upload Date"
        },
        "user_type": {
          "type": "string",
          "title": "User Type"
        }
      },
      "type": "object",
      "required": [
        "message",
        "image_url",
        "object_name",
        "upload_date",
        "user_type"
      ],
      "title": "ProfileImageUploadResponse",
      "description": "Schema for profile image upload response"
    },
    "RefreshTokenRequest": {
      "properties": {
        "refresh_token": {
          "type": "string",
          "title": "Refresh Token"
        }
      },
      "type": "object",
      "required": [
        "refresh_token"
      ],
      "title": "RefreshTokenRequest"
    },
    "RefreshedTokenResponse": {
      "properties": {
        "access_token": {
          "type": "string",
          "title": "Access Token"
        },
        "refresh_token": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Refresh Token"
        },
        "token_type": {
          "type": "string",
          "title": "Token Type"
        }
      },
      "type": "object",
      "required": [
        "access_token",
        "token_type"
      ],
      "title": "RefreshedTokenResponse"
    },
    "RevenueChartData": {
      "properties": {
        "date": {
          "type": "string",
          "title": "Date",
          "description": "Date in YYYY-MM-DD format"
        },
        "revenue": {
          "type": "number",
          "title": "Revenue",
          "description": "Revenue for the date"
        }
      },
      "type": "object",
      "required": [
        "date",
        "revenue"
      ],
      "title": "RevenueChartData"
    },
    "RevenueDataPoint": {
      "properties": {
        "period_label": {
          "type": "string",
          "title": "Period Label"
        },
        "total_revenue": {
          "type": "number",
          "title": "Total Revenue",
          "default": 0
        },
        "number_of_orders": {
          "type": "integer",
          "title": "Number Of Orders",
          "default": 0
        }
      },
      "type": "object",
      "required": [
        "period_label"
      ],
      "title": "RevenueDataPoint"
    },
    "RevenuePeriod": {
      "type": "string",
      "enum": [
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "custom"
      ],
      "title": "RevenuePeriod"
    },
    "RevenueSummaryRequest": {
      "properties": {
        "period": {
          "$ref": "#/components/schemas/RevenuePeriod",
          "description": "The period for which to generate the revenue summary.",
          "default": "monthly"
        },
        "start_date": {
          "anyOf": [
            {
              "type": "string",
              "format": "date"
            },
            {
              "type": "null"
            }
          ],
          "title": "Start Date",
          "description": "Start date for custom period. Required if period is CUSTOM."
        },
        "end_date": {
          "anyOf": [
            {
              "type": "string",
              "format": "date"
            },
            {
              "type": "null"
            }
          ],
          "title": "End Date",
          "description": "End date for custom period. Required if period is CUSTOM."
        }
      },
      "type": "object",
      "title": "RevenueSummaryRequest"
    },
    "RevenueSummaryResponse": {
      "properties": {
        "requested_period": {
          "$ref": "#/components/schemas/RevenuePeriod",
          "description": "The period that was requested."
        },
        "actual_start_date": {
          "type": "string",
          "format": "date",
          "title": "Actual Start Date",
          "description": "The actual start date used for the summary."
        },
        "actual_end_date": {
          "type": "string",
          "format": "date",
          "title": "Actual End Date",
          "description": "The actual end date used for the summary."
        },
        "summary": {
          "items": {
            "$ref": "#/components/schemas/RevenueDataPoint"
          },
          "type": "array",
          "title": "Summary",
          "description": "Revenue data points for the period."
        },
        "grand_total_revenue": {
          "type": "number",
          "title": "Grand Total Revenue",
          "description": "Total revenue across all data points."
        },
        "grand_total_orders": {
          "type": "integer",
          "title": "Grand Total Orders",
          "description": "Total orders across all data points."
        }
      },
      "type": "object",
      "required": [
        "requested_period",
        "actual_start_date",
        "actual_end_date",
        "summary",
        "grand_total_revenue",
        "grand_total_orders"
      ],
      "title": "RevenueSummaryResponse"
    },
    "ReviewCreate": {
      "properties": {
        "rating": {
          "type": "integer",
          "maximum": 5,
          "minimum": 1,
          "title": "Rating"
        },
        "comment": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Comment"
        },
        "order_id": {
          "type": "string",
          "title": "Order Id",
          "description": "Order ID"
        },
        "chef_id": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Food Creator Id",
          "description": "Chef profile ID being reviewed"
        },
        "dish_id": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Id",
          "description": "Dish ID being reviewed"
        }
      },
      "type": "object",
      "required": [
        "rating",
        "order_id"
      ],
      "title": "ReviewCreate"
    },
    "ReviewDetailResponse": {
      "properties": {
        "review_id": {
          "type": "string",
          "title": "Review Id"
        },
        "rating": {
          "type": "integer",
          "maximum": 5,
          "minimum": 1,
          "title": "Rating"
        },
        "comment": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Comment"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "is_approved": {
          "type": "boolean",
          "title": "Is Approved"
        },
        "approval_date": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ],
          "title": "Approval Date"
        },
        "customer": {
          "$ref": "#/components/schemas/CustomerSummary"
        },
        "chef": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/ChefSummary"
            },
            {
              "type": "null"
            }
          ]
        },
        "dish": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/DishSummary"
            },
            {
              "type": "null"
            }
          ]
        },
        "order": {
          "$ref": "#/components/schemas/OrderSummary"
        }
      },
      "type": "object",
      "required": [
        "review_id",
        "rating",
        "created_at",
        "is_approved",
        "customer",
        "order"
      ],
      "title": "ReviewDetailResponse",
      "description": "Detailed review information for admin endpoints, including related entities."
    },
    "ReviewListResponse": {
      "properties": {
        "total": {
          "type": "integer",
          "title": "Total"
        },
        "reviews": {
          "items": {
            "$ref": "#/components/schemas/ReviewDetailResponse"
          },
          "type": "array",
          "title": "Reviews"
        }
      },
      "type": "object",
      "required": [
        "total",
        "reviews"
      ],
      "title": "ReviewListResponse",
      "description": "Paginated list response for reviews in admin endpoints."
    },
    "ReviewResponse": {
      "properties": {
        "rating": {
          "type": "integer",
          "maximum": 5,
          "minimum": 1,
          "title": "Rating"
        },
        "comment": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Comment"
        },
        "review_id": {
          "type": "string",
          "title": "Review Id"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "customer": {
          "$ref": "#/components/schemas/CustomerInfo"
        }
      },
      "type": "object",
      "required": [
        "rating",
        "review_id",
        "created_at",
        "customer"
      ],
      "title": "ReviewResponse"
    },
    "ReviewUpdate": {
      "properties": {
        "is_approved": {
          "type": "boolean",
          "title": "Is Approved",
          "description": "Whether the review is approved"
        }
      },
      "type": "object",
      "required": [
        "is_approved"
      ],
      "title": "ReviewUpdate"
    },
    "SalesAnalyticsResponse": {
      "properties": {
        "sales_by_status": {
          "additionalProperties": {
            "type": "object"
          },
          "type": "object",
          "title": "Sales By Status",
          "description": "Sales breakdown by order status"
        },
        "sales_by_cuisine": {
          "items": {
            "type": "object"
          },
          "type": "array",
          "title": "Sales By Cuisine",
          "description": "Sales breakdown by cuisine"
        },
        "period": {
          "type": "string",
          "title": "Period",
          "description": "Date range for the analytics"
        }
      },
      "type": "object",
      "required": [
        "sales_by_status",
        "sales_by_cuisine",
        "period"
      ],
      "title": "SalesAnalyticsResponse"
    },
    "SearchFilters": {
      "properties": {
        "cuisine_ids": {
          "anyOf": [
            {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Ids"
        },
        "dish_types": {
          "anyOf": [
            {
              "items": {
                "$ref": "#/components/schemas/DishType"
              },
              "type": "array"
            },
            {
              "type": "null"
            }
          ],
          "title": "Dish Types"
        },
        "min_price": {
          "anyOf": [
            {
              "type": "number",
              "minimum": 0
            },
            {
              "type": "null"
            }
          ],
          "title": "Min Price"
        },
        "max_price": {
          "anyOf": [
            {
              "type": "number",
              "minimum": 0
            },
            {
              "type": "null"
            }
          ],
          "title": "Max Price"
        },
        "min_rating": {
          "anyOf": [
            {
              "type": "number",
              "maximum": 5,
              "minimum": 0
            },
            {
              "type": "null"
            }
          ],
          "title": "Min Rating"
        },
        "max_distance": {
          "anyOf": [
            {
              "type": "integer",
              "exclusiveMinimum": 0
            },
            {
              "type": "null"
            }
          ],
          "title": "Max Distance"
        },
        "is_available": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "null"
            }
          ],
          "title": "Is Available",
          "default": true
        }
      },
      "type": "object",
      "title": "SearchFilters"
    },
    "SearchResponse": {
      "properties": {
        "results": {
          "items": {
            "$ref": "#/components/schemas/ChefSearchResult"
          },
          "type": "array",
          "title": "Results"
        }
      },
      "type": "object",
      "required": [
        "results"
      ],
      "title": "SearchResponse"
    },
    "SearchSuggestion": {
      "properties": {
        "text": {
          "type": "string",
          "title": "Text"
        },
        "type": {
          "$ref": "#/components/schemas/SearchType"
        },
        "category": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Category"
        },
        "count": {
          "anyOf": [
            {
              "type": "integer"
            },
            {
              "type": "null"
            }
          ],
          "title": "Count"
        }
      },
      "type": "object",
      "required": [
        "text",
        "type"
      ],
      "title": "SearchSuggestion"
    },
    "SearchType": {
      "type": "string",
      "enum": [
        "all",
        "chef",
        "cuisine",
        "dish"
      ],
      "title": "SearchType"
    },
    "SendOrderMessageRequest": {
      "properties": {
        "order_id": {
          "type": "string",
          "title": "Order Id"
        },
        "message_content": {
          "type": "string",
          "title": "Message Content"
        }
      },
      "type": "object",
      "required": [
        "order_id",
        "message_content"
      ],
      "title": "SendOrderMessageRequest"
    },
    "SortBy": {
      "type": "string",
      "enum": [
        "relevance",
        "distance",
        "rating",
        "price_asc",
        "price_desc",
        "popularity",
        "newest"
      ],
      "title": "SortBy"
    },
    "Token": {
      "properties": {
        "access_token": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Access Token"
        },
        "refresh_token": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Refresh Token"
        },
        "token_type": {
          "type": "string",
          "title": "Token Type"
        }
      },
      "type": "object",
      "required": [
        "token_type"
      ],
      "title": "Token"
    },
    "TopChefResponse": {
      "properties": {
        "chef_id": {
          "type": "string",
          "title": "Food Creator Id",
          "description": "Chef profile ID"
        },
        "name": {
          "type": "string",
          "title": "Name",
          "description": "Chef name"
        },
        "orders": {
          "type": "integer",
          "title": "Orders",
          "description": "Number of orders"
        },
        "revenue": {
          "type": "string",
          "title": "Revenue",
          "description": "Revenue formatted as currency"
        },
        "rating": {
          "type": "number",
          "title": "Rating",
          "description": "Average rating"
        }
      },
      "type": "object",
      "required": [
        "chef_id",
        "name",
        "orders",
        "revenue",
        "rating"
      ],
      "title": "TopChefResponse"
    },
    "TopMenuResponse": {
      "properties": {
        "menu_id": {
          "type": "string",
          "title": "Menu Id",
          "description": "Dish/Menu ID"
        },
        "name": {
          "type": "string",
          "title": "Name",
          "description": "Dish/Menu name"
        },
        "orders": {
          "type": "integer",
          "title": "Orders",
          "description": "Number of orders"
        },
        "revenue": {
          "type": "string",
          "title": "Revenue",
          "description": "Revenue formatted as currency"
        },
        "chef": {
          "type": "string",
          "title": "Chef",
          "description": "Chef name"
        }
      },
      "type": "object",
      "required": [
        "menu_id",
        "name",
        "orders",
        "revenue",
        "chef"
      ],
      "title": "TopMenuResponse"
    },
    "UnifiedSearchQuery": {
      "properties": {
        "query": {
          "type": "string",
          "maxLength": 200,
          "minLength": 1,
          "title": "Query"
        },
        "search_type": {
          "$ref": "#/components/schemas/SearchType",
          "default": "all"
        },
        "filters": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/SearchFilters"
            },
            {
              "type": "null"
            }
          ]
        },
        "location": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/LocationData"
            },
            {
              "type": "null"
            }
          ]
        },
        "sort_by": {
          "$ref": "#/components/schemas/SortBy",
          "default": "relevance"
        },
        "limit": {
          "type": "integer",
          "maximum": 100,
          "exclusiveMinimum": 0,
          "title": "Limit",
          "default": 20
        },
        "offset": {
          "type": "integer",
          "minimum": 0,
          "title": "Offset",
          "default": 0
        }
      },
      "type": "object",
      "required": [
        "query"
      ],
      "title": "UnifiedSearchQuery"
    },
    "UnifiedSearchResponse": {
      "properties": {
        "chefs": {
          "items": {
            "$ref": "#/components/schemas/ChefSearchResult"
          },
          "type": "array",
          "title": "Chefs",
          "default": []
        },
        "dishes": {
          "items": {
            "$ref": "#/components/schemas/DishSearchResult"
          },
          "type": "array",
          "title": "Dishes",
          "default": []
        },
        "cuisines": {
          "items": {
            "$ref": "#/components/schemas/CuisineSearchResult"
          },
          "type": "array",
          "title": "Cuisines",
          "default": []
        },
        "total_results": {
          "type": "integer",
          "title": "Total Results",
          "default": 0
        },
        "total_chefs": {
          "type": "integer",
          "title": "Total Chefs",
          "default": 0
        },
        "total_dishes": {
          "type": "integer",
          "title": "Total Dishes",
          "default": 0
        },
        "total_cuisines": {
          "type": "integer",
          "title": "Total Cuisines",
          "default": 0
        },
        "query": {
          "type": "string",
          "title": "Query"
        },
        "search_type": {
          "$ref": "#/components/schemas/SearchType"
        },
        "has_more": {
          "type": "boolean",
          "title": "Has More",
          "default": false
        },
        "execution_time_ms": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "null"
            }
          ],
          "title": "Execution Time Ms"
        }
      },
      "type": "object",
      "required": [
        "query",
        "search_type"
      ],
      "title": "UnifiedSearchResponse"
    },
    "UserAdminCreate": {
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email"
        },
        "phone_number": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Phone Number"
        },
        "password": {
          "type": "string",
          "minLength": 8,
          "title": "Password"
        },
        "role": {
          "type": "string",
          "const": "admin",
          "title": "Role",
          "default": "admin"
        }
      },
      "type": "object",
      "required": [
        "email",
        "password"
      ],
      "title": "UserAdminCreate"
    },
    "UserAnalyticsResponse": {
      "properties": {
        "total_users": {
          "type": "integer",
          "title": "Total Users",
          "description": "Total number of users"
        },
        "customers": {
          "type": "integer",
          "title": "Customers",
          "description": "Number of customer users"
        },
        "chefs": {
          "type": "integer",
          "title": "Chefs",
          "description": "Number of food creator users"
        },
        "admins": {
          "type": "integer",
          "title": "Admins",
          "description": "Number of admin users"
        },
        "active_users": {
          "type": "integer",
          "title": "Active Users",
          "description": "Number of active users"
        },
        "user_growth": {
          "items": {
            "$ref": "#/components/schemas/UserGrowthData"
          },
          "type": "array",
          "title": "User Growth",
          "description": "User growth over time"
        },
        "period": {
          "type": "string",
          "title": "Period",
          "description": "Date range for the analytics"
        }
      },
      "type": "object",
      "required": [
        "total_users",
        "customers",
        "chefs",
        "admins",
        "active_users",
        "user_growth",
        "period"
      ],
      "title": "UserAnalyticsResponse"
    },
    "UserChefCreate": {
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email"
        },
        "phone_number": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Phone Number"
        },
        "password": {
          "type": "string",
          "minLength": 8,
          "title": "Password"
        },
        "role": {
          "type": "string",
          "const": "chef",
          "title": "Role",
          "default": "chef"
        }
      },
      "type": "object",
      "required": [
        "email",
        "password"
      ],
      "title": "UserChefCreate"
    },
    "UserCreate": {
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email"
        },
        "phone_number": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Phone Number"
        },
        "password": {
          "type": "string",
          "minLength": 8,
          "title": "Password"
        },
        "role": {
          "$ref": "#/components/schemas/UserRole",
          "default": "user"
        }
      },
      "type": "object",
      "required": [
        "email",
        "password"
      ],
      "title": "UserCreate"
    },
    "UserCustomerCreate": {
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email"
        },
        "phone_number": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Phone Number"
        },
        "password": {
          "type": "string",
          "minLength": 8,
          "title": "Password"
        },
        "role": {
          "type": "string",
          "const": "customer",
          "title": "Role",
          "default": "customer"
        }
      },
      "type": "object",
      "required": [
        "email",
        "password"
      ],
      "title": "UserCustomerCreate"
    },
    "UserGrowthData": {
      "properties": {
        "date": {
          "type": "string",
          "title": "Date",
          "description": "Date in YYYY-MM-DD format"
        },
        "total_users": {
          "type": "integer",
          "title": "Total Users",
          "description": "Total users on this date"
        },
        "new_users": {
          "type": "integer",
          "title": "New Users",
          "description": "New users on this date"
        }
      },
      "type": "object",
      "required": [
        "date",
        "total_users",
        "new_users"
      ],
      "title": "UserGrowthData"
    },
    "UserProfile": {
      "properties": {
        "user_id": {
          "type": "string",
          "title": "User Id"
        },
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email"
        },
        "phone_number": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Phone Number"
        },
        "role": {
          "type": "string",
          "title": "Role"
        },
        "created_at": {
          "type": "string",
          "title": "Created At"
        },
        "is_active": {
          "type": "boolean",
          "title": "Is Active"
        },
        "profile": {
          "anyOf": [
            {
              "type": "object"
            },
            {
              "type": "null"
            }
          ],
          "title": "Profile"
        }
      },
      "type": "object",
      "required": [
        "user_id",
        "email",
        "role",
        "created_at",
        "is_active"
      ],
      "title": "UserProfile",
      "description": "User profile information with optional role-specific profile data"
    },
    "UserResponse": {
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email"
        },
        "phone_number": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Phone Number"
        },
        "user_id": {
          "type": "string",
          "title": "User Id"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        },
        "is_active": {
          "type": "boolean",
          "title": "Is Active"
        },
        "role": {
          "$ref": "#/components/schemas/UserRole"
        },
        "chef_profile": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/ChefProfileResponse"
            },
            {
              "type": "null"
            }
          ]
        },
        "customer_profile": {
          "anyOf": [
            {
              "$ref": "#/components/schemas/CustomerProfileResponse"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "type": "object",
      "required": [
        "email",
        "user_id",
        "created_at",
        "updated_at",
        "is_active",
        "role"
      ],
      "title": "UserResponse"
    },
    "UserRole": {
      "type": "string",
      "enum": [
        "admin",
        "user",
        "customer",
        "chef"
      ],
      "title": "UserRole"
    },
    "UserTypeEnum": {
      "type": "string",
      "enum": [
        "customer",
        "chef",
        "both",
        "supporter"
      ],
      "title": "UserTypeEnum"
    },
    "UserUpdate": {
      "properties": {
        "email": {
          "anyOf": [
            {
              "type": "string",
              "format": "email"
            },
            {
              "type": "null"
            }
          ],
          "title": "Email"
        },
        "phone_number": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Phone Number"
        },
        "is_active": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "null"
            }
          ],
          "title": "Is Active"
        }
      },
      "type": "object",
      "title": "UserUpdate"
    },
    "ValidationError": {
      "properties": {
        "loc": {
          "items": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "integer"
              }
            ]
          },
          "type": "array",
          "title": "Location"
        },
        "msg": {
          "type": "string",
          "title": "Message"
        },
        "type": {
          "type": "string",
          "title": "Error Type"
        }
      },
      "type": "object",
      "required": [
        "loc",
        "msg",
        "type"
      ],
      "title": "ValidationError"
    },
    "VehicleType": {
      "type": "string",
      "enum": [
        "car",
        "motorcycle",
        "bicycle",
        "scooter"
      ],
      "title": "VehicleType"
    },
    "WaitlistResponse": {
      "properties": {
        "user_type": {
          "$ref": "#/components/schemas/UserTypeEnum",
          "examples": [
            "customer"
          ]
        },
        "full_name": {
          "type": "string",
          "title": "Full Name",
          "examples": [
            "Jane Smith"
          ]
        },
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email",
          "examples": [
            "jane.smith@cribnosh.co.uk"
          ]
        },
        "phone": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Phone",
          "examples": [
            "123-456-7890"
          ]
        },
        "city": {
          "type": "string",
          "title": "City",
          "examples": [
            "New York"
          ]
        },
        "cuisine_preferences": {
          "anyOf": [
            {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cuisine Preferences",
          "examples": [
            [
              "Italian",
              "Mexican"
            ]
          ]
        },
        "allergies": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Allergies",
          "examples": [
            "Peanuts, Shellfish"
          ]
        },
        "meal_frequency": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Meal Frequency",
          "examples": [
            "3-5 times a week"
          ]
        },
        "cooking_experience": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cooking Experience",
          "examples": [
            "5 years professional chef"
          ]
        },
        "cooking_type": {
          "anyOf": [
            {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            {
              "type": "null"
            }
          ],
          "title": "Cooking Type",
          "examples": [
            [
              "Fine Dining",
              "Pastry"
            ]
          ]
        },
        "top_dishes": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Top Dishes",
          "examples": [
            "Beef Wellington, Chocolate Lava Cake"
          ]
        },
        "certifications": {
          "anyOf": [
            {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            {
              "type": "null"
            }
          ],
          "title": "Certifications",
          "examples": [
            [
              "Culinary Arts Degree",
              "Food Safety Certified"
            ]
          ]
        },
        "support_needed": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "title": "Support Needed",
          "examples": [
            "Marketing assistance, Delivery logistics"
          ]
        },
        "communication_preferences": {
          "anyOf": [
            {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            {
              "type": "null"
            }
          ],
          "title": "Communication Preferences",
          "examples": [
            [
              "Email",
              "SMS"
            ]
          ]
        },
        "id": {
          "type": "integer",
          "title": "Id"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "title": "Created At"
        },
        "updated_at": {
          "type": "string",
          "format": "date-time",
          "title": "Updated At"
        }
      },
      "type": "object",
      "required": [
        "user_type",
        "full_name",
        "email",
        "city",
        "id",
        "created_at",
        "updated_at"
      ],
      "title": "WaitlistResponse"
    },
    "cribnorah__schemas__chat__MessageCreate": {
      "properties": {
        "content": {
          "type": "string",
          "title": "Content",
          "description": "Message content"
        }
      },
      "type": "object",
      "required": [
        "content"
      ],
      "title": "MessageCreate"
    },
    "cribnorah__schemas__messages__MessageCreate": {
      "properties": {
        "content": {
          "type": "string",
          "maxLength": 2000,
          "minLength": 1,
          "title": "Content"
        },
        "recipient_user_id": {
          "type": "string",
          "title": "Recipient User Id"
        }
      },
      "type": "object",
      "required": [
        "content",
        "recipient_user_id"
      ],
      "title": "MessageCreate"
    }
  }
}