
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import AdCard from '../components/AdCard';
import { getListings } from '../services/supabaseService';
import Icon from '../components/Icon';
import { useLocation as useAppLocation } from '../context/LocationContext';
import { useMixedContent } from '../hooks/useMixedContent';
import ErrorBanner from '../components/ErrorBanner';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import useDebounce from '../hooks/useDebounce';

const ITEMS_PER_BATCH = 24; 

const SearchPage: React.FC = () => {
  const { location: userLocation } = useAppLocation();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const query = searchParams.get('q') || '';
  
  // Data State
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);

  const [localFilters, setLocalFilters] = useState({
    priceRange: searchParams.get('minPrice') ? (searchParams.get('maxPrice') ? `$${searchParams.get('minPrice')} - $${searchParams.get('maxPrice')}` : '$10,000+') : 'Price Range',
    bedrooms: searchParams.get('bedrooms') ? `${searchParams.get('bedrooms')}+ Beds` : 'Beds',
    bathrooms: searchParams.get('bathrooms') ? `${searchParams.get('bathrooms')}+ Baths` : 'Baths',
    propertyType: searchParams.get('propertyType') || 'Property Type'
  });

  const debouncedFilters = useDebounce(localFilters, 500);

  useEffect(() => {
    // Sync debounced filters to URL
    const params = new URLSearchParams(location.search);
    let changed = false;
    
    // Bedrooms
    if (debouncedFilters.bedrooms && debouncedFilters.bedrooms !== 'Beds') {
      const val = debouncedFilters.bedrooms.replace('+', '').replace(' Beds', '');
      if (params.get('bedrooms') !== val) { params.set('bedrooms', val); changed = true; }
    } else if (params.has('bedrooms')) {
      params.delete('bedrooms'); changed = true;
    }
    
    // Bathrooms
    if (debouncedFilters.bathrooms && debouncedFilters.bathrooms !== 'Baths') {
      const val = debouncedFilters.bathrooms.replace('+', '').replace(' Baths', '');
      if (params.get('bathrooms') !== val) { params.set('bathrooms', val); changed = true; }
    } else if (params.has('bathrooms')) {
      params.delete('bathrooms'); changed = true;
    }

    // Property Type
    if (debouncedFilters.propertyType && debouncedFilters.propertyType !== 'Property Type') {
      if (params.get('propertyType') !== debouncedFilters.propertyType) { 
        params.set('propertyType', debouncedFilters.propertyType); 
        changed = true; 
      }
    } else if (params.has('propertyType')) {
      params.delete('propertyType'); changed = true;
    }

    // Price Range
    if (debouncedFilters.priceRange && debouncedFilters.priceRange !== 'Price Range') {
      if (debouncedFilters.priceRange === '$10,000+') {
         if (params.get('minPrice') !== '10000' || params.has('maxPrice')) {
           params.set('minPrice', '10000');
           params.delete('maxPrice');
           changed = true;
         }
      } else {
         const parts = debouncedFilters.priceRange.replace(/\$/g, '').replace(/,/g, '').split(' - ');
         if (parts.length === 2 && (params.get('minPrice') !== parts[0] || params.get('maxPrice') !== parts[1])) {
            params.set('minPrice', parts[0]);
            params.set('maxPrice', parts[1]);
            changed = true;
         }
      }
    } else if (params.has('minPrice') || params.has('maxPrice')) {
      params.delete('minPrice');
      params.delete('maxPrice');
      changed = true;
    }

    if (query && !params.has('location') && !['real-estate', 'jobs', 'vehicles', 'services'].includes(query.toLowerCase())) {
        if (params.get('location') !== query) {
            params.set('location', query);
            changed = true;
        }
    }

    if (changed) {
      navigate(`/search?${params.toString()}`, { replace: true });
    }
  }, [debouncedFilters]);

  const handleFilterChange = (field: keyof typeof localFilters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  // Define country-specific ads
  const ads = useMemo(() => {
    const countryName = userLocation.country;
    return [
      {
        type: 'tall' as const,
        title: `Real Estate in ${countryName}`,
        description: `Explore the best properties across ${countryName}. From luxury villas to affordable apartments.`,
        cta: 'Explore Now',
        image: `https://picsum.photos/seed/${userLocation.countryCode}1/400/800`,
        color: 'from-brand-600 to-indigo-600'
      },
      {
        type: 'tall' as const,
        title: `${userLocation.currency} Mortgage Deals`,
        description: `Get the best mortgage rates in ${userLocation.country} today.`,
        cta: 'Check Rates',
        image: `https://picsum.photos/seed/${userLocation.countryCode}2/400/800`,
        color: 'from-emerald-600 to-teal-600'
      }
    ];
  }, [userLocation]);

  // Mix listings and ads
  const mixedContent = useMixedContent(listings, ads, 10, 10, false);

  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Reset and load initial batch when query or country changes
  useEffect(() => {
    const fetchInitialListings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const initialFilters: any = {
          page: 1,
          limit: ITEMS_PER_BATCH,
          countryCode: userLocation.countryCode,
        };

        if (query) {
          // If query looks like a category id, use it, else use search term (location for simplicity)
          if (['real-estate', 'jobs', 'vehicles', 'services'].includes(query.toLowerCase())) {
            initialFilters.categoryId = query;
          } else {
             initialFilters.location = query; // Simple search proxy
          }
        }
        
        // Take extra parameters from URL if using Smart Search Input
        if (searchParams.has('location')) initialFilters.location = searchParams.get('location');
        if (searchParams.has('propertyType')) initialFilters.propertyType = searchParams.get('propertyType');
        if (searchParams.has('minPrice')) initialFilters.minPrice = searchParams.get('minPrice');
        if (searchParams.has('maxPrice')) initialFilters.maxPrice = searchParams.get('maxPrice');
        if (searchParams.has('bedrooms')) initialFilters.bedrooms = searchParams.get('bedrooms');

        const { listings: fetchedListings, total } = await getListings(initialFilters);
        setListings(fetchedListings);
        setTotalItems(total);
        setPage(1);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError('Failed to load listings. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialListings();
  }, [query, userLocation.countryCode, location.search, retryKey]);

  const handleLoadMore = async () => {
    if (isLoading || listings.length >= totalItems) return;
    
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const { listings: nextBatch } = await getListings({
        page: nextPage,
        limit: ITEMS_PER_BATCH,
        countryCode: userLocation.countryCode,
        categoryId: query || undefined
      });
      setListings(prev => [...prev, ...nextBatch]);
      setPage(nextPage);
    } catch (error) {
      console.error("Error loading more listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayListings = listings; 

  return (
    <div className="bg-brand-50 min-h-screen pb-8 pt-4">
      
      <div className="container mx-auto px-4">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {query ? `Search Results for "${query}"` : searchParams.has('location') ? `Properties in "${searchParams.get('location')}"` : 'All Properties'}
          </h1>
          <p className="text-slate-500">Find your perfect home from our verified listings.</p>
        </div>

        {/* Popular Search Trends */}
        <div className="w-full flex items-center gap-2 overflow-x-auto pb-4 mb-2 scrollbar-none">
             <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">Popular:</span>
             {['East Legon', 'Cantonments', '2 Bedroom', 'Apartment', 'Under $2k'].map(trend => (
               <button 
                 key={trend}
                 onClick={() => {
                   const newSearchParams = new URLSearchParams(searchParams);
                   newSearchParams.set('q', trend);
                   navigate(`${location.pathname}?${newSearchParams.toString()}`);
                 }}
                 className="shrink-0 px-3 py-1.5 bg-brand-100 text-brand-700 rounded-full text-xs font-bold hover:bg-brand-200 transition-colors"
               >
                 {trend}
               </button>
             ))}
        </div>

        {/* Real Estate Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Icon name="bed" size={16} className="text-slate-400" />
            <select 
               value={localFilters.bedrooms} 
               onChange={e => handleFilterChange('bedrooms', e.target.value)}
               className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            >
              <option>Beds</option>
              <option>1+ Beds</option>
              <option>2+ Beds</option>
              <option>3+ Beds</option>
              <option>4+ Beds</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Icon name="bath" size={16} className="text-slate-400" />
            <select 
              value={localFilters.bathrooms}
              onChange={e => handleFilterChange('bathrooms', e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            >
              <option>Baths</option>
              <option>1+ Baths</option>
              <option>2+ Baths</option>
              <option>3+ Baths</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Icon name="home" size={16} className="text-slate-400" />
            <select 
               value={localFilters.propertyType}
               onChange={e => handleFilterChange('propertyType', e.target.value)}
               className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            >
              <option>Property Type</option>
              <option>Apartment</option>
              <option>House</option>
              <option>Condo</option>
              <option>Villa</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Icon name="dollarSign" size={16} className="text-slate-400" />
            <select 
               value={localFilters.priceRange}
               onChange={e => handleFilterChange('priceRange', e.target.value)}
               className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            >
              <option>Price Range</option>
              <option>$0 - $1,000</option>
              <option>$1,000 - $5,000</option>
              <option>$5,000 - $10,000</option>
              <option>$10,000+</option>
            </select>
          </div>
        </div>
        
        {/* Listings Section */}
        <div className="flex justify-between items-center mb-4 px-2 pt-2">
           <p className="text-slate-500 font-medium text-sm">Showing {displayListings.length} results</p>
        </div>
           
         {error ? (
           <ErrorBanner message={error} onRetry={() => setRetryKey(k => k + 1)} />
        ) : isLoading && page === 1 ? (
          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
             {Array.from({ length: 12 }).map((_, idx) => (
                <SkeletonCard key={`skeleton-${idx}`} />
             ))}
          </div>
        ) : displayListings.length === 0 ? (
          <EmptyState 
            title="No properties found" 
            message="We couldn't find any properties matching your search criteria. Try adjusting your filters or search terms."
            actionLabel="Clear Filters"
            onAction={() => navigate('/search')}
          />
        ) : (
          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
             {mixedContent.map((item, idx) => (
                item.type === 'listing' ? (
                  <ListingCard key={item.data.id} listing={item.data} />
                ) : (
                  <AdCard 
                    key={`ad-${idx}`} 
                    type={item.data.type}
                    title={item.data.title}
                    description={item.data.description}
                    cta={item.data.cta}
                    image={item.data.image}
                    color={item.data.color}
                  />
                )
             ))}
          </div>
        )}
           
        {/* Load More Button */}
        <div className="mt-12 flex justify-center">
           <button 
             onClick={handleLoadMore}
             disabled={isLoading}
             className="flex items-center gap-3 px-8 py-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed group active:scale-95"
           >
             {isLoading ? (
               <>
                 <span className="w-5 h-5 border-2 border-slate-300 border-t-brand-600 rounded-full animate-spin"></span>
                 Loading more items...
               </>
             ) : (
               <>
                 Load More Results
                 <Icon name="chevronRight" size={14} className="rotate-90 group-hover:translate-y-0.5 transition-transform" />
               </>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
