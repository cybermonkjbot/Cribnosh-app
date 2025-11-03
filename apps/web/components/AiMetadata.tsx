interface ActionProtocol {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  parameters?: {
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }[];
  url?: string;
  method?: string;
}

interface AICapability {
  name: string;
  description: string;
  endpoint?: string;
  parameters?: Record<string, string>;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';

export function AiMetadata() {
  // Model Context Protocol
  const modelContext = {
    "@context": "https://modelcontext.org/v1",
    "@type": "WebApplication",
    "name": "CribNosh",
    "description": "The app for foodies connecting local chefs with food enthusiasts",
    "capabilities": [
      {
        "name": "search_meals",
        "description": "Search for available meals by cuisine, dietary preferences, or location",
        "endpoint": `${baseUrl}/api/search`
      },
      {
        "name": "book_chef",
        "description": "Book a local chef for meal preparation",
        "endpoint": `${baseUrl}/api/booking`
      }
    ],
    "preferences": {
      "language": "en",
      "currency": "USD",
      "units": "imperial"
    }
  };

  // Action Protocol for common tasks
  const actionProtocols: ActionProtocol[] = [
    {
      "@context": "https://schema.org",
      "@type": "SearchAction",
      "name": "search_meals",
      "description": "Search for meals by cuisine or dietary preferences",
      "parameters": [
        {
          name: "cuisine",
          type: "string",
          description: "Type of cuisine (e.g., Italian, Indian, Mexican)"
        },
        {
          name: "dietary",
          type: "string",
          description: "Dietary restrictions (e.g., vegetarian, vegan, gluten-free)"
        }
      ],
      "url": `${baseUrl}/api/search?q={cuisine}&diet={dietary}`
    },
    {
      "@context": "https://schema.org",
      "@type": "OrderAction",
      "name": "place_order",
      "description": "Place an order for a meal",
      "method": "POST",
      "url": `${baseUrl}/api/orders`
    }
  ];

  // AI Capabilities Description
  const aiCapabilities: AICapability[] = [
    {
      name: "dietary_analysis",
      description: "Analyze meal ingredients for dietary restrictions and allergies",
      parameters: {
        "input_type": "ingredients_list",
        "output_format": "dietary_flags"
      }
    },
    {
      name: "meal_recommendations",
      description: "Get personalized meal recommendations based on preferences and history",
      parameters: {
        "user_id": "string",
        "preference_type": "cuisine|dietary|price"
      }
    }
  ];

  // Conversation Context Protocol
  const conversationContext = {
    "@context": "https://conversation.protocol/v1",
    "@type": "ConversationCapability",
    "intents": [
      {
        "name": "find_meal",
        "utterances": [
          "I want to find {cuisine_type} food",
          "Show me {dietary_restriction} meals",
          "Find chefs near {location}"
        ],
        "parameters": {
          "cuisine_type": "string",
          "dietary_restriction": "string",
          "location": "string"
        }
      },
      {
        "name": "book_chef",
        "utterances": [
          "Book chef {chef_name}",
          "Schedule meal for {date_time}",
          "Make reservation for {number_of_people} people"
        ],
        "parameters": {
          "chef_name": "string",
          "date_time": "datetime",
          "number_of_people": "integer"
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(modelContext)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(actionProtocols)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://ai.protocol/v1",
            "@type": "AICapabilities",
            "capabilities": aiCapabilities
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(conversationContext)
        }}
      />
      <meta name="ai-interaction-mode" content="autonomous" />
      <meta name="ai-capability-level" content="advanced" />
      <meta name="ai-data-schema-version" content="1.0" />
      <link 
        rel="ai-documentation" 
        href={`${baseUrl}/ai-docs`} 
        type="application/json" 
      />
    </>
  );
} 