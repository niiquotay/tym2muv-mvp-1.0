
import React, { useMemo, useState, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import ListingCard from '../components/ListingCard';
import AdCard from '../components/AdCard';
import { getListings } from '../services/firebaseService';
import Icon from '../components/Icon';
import { Link } from 'react-router-dom';
import { useLocation as useAppLocation } from '../context/LocationContext';

const ITEMS_PER_PAGE = 24; // Reduced for better performance with live data

const Home: React.FC = () => {
  const { location: userLocation } = useAppLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      try {
        const { listings: fetchedListings, total } = await getListings({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          countryCode: userLocation.countryCode
        });
        setListings(fetchedListings);
        setTotalItems(total);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
    
    // Scroll to top of the trending section or page
    const trendingSection = document.getElementById('trending-section');
    if (trendingSection && currentPage > 1) {
      trendingSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, userLocation.countryCode]);

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
      },
      {
        type: 'tall' as const,
        title: 'Verified Agents',
        description: `Work with top-rated agents in ${countryName} for a safe transaction.`,
        cta: 'Find Agent',
        image: `https://picsum.photos/seed/${userLocation.countryCode}3/400/800`,
        color: 'from-blue-600 to-indigo-600'
      },
      {
        type: 'tall' as const,
        title: 'Post Your Ad',
        description: `Selling in ${countryName}? List your property for free and reach millions.`,
        cta: 'Post Now',
        image: `https://picsum.photos/seed/${userLocation.countryCode}4/400/800`,
        color: 'from-orange-600 to-amber-600'
      }
    ];
  }, [userLocation]);

  // Mix listings and ads
  const mixedContent = useMemo(() => {
    const result: { type: 'listing' | 'ad', data: any }[] = [];
    let adCount = 0;
    
    // Place first ad on the first row (index 0)
    if (ads.length > 0) {
      result.push({ type: 'ad' as const, data: ads[adCount % ads.length] });
      adCount++;
    }

    // Interval for "after every 2 rows" (assuming ~8 columns per row, so 16 items)
    const interval = 16;
    
    listings.forEach((listing, index) => {
      result.push({ type: 'listing' as const, data: listing });
      
      // After every 16 listings, insert an ad
      if ((index + 1) % interval === 0 && adCount < ads.length) {
        result.push({ type: 'ad' as const, data: ads[adCount % ads.length] });
        adCount++;
      }
    });
    
    return result;
  }, [listings, ads]);

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
            currentPage === i
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-110'
              : 'bg-white text-slate-600 hover:bg-brand-50 border border-slate-200'
          }`}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2 mt-12">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-600 border border-slate-200 disabled:opacity-50 hover:bg-brand-50 transition-all"
        >
          <Icon name="chevronRight" size={20} className="rotate-180" />
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-600 border border-slate-200 disabled:opacity-50 hover:bg-brand-50 transition-all"
        >
          <Icon name="chevronRight" size={20} />
        </button>
      </div>
    );
  };

  return (
    <div className="pt-0 pb-8">
      <div className="container mx-auto px-4 space-y-4 animate-slide-up relative z-10">
         
          {/* Trending Listings */}
          <section id="trending-section">
            <div className="glass-card rounded-[2rem] p-6 md:p-8 shadow-sm">
              {isLoading ? (
                <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-slate-100 rounded-2xl animate-pulse"></div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="search" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No listings found</h3>
                  <p className="text-slate-500">Try adjusting your filters or location.</p>
                </div>
              ) : (
                <>
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

                  {/* Pagination */}
                  {totalPages > 1 && renderPagination()}
                </>
              )}
            </div>
          </section>
      </div>
    </div>
  );
};

export default Home;
