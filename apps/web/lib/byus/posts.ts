type CalloutVariant = 'note' | 'warning' | 'tip';

export type ContentSection = {
	id: string;
	title: string;
	paragraphs: string[];
	bullets?: string[];
	checklist?: string[];
	proTips?: string[];
	callout?: { variant: CalloutVariant; text: string };
	image?: string;
	imageAlt?: string;
	video?: string;
	videoThumbnail?: string;
};

export type ByUsPost = {
	title: string;
	slug: string;
	coverImage: string;
	date: string;
	author: { name: string; avatar: string };
	categories: string[];
	description: string;
	body: string[];
	headings?: { id: string; text: string }[];
	sections?: ContentSection[];
};

export const POSTS: ByUsPost[] = [
	{
		title: "CribNosh vs Uber Eats: Why Home–Cooked Wins in 2025",
		slug: "cribnosh-vs-uber-eats-2025",
		coverImage: "/backgrounds/masonry-1.jpg",
		date: "August 2025",
		author: { name: "CribNosh Editorial", avatar: "/card-images/IMG_2262.png" },
		categories: ["Kitchen Stories"],
		description:
			"Compare delivery fees, food freshness, and cultural flavor. See how CribNosh's home–cooked meals stack up against traditional delivery apps and when to choose each.",
		body: [
			"CribNosh connects you with verified Food Creators who cook fresh, small–batch meals. For nights when you want warmth and real flavor, that freshness matters.",
			"Delivery apps excel at speed and scale, but can struggle with soggy fries and steam–tired bowls on longer trips. Home cooking travels better when packed with intention, stews, bakes, rice dishes, and braises.",
			"Fees differ by platform and city. CribNosh emphasizes family–style value and transparent pricing. Ordering for 2–4 often beats piecemeal single orders.",
			"When to choose each: choose CribNosh for homestyle comfort, cultural dishes, and shareable value. Choose big apps when you need late–night fast food variety.",
			"Delivery windows: many CribNosh chefs publish limited daily slots to keep quality high. Ordering earlier in the day increases availability and ensures peak freshness on arrival.",
			"Sustainability: home kitchens typically cook to order, which reduces food waste. Family–style packaging also cuts down on single–use plastics compared with multiple small clamshells.",
			"Trust & safety: chefs on CribNosh are verified, and listings include kitchen notes and ingredients. If something isn't right, our support team is available to help.",
			"Taste experience: because portions are cooked in smaller batches, sauces reduce naturally and spices bloom properly, so you get depth, not just heat.",
			"Texture matters: braises and bakes arrive with integrity. If you're craving crunch, many chefs include crisp toppings separately so you can add them at home.",
			"Budget check: when you factor leftovers, family–style trays often cover dinner and lunch. That stretches your spend while keeping quality high.",
			"Who it's for: people who care about heritage recipes, slower food done right, and supporting local kitchens without compromising convenience.",
			"Kitchen transparency: many chefs share sourcing notes and prep details, so you know what's in your bowl and who made it.",
			"Seasonality: rotating menus follow what's fresh and affordable, expect subtle shifts in herbs, greens, and sides across the year.",
			"Community loop: every review guides chefs on portioning and flavor balance, which improves dishes for everyone over time."
		],
		headings: [
			{ id: "freshness", text: "Freshness & Flavor" },
			{ id: "fees", text: "Fees & Value" },
			{ id: "when-to-choose", text: "When to Choose Each" }
		],
		sections: [
			{
				id: 'freshness',
				title: 'Freshness & Flavor',
				paragraphs: [
					"Home–cooked dishes are designed to be nourishing first, photogenic second. That philosophy translates into recipes that travel well and reheat beautifully.",
					"Moisture–preserving formats like stews, braises, rice dishes, and bakes retain texture better than fried items on longer routes."
				],
				bullets: [
					"Best travelers: lentil stews, braised meats, baked pasta, pilafs, tagines",
					"Avoid for long trips: thin fries, battered items, crispy tortillas without vented packing"
				],
				callout: { variant: 'tip', text: 'Ordering for tomorrow? Choose dishes with sauces, they reheat evenly and stay juicy.' }
			},
			{
				id: 'fees',
				title: 'Fees & Value',
				paragraphs: [
					"Family–style portions reduce per–person cost and packaging waste. Many chefs bundle mains with sides to deliver a full meal at better value than single–entrée orders.",
					"Transparent breakdowns at checkout help you compare apples to apples across platforms."
				],
				checklist: [
					"Compare per–person cost vs. single entrée",
					"Add one veg side to balance macros",
					"Save favorites to catch promos"
				]
			},
			{
				id: 'when-to-choose',
				title: 'When to Choose Each',
				paragraphs: [
					"Pick CribNosh when you want cultural comfort, slow–food care, and leftovers that taste even better next day.",
					"Pick large–scale apps when you need late–night fast food variety or specific chain items in minutes."
				],
				proTips: [
					"Order earlier on weekends; prime slots go fast",
					"Ask for extra herbs or chili oil on the side for flexible heat",
					"Use notes to request separate packing for crisp items"
				]
			}
		]
	},
	{
		title: "Birmingham Food Delivery: Best Home–Cooked Dishes Near You",
		slug: "birmingham-best-dishes",
		coverImage: "/images/cities/optimized/birmingham-new.jpg",
		date: "August 2025",
		author: { name: "Local Guides • CribNosh", avatar: "/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg" },
		categories: ["Kitchen Stories"],
		description: "A local guide to Birmingham's top home–cooked meals on CribNosh, hearty stews, baked favorites, and weeknight staples.",
		body: [
			"Birmingham diners love rich, shareable mains. Explore stews, roast–style trays, and pasta bakes that travel beautifully.",
			"Order early for popular weekend slots. Family–style portions keep cost per person low.",
			"Pair mains with veg sides or breads for a balanced, cozy night in.",
			"Neighborhood tips: deliveries around Edgbaston and City Centre move quickly during off–peak; plan extra time on match days.",
			"Chef notes often include reheat tips for next day, perfect for working lunches or Sunday leftovers.",
			"Local favorites trend hearty but nuanced, expect slow–cooked spices, creamy sauces, and soft starches that hold heat and comfort.",
			"If you're feeding a crowd, mix one mild tray with one bolder dish. Add a bright salad to cut richness and keep palates refreshed.",
			"Reheat plan: keep a splash of stock or water on hand to loosen sauces gently, avoid microwaving uncovered to preserve moisture.",
			"Allergen clarity: most listings include nuts, dairy, and gluten notes, when in doubt, message your chef before ordering."
		],
		sections: [
			{
				id: 'areas',
				title: 'Neighborhood Notes',
				paragraphs: [
					"Edgbaston, Jewellery Quarter, and City Centre typically see steady courier coverage, with quicker handoffs off–peak.",
					"Match days around stadiums can slow traffic; consider ordering earlier and reheating."
				],
				proTips: [
					"Batch order: one tray for tonight, one for lunches",
					"Ask for herbs and dressings on the side to control texture"
				]
			},
			{
				id: 'pairings',
				title: 'Smart Pairings',
				paragraphs: [
					"Balance rich mains with bright sides, think tangy slaw with a creamy bake or herby rice with slow roasts."
				],
				bullets: [
					"Pasta bake + lemony greens",
					"Beef stew + buttered potatoes",
					"Veg lasagne + crisp salad"
				]
			}
		]
	},
	{
		title: "Leicester Food Delivery: Home–Cooked Options You'll Love",
		slug: "leicester-home-cooked-delivery",
		coverImage: "/images/cities/optimized/leicester.jpg",
		date: "August 2025",
		author: { name: "Local Guides • CribNosh", avatar: "/card-images/IMG_2262.png" },
		categories: ["Kitchen Stories"],
		description: "From family curries to baked treats, discover Leicester's most loved community–made meals.",
		body: [
			"Leicester shines for family curries and homemade breads. Look for slow–cooked dals, biryanis, and rotis.",
			"Customize spice levels in notes; request extra herbs or lighter oils as needed.",
			"Save chef favorites to get notified when batches open.",
			"Budget saver: order one large main and a carb base, then split across two meals.",
			"Dessert picks: homestyle rice puddings and semolina treats are local favorites and travel well.",
			"Weekend rhythm: trays post in the afternoon for evening handoff, set alerts so you don't miss limited batches.",
			"Bread tip: ask for rotis wrapped separately in paper to keep them soft yet dry until serving.",
			"Value move: one biryani plus extra raita stretches into two meals without feeling repetitive.",
			"Group orders: stagger spice levels and add a sweet to finish, light puddings travel well and soothe heat for mixed groups."
		],
		sections: [
			{
				id: 'favorites',
				title: 'Local Favorites',
				paragraphs: [
					"Leicester's strength is soulful family curries and breads rolled hours, not weeks, before they reach you."
				],
				bullets: [
					"Dal tadka + jeera rice",
					"Chicken biryani + raita",
					"Aloo paratha + pickle"
				],
				callout: { variant: 'note', text: 'Spice heat is adjustable. Use order notes for mild/medium/hot.' }
			},
			{
				id: 'sweet',
				title: 'Sweet Finishes',
				paragraphs: [
					"Homestyle semolina puddings and rice kheer travel well and keep for next–day treats."
				]
			}
		]
	},
	{
		title: "Nottingham Food Delivery Guide: From Family Kitchens to Your Door",
		slug: "nottingham-delivery-guide",
		coverImage: "/images/cities/optimized/nottingham.jpg",
		date: "August 2025",
		author: { name: "Local Guides • CribNosh", avatar: "/delivery-/8580cf51-dc5a-4803-b3fa-4124eb93f29c.jpeg" },
		categories: ["Kitchen Stories"],
		description: "Top Nottingham picks for comforting, chef–made meals, perfect for study nights and cozy weekends.",
		body: [
			"Budget–friendly trays and reheatable bowls make weeknights easy.",
			"Great next–day candidates: stews, baked pasta, rice bowls. See chef reheat notes.",
			"For societies: mix mild and bold dishes; label allergens in group orders.",
			"Campus tip: coordinate drop–off near building entrances; add a phone number for smooth handoff.",
			"Late library nights? Look for chefs with extended hours on Fridays and exam weeks.",
			"Study fuel: pick one protein–heavy main and one fiber–rich side. You'll feel fuller, longer, no crash during revision.",
			"Microwave tip: reheat in short bursts with a cover; stir between rounds to avoid hot spots and dry edges.",
			"Library etiquette: add a delivery note with a clear landmark to shorten handoff time in busy areas."
		],
		sections: [
			{
				id: 'student-life',
				title: 'Student Life Tips',
				paragraphs: [
					"Plan two big orders per week and portion into containers. You'll eat better and spend less than daily single orders."
				],
				checklist: [
					"Choose one protein–rich main",
					"Add one veg side",
					"Order fruit for snacking"
				]
			}
		]
	},
	{
		title: "Support Local Chefs: Why Community Kitchens Matter",
		slug: "support-local-chefs",
		coverImage: "/backgrounds/masonry-2.jpg",
		date: "July 2025",
		author: { name: "Community Spotlight", avatar: "/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg" },
		categories: ["Cultural Heritage"],
		description: "Every order helps a verified Food Creator grow, strengthening neighborhoods and preserving food traditions.",
		body: [
			"CribNosh verifies chefs and supports safe, small–batch food businesses.",
			"Your order funds local kitchens and keeps family recipes alive.",
			"Review and share your favorites to help chefs build steady demand.",
			"Community impact: repeat orders give chefs predictable income to grow responsibly and invest in better tools.",
			"Beyond economics, you're also validating cultural storytelling through food, signal boosting dishes that rarely make it onto chain menus.",
			"Visibility matters: leaving photos in reviews helps chefs showcase technique and authenticity to new diners.",
			"Ripple effects: steady demand lets cooks mentor helpers, investing in safe, sustainable growth at home."
		],
		sections: [
			{
				id: 'impact',
				title: 'How Your Order Helps',
				paragraphs: [
					"Beyond dinner, you're funding local kitchens, equipment upgrades, and the passing down of family techniques to the next generation."
				]
			}
		]
	},
	{
		title: "Weekend Specials: Family Platters for Game Night",
		slug: "weekend-family-platters",
		coverImage: "/backgrounds/masonry-3.jpg",
		date: "July 2025",
		author: { name: "CribNosh Team", avatar: "/delivery-/8580cf51-dc5a-4803-b3fa-4124eb93f29c.jpeg" },
		categories: ["Recipe Collections"],
		description: "Big flavor, shareable portions, and cozy night–in picks that won't break the bank.",
		body: [
			"Order larger trays and split across friends, cheaper and more fun.",
			"Curry + rice + flatbread is a reliable trio; add a veg bake for balance.",
			"Use reheat tips to keep leftovers excellent next day.",
			"Drinks & sides: pair spicy mains with yogurt dips or fresh salads to keep palates happy all game long.",
			"Crowd control: label trays by spice level and set up a simple self–serve line so everyone builds their perfect plate.",
			"Leftover strategy: pack small containers at halftime so post–game cleanup is instant and lunches are sorted.",
			"Game–day drinks: pair richer mains with citrusy sodas or iced tea to keep palates fresh between bites."
		],
		sections: [
			{
				id: 'hosting',
				title: 'Hosting Made Easy',
				paragraphs: [
					"For match nights, mix a mild curry with a spicy one, then add a cooling salad and a starchy side."
				],
				proTips: [
					"Serve in pre–warmed dishes to keep temps stable",
					"Label allergens with sticky notes for guests"
				]
			}
		]
	},
	{
		title: "Coventry Comforts: Classic Home Dishes Delivered",
		slug: "coventry-comforts",
		coverImage: "/images/cities/optimized/coventry.jpg",
		date: "July 2025",
		author: { name: "Local Guides • CribNosh", avatar: "/card-images/IMG_2262.png" },
		categories: ["Kitchen Stories"],
		description: "From stews to bakes, the Coventry lineup that locals keep re–ordering.",
		body: [
			"Comfort reigns: stews, casseroles, and oven bakes do best in transit.",
			"Check chef schedules; many open limited weekend batches.",
			"Don't forget sides, greens and breads elevate the spread.",
			"Family tip: split trays into containers while warm; cool quickly before refrigeration for best next–day texture.",
			"If rain's on the forecast, plan an earlier slot to avoid delays and keep temperatures steady.",
			"Balance plate: add something crunchy and something bright, pickled veg or a tangy slaw, to complement slower–cooked mains."
		],
		sections: [
			{
				id: 'packing',
				title: 'Packing & Portions',
				paragraphs: [
					"Most chefs separate sauces and garnishes. If you prefer combined, mention it in notes, otherwise keep sides separate to preserve texture."
				]
			}
		]
	},
	{
		title: "Wolverhampton Eats: Hearty Home Favorites Near You",
		slug: "wolverhampton-home-favorites",
		coverImage: "/images/cities/optimized/wolverhampton.jpg",
		date: "July 2025",
		author: { name: "Local Guides • CribNosh", avatar: "/delivery-/8580cf51-dc5a-4803-b3fa-4124eb93f29c.jpeg" },
		categories: ["Kitchen Stories"],
		description: "From slow–cooked classics to fresh bakes, discover Wolverhampton's best community–made dishes.",
		body: [
			"Slow–cooked mains and baked trays travel beautifully and feed groups.",
			"Add a salad or veg side to keep plates fresh and colorful.",
			"Save the listing to catch the next batch as slots fill fast.",
			"Weekend rhythm: Saturday afternoons book quickly, pre–order on Friday to secure your slot.",
			"Texture tip: request crispy garnishes packed separately so you can add just before serving.",
			"Storage note: refrigerate trays uncovered for 10 minutes to release steam, then cover to prevent sogginess."
		],
		sections: [
			{
				id: 'weekend',
				title: 'Beat the Weekend Rush',
				paragraphs: [
					"Secure Saturday trays by ordering Friday evening. Reheat with a splash of stock to revive saucy mains."
				]
			}
		]
	},
	{
		title: "Stoke–on–Trent Comforts: Pottery City Plates to Try",
		slug: "stoke-on-trent-comforts",
		coverImage: "/images/cities/optimized/stoke-on-trent.jpg",
		date: "July 2025",
		author: { name: "Local Guides • CribNosh", avatar: "/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg" },
		categories: ["Kitchen Stories"],
		description: "Local comfort dishes and weeknight winners from Stoke's talented Food Creators.",
		body: [
			"Try hearty pies, bakes, and saucy mains that reheat well the next day.",
			"For families, opt for shareable trays and add a kid–friendly side.",
			"Check notes for chef packing methods to retain texture.",
			"Local tip: some chefs offer collection during peak rain, handy when delivery windows are tight.",
			"Budget tip: trays often stretch to lunch the next day, store in shallow containers for quick reheats.",
			"Kid–friendly: keep sauces on the side and let everyone build a plate, less waste, more smiles."
		],
		sections: [
			{
				id: 'rain',
				title: 'Rainy Day Logistics',
				paragraphs: [
					"If weather is rough, be ready for a call from your courier. Meeting at the entrance speeds handoff and keeps food hot."
				]
			}
		]
	},
	{
		title: "Northampton Bakes & More: From Home Ovens to Your Door",
		slug: "northampton-bakes-and-mains",
		coverImage: "/images/cities/optimized/northampton.jpg",
		date: "July 2025",
		author: { name: "Local Guides • CribNosh", avatar: "/card-images/IMG_2262.png" },
		categories: ["Kitchen Stories"],
		description: "Top pastries, pies, and homestyle mains loved by Northampton regulars.",
		body: [
			"Pastry bakes, pies, and gratins deliver that just–baked comfort at home.",
			"Schedule deliveries near mealtime to enjoy peak warmth.",
			"Pair with a simple salad or soup for balance.",
			"Storage: keep pastry loosely covered to preserve crispness; reheat in oven, not microwave.",
			"If you're saving a slice, cool uncovered for a few minutes to prevent condensation, then wrap lightly.",
			"Crisp care: reheat pastry on a rack, not a tray, so hot air circulates and bottoms don't steam."
		],
		sections: [
			{
				id: 'storage',
				title: 'Storage & Reheat',
				paragraphs: [
					"Cool pastry on a rack before refrigerating to avoid condensation. Reheat in a 160–175°C oven for 6–10 minutes."
				]
			}
		]
	},
	{
		title: "Derby Family Favorites: Real Home Food, Real Fast",
		slug: "derby-family-favorites",
		coverImage: "/images/cities/optimized/derby.jpg",
		date: "July 2025",
		author: { name: "Local Guides • CribNosh", avatar: "/delivery-/IMG_2270.png" },
		categories: ["Kitchen Stories"],
		description: "Classic roast–style plates, stews, and shareables that make dinner easy in Derby.",
		body: [
			"Go for trays that portion easily across the family.",
			"Chef notes often include kid–friendly suggestions and reheats.",
			"Leave a review so your favorite chef can plan bigger batches.",
			"Pro tip: request sauce on the side for picky eaters; mix in at the table.",
			"Family routine: keep a neutral starch ready so you can adjust spice at the table without making a second meal.",
			"Weeknight flow: portion trays right at delivery; future you will thank you at 6pm tomorrow."
		],
		sections: [
			{
				id: 'family-flow',
				title: 'Family Night Flow',
				paragraphs: [
					"Serve sauces on the side so each plate can be built to taste. Keep a neutral starch for kids and add spice at the table."
				]
			}
		]
	},
	{
		title: "Student Eats: Budget–Friendly Home Meals in Nottingham",
		slug: "student-meals-nottingham",
		coverImage: "/backgrounds/masonry-2.jpg",
		date: "August 2025",
		author: { name: "Campus Guide • CribNosh", avatar: "/card-images/IMG_2262.png" },
		categories: ["Kitchen Stories"],
		description: "Affordable, filling plates from local Food Creators, perfect for study nights and societies.",
		body: [
			"Order shareable bowls to split across the week; add protein sides if needed.",
			"Microwave–friendly packaging and reheat notes help during exam season.",
			"Coordinate group orders for societies to reduce per–person cost.",
			"Night study kit: rice bowl + curry + fruit, fast, balanced, and budget–friendly.",
			"Hydration counts: brothy mains pull double duty for warmth and focus, add lemon or herbs for lift.",
			"Sharing tip: two mains + two sides usually cover four study meals, label containers by day for easy grabs."
		],
		sections: [
			{
				id: 'study',
				title: 'Study Routine',
				paragraphs: [
					"Bookend your week with two bulk orders and block 20 minutes for portioning. Your future self will thank you during exam crunch."
				]
			}
		]
	},
	{
		title: "Halal Home–Cooked Delivery: A Quick Ordering Guide",
		slug: "halal-home-cooked-guide",
		coverImage: "/backgrounds/masonry-1.jpg",
		date: "August 2025",
		author: { name: "CribNosh Editorial", avatar: "/delivery-/8580cf51-dc5a-4803-b3fa-4124eb93f29c.jpeg" },
		categories: ["Cultural Heritage"],
		description: "How to find halal meals, read chef labels, and message for prep details on CribNosh.",
		body: [
			"Use halal filters and confirm in chef notes; ask about suppliers if needed.",
			"Avoid cross–contact by requesting separate packing for mixed households.",
			"Save trusted halal kitchens for easy reordering.",
			"If in doubt, message the chef, most will gladly confirm certification and workflows.",
			"If you're hosting, request labels on each tray so guests can feel confident about what they're eating.",
			"Travel plan: ask for sauces in sealed cups and breads wrapped separately to minimize cross–contact on the table."
		],
		sections: [
			{
				id: 'labels',
				title: 'Labels & Verification',
				paragraphs: [
					"Halal labels appear on chef profiles and dish listings. If you need certification details, ask in notes, chefs are happy to clarify."
				]
			}
		]
	},
	{
		title: "Late–Night Home Delivery: What's Hot After 9pm",
		slug: "late-night-home-delivery",
		coverImage: "/backgrounds/driver-background.png",
		date: "August 2025",
		author: { name: "CribNosh Team", avatar: "/card-images/IMG_2262.png" },
		categories: ["Kitchen Stories"],
		description: "Night–owl favorites and best practices for warm, on–time deliveries.",
		body: [
			"Look for chefs with later slots; stews and rice bowls hold heat best.",
			"Keep your phone handy for handoff texts to reduce delays.",
			"Tip your courier, late windows and stairs take extra effort.",
			"After–hours picks: braises and saucy mains maintain moisture better than fried foods.",
			"If you're sensitive to heavy food late, go for lentil stews, pilafs, or veg–forward bowls with bright herbs.",
			"Night pacing: smaller portions keep sleep comfortable, save a second serving for breakfast or lunch."
		],
		sections: [
			{
				id: 'late-night',
				title: 'Best Late–Night Picks',
				paragraphs: [
					"Choose saucy mains and skip crispy garnishes when it's late. Add crunch at home with toasted nuts or fresh herbs."
				]
			}
		]
	},
	{
		title: "What Is CribNosh? How Our Home–Cooked Delivery Works",
		slug: "what-is-cribnosh",
		coverImage: "/backgrounds/masonry-2.jpg",
		date: "August 2025",
		author: { name: "CribNosh Team", avatar: "/delivery-/IMG_2270.png" },
		categories: ["Kitchen Stories"],
		description:
			"From order to doorstep, here's how CribNosh connects you with verified Food Creators for fresh, flavorful meals.",
		body: [
			"Browse trusted Food Creators nearby. See ingredients, kitchen notes, and clear portion sizes.",
			"Order early for best availability. Many dishes are cooked in small batches to keep quality high.",
			"Your meal is packed for travel and delivered warm. Reheat tips are provided for next–day enjoyment.",
			"Most chefs list typical delivery windows each day. If you need a specific time, add a note, many will accommodate when possible.",
			"Trust the labels: allergen and dietary tags help you pick confidently, and you can message chefs with extra questions.",
			"Delivery etiquette: clear notes about entrances and elevators speed handoffs and keep food hotter on arrival."
		]
	},
	{
		title: "Healthy Meal Delivery at Home: Tips from CribNosh Chefs",
		slug: "healthy-meal-delivery-tips",
		coverImage: "/backgrounds/driver-background.png",
		date: "August 2025",
		author: { name: "CribNosh Editorial", avatar: "/card-images/IMG_2262.png" },
		categories: ["Sustainable Cooking"],
		description: "Smart swaps, balanced portions, and how to filter for nutrition on CribNosh.",
		body: [
			"Look for whole grains, legumes, and veg–forward mains. Our filters help you find macro–balanced meals.",
			"Ask the chef: use the notes to request lighter oils or reduced salt when possible.",
			"Batch plan: order family–style portions and portion for lunches, saves money and keeps choices consistent.",
			"Flavor move: add acidity (lemon, vinegar) and fresh herbs to make lighter meals pop without extra salt.",
			"Plate balance: aim for color contrast, greens, beans, and grains, so meals feel satisfying without heaviness."
		]
	},
	{
		title: "CribNosh Pricing Explained: Fees, Value, and Savings",
		slug: "cribnosh-pricing",
		coverImage: "/backgrounds/masonry-3.jpg",
		date: "August 2025",
		author: { name: "CribNosh Team", avatar: "/delivery-/IMG_2270.png" },
		categories: ["Kitchen Stories"],
		description: "Transparent look at delivery fees and how family–style portions save more.",
		body: [
			"We break fees out clearly at checkout, no surprises.",
			"Compare per–person cost: family trays often reduce cost vs single entrées.",
			"Repeat favorites: loyalty promos and chef specials reduce spend over time.",
			"Pro move: share a few trays with neighbors or coworkers to split delivery fees while everyone eats better.",
			"Off–peak savings: ordering slightly earlier widens delivery windows, reducing wait time and sometimes cost."
		]
	},
	{
		title: "Allergen–Friendly Home Meals: Ordering Safely on CribNosh",
		slug: "allergen-friendly-home-meals",
		coverImage: "/backgrounds/masonry-1.jpg",
		date: "July 2025",
		author: { name: "CribNosh Editorial", avatar: "/card-images/IMG_2262.png" },
		categories: ["Sustainable Cooking"],
		description: "Label reading, chef notes, and how to message your cook for clarity.",
		body: [
			"Always review ingredient labels and allergen flags listed by chefs.",
			"Message the chef for prep details, cross–contact policies vary per kitchen.",
			"Keep epinephrine on hand if prescribed; delivery time can vary.",
			"Ask for separate packing for toppings, sauces, and desserts to reduce risk at the table.",
			"Double–check: confirm ingredient changes if you reorder a dish, recipes can evolve with seasonality."
		]
	},
	{
		title: "Vegan & Vegetarian on CribNosh: Flavor–First Picks",
		slug: "vegan-vegetarian-on-cribnosh",
		coverImage: "/backgrounds/masonry-3.jpg",
		date: "August 2025",
		author: { name: "CribNosh Editorial", avatar: "/delivery-/IMG_2270.png" },
		categories: ["Sustainable Cooking", "Modern Fusion"],
		description: "Plant–forward dishes from our verified Food Creators, plus customization tips.",
		body: [
			"Try lentil stews, veg pilafs, stuffed peppers, and regional classics with plant twists.",
			"Ask for extra veg sides or swap rice types to fit your goals.",
			"Save favorites to reorder quickly when your chef lists new batches.",
			"Protein picks: beans, tofu, and paneer (if vegetarian) hold up great in transit and reheat well the next day.",
			"Texture tricks: add toasted seeds or nuts at home for crunch; a spoon of yogurt or tahini brings creaminess without heaviness."
		]
	},
	{
		title: "Reheat Like a Pro: Keeping Home Meals Fresh Next Day",
		slug: "reheat-home-meals-tips",
		coverImage: "/backgrounds/masonry-2.jpg",
		date: "August 2025",
		author: { name: "CribNosh Editorial", avatar: "/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg" },
		categories: ["Kitchen Stories"],
		description: "Chef–approved reheating tips for curries, stews, bakes, and rice dishes.",
		body: [
			"Low and slow: oven 160–175°C for bakes; stovetop with a splash of stock for stews.",
			"Rice: add a teaspoon of water, cover, and reheat thoroughly; avoid drying out.",
			"Crisp factor: air fryer 160–170°C for 3–6 minutes for texture.",
			"Herb refresh: finish reheats with fresh herbs or a squeeze of citrus to bring flavors back to life.",
			"Container care: vent lids briefly before reheating to avoid condensation dripping back and softening textures.",
		]
	},
	{
		title: "Office Lunch & Small Events: Easy Group Orders",
		slug: "office-lunch-group-orders",
		coverImage: "/backgrounds/masonry-1.jpg",
		date: "August 2025",
		author: { name: "CribNosh Team", avatar: "/delivery-/IMG_2270.png" },
		categories: ["Recipe Collections"],
		description: "How to order family–style trays, coordinate delivery windows, and please every palate.",
		body: [
			"Plan portions as 2–3 servings per tray; add a veg side to round out.",
			"Coordinate building access in delivery notes; share contact for lobby calls.",
			"Mix mild and bold dishes; request labeling for dietary needs.",
			"Timekeeper: stagger delivery 20–30 minutes before your meeting so setup is stress–free and food is hot when people arrive.",
			"Office setup: request serving utensils and extra napkins in notes so you're not scrambling when guests sit down."
		]
	},
	{
		title: "Pierogi Power: UK-Based Polish Food creators Rescuing Grandmas' Recipes",
		slug: "pierogi-power-uk-polish-home-cooks",
		coverImage: "/backgrounds/masonry-1.jpg",
		date: "August 2025",
		author: { name: "CribNosh Editorial", avatar: "/card-images/IMG_2262.png" },
		categories: ["Cultural Heritage"],
		description:
			"If you've ever walked through a Polish neighbourhood in London, Manchester, or Birmingham, you've probably caught a whiff of something nostalgic; the warm, buttery scent of pierogi sizzling on a pan.",
		body: [
			"If you've ever walked through a Polish neighbourhood in London, Manchester, or Birmingham, you've probably caught a whiff of something nostalgic; the warm, buttery scent of pierogi sizzling on a pan.",
			"It's the kind of smell that doesn't just make you hungry; it takes you home.",
			"For thousands of Polish families across the UK, the kitchen has become the bridge between home and here.",
			"And for many home food creators, that bridge has become a small, thriving business."
		],
		headings: [
			{ id: "taste-that-travels", text: "A Taste That Travels, But Never Changes" },
			{ id: "community", text: "The rise of Polish home food creators isn't just about nostalgia" },
			{ id: "flavours", text: "The Flavours That Define Poland Abroad" },
			{ id: "adapting", text: "Adapting Tradition in a New Country" },
			{ id: "voices", text: "Community Voices" },
			{ id: "cribnosh", text: "How we, at CribNosh, Connects the Dots" },
			{ id: "join", text: "Join the Movement" }
		],
		sections: [
			{
				id: "taste-that-travels",
				title: "A Taste That Travels, But Never Changes",
				paragraphs: [
					"When Ania moved from Kraków to Birmingham five years ago, her suitcase was half-filled with clothes; and half with her mum's spice packets.",
					"She laughs about it now. \"You can find flour anywhere,\" she says, \"but not the taste of home.\"",
					"That sentiment echoes through hundreds of Polish kitchens across the UK; where creators recreate comfort food like bigos, żurek, and pierogi ruskie from their family notebooks.",
					"Take a look at how @HarissonPaulUK explains the intricacies and delicacies of some amazing Polish indigenous foods."
				],
				video: "/blog/Harrison Paul UK TikTok Video.mp4",
				videoThumbnail: "/blog/Harrison Paul UK TikTok Video.mp4"
			},
			{
				id: "community",
				title: "The rise of Polish home food creators isn't just about nostalgia",
				paragraphs: [
					"It's also about community…",
					"Across Facebook groups, Polish markets, and pop-up stalls, creators are rediscovering how powerful food can be in connecting people far from home.",
					"Take Percy Kleśta for example; she started posting short reels of her dumpling-making nights on Instagram, just to show her friends back home what she was cooking. Within weeks, her neighbours in Edinburgh began asking, \"Can I order that?\"",
					"That's how a family dinner turned into a home-based business."
				],
				image: "/blog/Percy Klesta IG Profile.png",
				imageAlt: "Percy Klesta Instagram profile showing Polish dumpling-making content"
			},
			{
				id: "flavours",
				title: "The Flavours That Define Poland Abroad",
				paragraphs: [
					"Each Polish dish tells a story; usually of patience, simplicity, and warmth."
				],
				bullets: [
					"a. Pierogi: Stuffed dumplings that come in sweet or savoury varieties, often made with cheese, potatoes, or cabbage.",
					"b. Bigos: A slow-cooked hunter's stew of sauerkraut and meats, simmered for hours.",
					"c. Żurek: A sour rye soup often served with sausage and egg, especially during Easter.",
					"d. Makowiec: A poppy-seed roll that fills Polish homes with the smell of celebration."
				],
				image: "/blog/Zurek.png",
				imageAlt: "Traditional Polish żurek soup served with sausage and egg",
				callout: {
					variant: "note",
					text: "Read more in-depth about these dishes from the blog post by PolishHouseWife.com here: https://polishhousewife.com/makowiec-polish-poppy-seed-roll/"
				}
			},
			{
				id: "adapting",
				title: "Adapting Tradition in a New Country",
				paragraphs: [
					"Cooking Polish food in the UK comes with its own challenges.",
					"Some ingredients are easy to find; flour, cabbage, butter; but others, like twaróg (Polish white cheese), need creativity or imports from specialty stores.",
					"Polish Food Deli in London Polish Food Market in Brexit",
					"Still, the heart of Polish cooking is not in the ingredients; it's in the ritual.",
					"The early morning kneading of dough.",
					"The laughter over imperfect dumpling shapes.",
					"The joy of feeding people; whether they're from Warsaw or Wolverhampton."
				],
				image: "/blog/Polish Food Deli in London.png",
				imageAlt: "Polish Food Deli in London offering traditional Polish ingredients"
			},
			{
				id: "voices",
				title: "Community Voices",
				bullets: [
					"\"I never planned to sell food. It started when my neighbour tried my barszcz and told everyone in the building.\"; @AniaEatsLondon",
					"\"I make bigos the same way my grandmother did. It smells like her house; that's why I keep doing it.\"; @TasteofPolandUK",
					"\"We are going to be having traditional Polish food for breakfast, lunch and dinner\"; @Jay-and-Karolina"
				],
				paragraphs: [
					"These voices represent what CribNosh is all about; real people sharing food, memory, and home.",
					"Each of these voices reminds us that home isn't a place you leave behind; it's something you recreate wherever you are.",
					"From the quiet hum of a London flat kitchen to the laughter over dumpling dough in Manchester, Polish home food creators are proving that recipes can travel across borders without losing their soul.",
					"They're not just cooking for others; they're keeping a heritage alive, one meal, one memory, one plate at a time."
				]
			},
			{
				id: "cribnosh",
				title: "How we, at CribNosh, Connects the Dots",
				paragraphs: [
					"CribNosh celebrates exactly these kinds of creators; people who turn family recipes into community experiences.",
					"Through our platform, Polish home food creators in the UK can:"
				],
				checklist: [
					"List their meals for local delivery.",
					"Share their personal stories and food origins.",
					"Be discovered by both Polish and non-Polish customers craving authentic comfort food."
				],
				callout: {
					variant: "tip",
					text: "So whether it's pierogi, placki, or poppy-seed rolls, there's a story worth sharing; and we want to help you tell it."
				}
			},
			{
				id: "join",
				title: "Join the Movement",
				paragraphs: [
					"From Kraków kitchens to UK tables; every story deserves to be told.",
					"If you're a Polish home food creator in the UK, join CribNosh today.",
					"Let's bring the sound, scent, and soul of your cooking to people who miss home; and those discovering it for the first time.",
					"👉 [Join CribNosh and start your journey.]"
				]
			}
		]
	}
];

export function getPostBySlug(slug: string): ByUsPost | undefined {
	return POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
	return POSTS.map((p) => p.slug);
}



