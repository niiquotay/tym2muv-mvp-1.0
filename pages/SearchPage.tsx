
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import AdCard from '../components/AdCard';
import { getListings } from '../services/firebaseService';
import Icon from '../components/Icon';
import { useLocation as useAppLocation } from '../context/LocationContext';

const ITEMS_PER_BATCH = 24; 

const SearchPage: React.FC = () => {
  const { location: userLocation } = useAppLocation();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const query = searchParams.get('q') || '';
  
  // Data State
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);

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
  const mixedContent = useMemo(() => {
    const result: { type: 'listing' | 'ad', data: any }[] = [];
    let adCount = 0;
    
    // Interval for "after every 2 rows" (assuming ~5 columns per row, so 10 items)
    const interval = 10;
    
    listings.forEach((listing, index) => {
      result.push({ type: 'listing' as const, data: listing });
      
      // After every 10 listings, insert an ad
      if ((index + 1) % interval === 0 && adCount < 10) { 
        result.push({ type: 'ad' as const, data: ads[adCount % ads.length] });
        adCount++;
      }
    });
    
    return result;
  }, [listings, ads]);

  // Reset and load initial batch when query or country changes
  useEffect(() => {
    const fetchInitialListings = async () => {
      setIsLoading(true);
      try {
        const { listings: fetchedListings, total } = await getListings({
          page: 1,
          limit: ITEMS_PER_BATCH,
          countryCode: userLocation.countryCode,
          categoryId: query || undefined // Using query as category for now if it matches
        });
        setListings(fetchedListings);
        setTotalItems(total);
        setPage(1);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialListings();
  }, [query, userLocation.countryCode]);

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
            {query ? `Search Results for "${query}"` : 'All Properties'}
          </h1>
          <p className="text-slate-500">Find your perfect home from our verified listings.</p>
        </div>

        {/* Real Estate Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Icon name="bed" size={16} className="text-slate-400" />
            <select className="bg-transparent text-sm font-medium text-slate-700 outline-none">
              <option>Beds</option>
              <option>1+ Beds</option>
              <option>2+ Beds</option>
              <option>3+ Beds</option>
              <option>4+ Beds</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Icon name="bath" size={16} className="text-slate-400" />
            <select className="bg-transparent text-sm font-medium text-slate-700 outline-none">
              <option>Baths</option>
              <option>1+ Baths</option>
              <option>2+ Baths</option>
              <option>3+ Baths</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Icon name="home" size={16} className="text-slate-400" />
            <select className="bg-transparent text-sm font-medium text-slate-700 outline-none">
              <option>Property Type</option>
              <option>Apartment</option>
              <option>House</option>
              <option>Condo</option>
              <option>Villa</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Icon name="dollarSign" size={16} className="text-slate-400" />
            <select className="bg-transparent text-sm font-medium text-slate-700 outline-none">
              <option>Price Range</option>
              <option>$0 - $1,000</option>
              <option>$1,000 - $5,000</option>
              <option>$5,000 - $10,000</option>
              <option>$10,000+</option>
            </select>
          </div>
          <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors">
            <Icon name="search" size={16} />
            Apply Filters
          </button>
        </div>
        
        {/* Listings Section */}
        <div className="flex justify-between items-center mb-4 px-2 pt-2">
           <p className="text-slate-500 font-medium text-sm">Showing {displayListings.length} results</p>
        </div>
           
        {/* Grid */}
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
