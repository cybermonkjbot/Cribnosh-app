import { v } from 'convex/values';
import { query } from '../_generated/server';

/**
 * Get all vehicle types
 */
export const getVehicleTypes = query({
  args: {},
  handler: async (ctx) => {
    // Return common UK vehicle types
    return [
      { id: 'car', name: 'Car' },
      { id: 'motorcycle', name: 'Motorcycle' },
      { id: 'bicycle', name: 'Bicycle' },
      { id: 'scooter', name: 'Scooter' },
      { id: 'van', name: 'Van' },
      { id: 'truck', name: 'Truck' },
    ];
  },
});

/**
 * Get vehicle models by type
 */
export const getVehicleModels = query({
  args: {
    vehicleType: v.string(),
  },
  handler: async (ctx, args) => {
    // Return common vehicle models based on type
    const modelsByType: Record<string, Array<{ id: string; name: string }>> = {
      car: [
        { id: 'toyota-corolla', name: 'Toyota Corolla' },
        { id: 'honda-civic', name: 'Honda Civic' },
        { id: 'ford-focus', name: 'Ford Focus' },
        { id: 'volkswagen-golf', name: 'Volkswagen Golf' },
        { id: 'bmw-3-series', name: 'BMW 3 Series' },
        { id: 'mercedes-c-class', name: 'Mercedes-Benz C-Class' },
        { id: 'audi-a3', name: 'Audi A3' },
        { id: 'nissan-leaf', name: 'Nissan Leaf' },
        { id: 'tesla-model-3', name: 'Tesla Model 3' },
        { id: 'other', name: 'Other' },
      ],
      motorcycle: [
        { id: 'honda-cb500f', name: 'Honda CB500F' },
        { id: 'yamaha-mt-07', name: 'Yamaha MT-07' },
        { id: 'kawasaki-ninja-650', name: 'Kawasaki Ninja 650' },
        { id: 'triumph-tiger', name: 'Triumph Tiger' },
        { id: 'bmw-gs', name: 'BMW GS Series' },
        { id: 'ducati-monster', name: 'Ducati Monster' },
        { id: 'other', name: 'Other' },
      ],
      bicycle: [
        { id: 'road-bike', name: 'Road Bike' },
        { id: 'mountain-bike', name: 'Mountain Bike' },
        { id: 'hybrid-bike', name: 'Hybrid Bike' },
        { id: 'electric-bike', name: 'Electric Bike' },
        { id: 'cargo-bike', name: 'Cargo Bike' },
        { id: 'other', name: 'Other' },
      ],
      scooter: [
        { id: 'vespa', name: 'Vespa' },
        { id: 'piaggio', name: 'Piaggio' },
        { id: 'yamaha-scooter', name: 'Yamaha Scooter' },
        { id: 'honda-scooter', name: 'Honda Scooter' },
        { id: 'electric-scooter', name: 'Electric Scooter' },
        { id: 'other', name: 'Other' },
      ],
      van: [
        { id: 'ford-transit', name: 'Ford Transit' },
        { id: 'mercedes-sprinter', name: 'Mercedes-Benz Sprinter' },
        { id: 'volkswagen-crafter', name: 'Volkswagen Crafter' },
        { id: 'renault-master', name: 'Renault Master' },
        { id: 'peugeot-boxer', name: 'Peugeot Boxer' },
        { id: 'other', name: 'Other' },
      ],
      truck: [
        { id: 'ford-ranger', name: 'Ford Ranger' },
        { id: 'toyota-hilux', name: 'Toyota Hilux' },
        { id: 'nissan-navara', name: 'Nissan Navara' },
        { id: 'other', name: 'Other' },
      ],
    };

    return modelsByType[args.vehicleType.toLowerCase()] || [];
  },
});

/**
 * Get vehicle years (last 30 years)
 */
export const getVehicleYears = query({
  args: {},
  handler: async (ctx) => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 30; year--) {
      years.push({ id: year.toString(), name: year.toString() });
    }
    return years;
  },
});

