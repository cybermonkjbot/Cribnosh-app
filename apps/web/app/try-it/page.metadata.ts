import { generateMetadata, generateAiMetadata } from "../../lib/utils";

export const metadata = {
  ...generateMetadata({
    title: "Try CribNosh | Find Your Perfect Cultural Meal",
    description: "Explore our platform and discover authentic cultural meals from verified Food Creators in your area.",
    path: "/try-it"
  }),
  ...generateAiMetadata({
    pageName: "Try CribNosh Experience",
    pageType: "SearchPage",
    actions: [
      "search_meals",
      "filter_by_cuisine",
      "filter_by_dietary",
      "view_chef_profile",
      "book_meal"
    ],
    entities: [
      {
        type: "SearchInterface",
        name: "meal_search",
        properties: {
          "supports_filters": true,
          "supports_geolocation": true,
          "supports_dietary_preferences": true
        }
      },
      {
        type: "ResultsList",
        name: "meals_list",
        properties: {
          "supports_pagination": true,
          "supports_sorting": true
        }
      }
    ],
    contextualHints: [
      "User can search for meals by cuisine type",
      "Dietary preferences can be specified",
      "Results can be filtered by location",
      "Chef profiles are accessible from search results",
      "Direct booking available from search results"
    ]
  })
}; 