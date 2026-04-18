import { Category } from './types';

export const APP_NAME = "tym2muv Real Estate";

export const CATEGORIES: Category[] = [
  {
    id: 'residential-rent',
    name: 'Residential for Rent',
    description: 'Find your next home with our extensive list of apartments, houses, and condos for rent.',
    iconName: 'home',
    color: 'bg-blue-100 text-blue-600',
    subcategories: [
      { id: 'apartments-rent', name: 'Apartments' },
      { id: 'houses-rent', name: 'Houses' },
      { id: 'condos-rent', name: 'Condos & Townhouses' },
      { id: 'roommates', name: 'Roommates & Shared' },
      { id: 'short-stay', name: 'Short Stay / Airbnb' },
    ]
  },
  {
    id: 'residential-sale',
    name: 'Residential for Sale',
    description: 'Invest in your future. Browse houses, apartments, and land for sale.',
    iconName: 'building',
    color: 'bg-emerald-100 text-emerald-600',
    subcategories: [
      { id: 'apartments-sale', name: 'Apartments' },
      { id: 'houses-sale', name: 'Houses' },
      { id: 'condos-sale', name: 'Condos & Townhouses' },
      { id: 'land-sale', name: 'Land & Plots' },
    ]
  },
  {
    id: 'commercial',
    name: 'Commercial',
    description: 'Grow your business with the right space. Offices, retail, and warehouses.',
    iconName: 'briefcase',
    color: 'bg-amber-100 text-amber-600',
    subcategories: [
      { id: 'offices', name: 'Offices' },
      { id: 'retail', name: 'Retail Spaces' },
      { id: 'warehouses', name: 'Warehouses & Industrial' },
      { id: 'commercial-land', name: 'Commercial Land' },
    ]
  },
  {
    id: 'services',
    name: 'Property Services',
    description: 'Professional services for property owners and seekers.',
    iconName: 'wrench',
    color: 'bg-purple-100 text-purple-600',
    subcategories: [
      { id: 'agents', name: 'Real Estate Agents' },
      { id: 'legal', name: 'Legal & Conveyancing' },
      { id: 'moving', name: 'Moving & Logistics' },
      { id: 'interior', name: 'Interior Design' },
      { id: 'valuation', name: 'Property Valuation' },
    ]
  },
];
