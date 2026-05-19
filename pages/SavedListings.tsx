import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getListingById } from '../services/supabaseService';
import ListingCard from '../components/ListingCard';
import Icon from '../components/Icon';
import { Listing } from '../types';

const SavedListings: React.FC = () => {
  const { user } = useAuth();
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedListings = async () => {
      if (!user || !user.savedListings || user.savedListings.length === 0) {
        setSavedListings([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const fetchPromises = user.savedListings.map(id => getListingById(id));
        const results = await Promise.all(fetchPromises);
        setSavedListings(results.filter((l): l is Listing => l !== null));
      } catch (error) {
        console.error("Error fetching saved listings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedListings();
  }, [user?.savedListings]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
         <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-4">
            <Icon name="heart" size={32} />
         </div>
         <h2 className="text-xl font-bold text-slate-800 mb-2">Sign in to view saved listings</h2>
         <p className="text-sm text-slate-500 max-w-xs mb-6">Log in to save your favorite properties and access them across all your devices.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 font-display">Saved Listings</h1>
        <p className="text-slate-500 mt-2">Properties you've favorited</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(idx => (
            <ListingCard key={idx} isLoading={true} />
          ))}
        </div>
      ) : savedListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedListings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-slate-200 rounded-3xl">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Icon name="heart" size={32} />
           </div>
           <h2 className="text-xl font-bold text-slate-800 mb-2">No saved listings yet</h2>
           <p className="text-sm text-slate-500 max-w-xs">Tap the heart icon on any property to save it here for later.</p>
        </div>
      )}
    </div>
  );
};

export default SavedListings;
