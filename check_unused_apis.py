import os

def check_unused_apis():
    with open('all_api_routes.txt', 'r') as f:
        all_routes = [line.strip() for line in f if line.strip()]
    
    with open('unique_api_paths.txt', 'r') as f:
        # Normalize: remove quotes and leading slash if needed, but unique_api_paths has quotes
        used_paths = {line.strip().strip('"').strip("'") for line in f if line.strip()}
    
    unused = []
    used = []
    
    for route_file in all_routes:
        # Convert apps/web/app/api/customer/cart/route.ts -> /api/customer/cart
        path = route_file.replace('apps/web/app/api', '/api').replace('/route.ts', '')
        if not path.startswith('/api'):
            path = '/api' # for apps/web/app/api/route.ts
            
        # Handle dynamic segments like [order_id] -> match literally or with patterns
        # For now, literal match is a good start
        if path in used_paths:
            used.append((route_file, path))
        else:
            # Check if it matches a pattern in used_paths if usedPaths has patterns
            # But unique_api_paths has the literal strings found in code
            unused.append((route_file, path))
            
    print(f"Total routes found: {len(all_routes)}")
    print(f"Used routes (mentioned in code): {len(used)}")
    print(f"Unused routes (NOT mentioned in code): {len(unused)}")
    
    print("\n--- UNUSED ROUTES ---")
    for route_file, path in unused:
        print(f"{path} ({route_file})")

if __name__ == "__main__":
    check_unused_apis()
