
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getListingById, getUserProfile, getListings } from '../services/firebaseService';
import { Listing, User } from '../types';
import Icon from '../components/Icon';
import AdCard from '../components/AdCard';
import ListingCard from '../components/ListingCard';
import { generateListingTitle } from '../utils/listingUtils';
import SafetyDisclaimer from '../components/SafetyDisclaimer';
import { getSymbolFromCode } from '../services/location';

const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Safety States
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [safetyAction, setSafetyAction] = useState<(() => void) | null>(null);
  const [isDeliveryRequested, setIsDeliveryRequested] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchListingData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getListingById(id);
        if (data) {
          setListing(data);
          const userData = await getUserProfile(data.sellerId);
          if (userData) setSeller(userData);

          // Fetch similar listings
          const { listings: similar } = await getListings({
            categoryId: data.categoryId,
            limit: 4,
            countryCode: data.location.split(',').pop()?.trim() || 'GH'
          });
          setSimilarListings(similar.filter(l => l.id !== id));
        }
      } catch (error) {
        console.error("Error fetching listing details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListingData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="alert" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Listing Not Found</h2>
          <p className="text-slate-500 mb-6">The property you're looking for might have been removed or is unavailable.</p>
          <Link to="/" className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600&fit=crop';
  const imagesList = listing.images && listing.images.length > 0 ? listing.images : [listing.imageUrl];
  const images = imagesList.filter(Boolean).length > 0 ? imagesList.filter(Boolean) as string[] : [FALLBACK_IMAGE];
  
  // Extract location parts
  const locationParts = listing.location.split(',').map(p => p.trim());
  const area = locationParts[0] || '';
  const city = locationParts[1] || '';

  const handleChat = () => {
    if (seller) {
      navigate(`/chat?to=${seller.id}`);
    } else {
      navigate('/signin');
    }
  };

  const triggerSafetyCheck = (action: () => void) => {
    setSafetyAction(() => action);
    setIsSafetyOpen(true);
  };

  const handleWhatsApp = () => {
    if (!seller?.socials.phone) return;
    const action = () => {
      const message = `Hi, I'm interested in your property: ${listing?.title}`;
      const url = `https://wa.me/${seller.socials.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    };
    triggerSafetyCheck(action);
  };

  const handleRequestDelivery = () => {
    const action = () => {
      setIsDeliveryRequested(true);
      setToastMessage("Delivery request sent to seller!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    };
    triggerSafetyCheck(action);
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-24">
      {/* Header / Navigation */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <Icon name="arrowLeft" size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
              <Icon name="share2" size={20} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
              <Icon name="heart" size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Section 1: Column 1 */}
          <div className="space-y-6">
            {/* Column 1 Row 1 - Property Name */}
            <div className="space-y-0.5">
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 leading-tight font-display">
                {generateListingTitle({ 
                  bedrooms: listing.bedrooms, 
                  propertyType: listing.propertyType
                })}
              </h1>
            </div>

            {/* Column 1 Row 2 - Price */}
            <div className="py-1.5 border-b border-slate-100">
              <div className="text-lg lg:text-xl font-black text-brand-600 flex items-baseline gap-1">
                <span className="text-xs font-bold">{listing.currency || 'USD'} {getSymbolFromCode(listing.currency || 'USD')}</span>
                {listing.price.toLocaleString()}
                {listing.type === 'Rent' && <span className="text-[10px] font-medium text-slate-400">/mo</span>}
              </div>
              <p className="text-[8px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Icon name="clock" size={9} />
                Posted {listing.datePosted}
              </p>
            </div>

            {/* Column 1 Row 3 & 4 - Location */}
            <div className="grid grid-cols-2 gap-2">
              {/* Row 3 - Location City */}
              <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-brand-600 shadow-sm shrink-0">
                  <Icon name="building" size={12} />
                </div>
                <div className="min-w-0">
                  <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider truncate">City</p>
                  <p className="text-[11px] font-bold text-slate-800 truncate">{city || 'N/A'}</p>
                </div>
              </div>
              {/* Row 4 - Location Area or Suburb */}
              <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-brand-600 shadow-sm shrink-0">
                  <Icon name="mapPin" size={12} />
                </div>
                <div className="min-w-0">
                  <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider truncate">Area / Suburb</p>
                  <p className="text-[11px] font-bold text-slate-800 truncate">{area || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Column 1 Row 5 - Description */}
            <div className="space-y-1.5">
              <p className="text-slate-500 text-[11px] leading-relaxed font-sans whitespace-pre-wrap">
                {listing.description || `This stunning ${listing.propertyType.toLowerCase()} located in the heart of ${listing.location} offers a perfect blend of modern luxury and comfort. Featuring ${listing.bedrooms} spacious bedrooms and ${listing.bathrooms} elegant bathrooms, this property is ideal for those seeking a premium lifestyle.`}
              </p>
            </div>

            {/* Column 1 Row 5.5 - Property Details Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
               {listing.sqft && (
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                     <Icon name="maximize" size={16} />
                   </div>
                   <div>
                     <p className="text-[8px] text-slate-400 font-bold uppercase">Square Feet</p>
                     <p className="text-xs font-bold text-slate-800">{listing.sqft.toLocaleString()} sqft</p>
                   </div>
                 </div>
               )}
               {listing.yearBuilt && (
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                     <Icon name="calendar" size={16} />
                   </div>
                   <div>
                     <p className="text-[8px] text-slate-400 font-bold uppercase">Year Built</p>
                     <p className="text-xs font-bold text-slate-800">{listing.yearBuilt}</p>
                   </div>
                 </div>
               )}
            </div>

            {/* Column 1 Row 6 - All Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {listing.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-md border border-slate-50 bg-white shadow-sm">
                      <div className="w-4 h-4 rounded bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        <Icon name="check" size={8} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 truncate">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seller Card (Agent Details) */}
            <div 
              onClick={() => navigate(`/agent/${seller?.id}`)}
              className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 cursor-pointer hover:bg-slate-100 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={seller?.avatar} 
                    alt={seller?.name} 
                    className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-md group-hover:shadow-lg transition-all"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.name || 'User')}&background=random`;
                    }}
                  />
                  {seller?.verified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-500 text-white rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <Icon name="shieldCheck" size={8} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{seller?.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">{seller?.role}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Icon name="star" size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-black text-slate-700">{seller?.rating}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={handleChat}
                  className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="messageCircle" size={14} />
                  Chat
                </button>
                {seller?.socials.phone && (
                  <button 
                    onClick={() => triggerSafetyCheck(() => window.location.href = `tel:${seller.socials.phone}`)}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="phone" size={14} />
                    Call
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Column 2 */}
          <div className="space-y-6">
            {/* Column 2 Row 1 - Displayed Property Image with Tags */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl group">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  src={images[activeImage]} 
                  alt={listing.title} 
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = FALLBACK_IMAGE;
                  }}
                />
              </AnimatePresence>
              
              {/* Tags on Image */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <div className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-700">
                  For {listing.type}
                </div>
                {listing.isPremium && (
                  <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-[0.1em] shadow-lg flex items-center gap-1 border border-amber-100">
                    <Icon name="award" size={12} className="text-amber-600" />
                    Premium
                  </div>
                )}
                {listing.isVerified && (
                  <div className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] shadow-lg flex items-center gap-1 border border-white/10">
                    <Icon name="shieldCheck" size={12} className="text-brand-600" />
                    Verified
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
                <div className="flex gap-1">
                  <button 
                    onClick={() => setActiveImage((prev) => (prev - 1 + images.length) % images.length)}
                    className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
                  >
                    <Icon name="chevronRight" size={16} className="rotate-180" />
                  </button>
                  <button 
                    onClick={() => setActiveImage((prev) => (prev + 1) % images.length)}
                    className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
                  >
                    <Icon name="chevronRight" size={16} />
                  </button>
                </div>
                <div className="px-3 py-1.5 bg-black/30 backdrop-blur-xl rounded-lg text-white text-[8px] font-black tracking-widest border border-white/10">
                  {activeImage + 1} / {images.length}
                </div>
              </div>
            </div>

            {/* Column 2 Row 2 - Additional Images and videos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Gallery</h3>
                {listing.virtualTourUrl && (
                  <a 
                    href={listing.virtualTourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-bold text-brand-600 flex items-center gap-1 hover:underline"
                  >
                    <Icon name="eye" size={10} />
                    Virtual Tour
                  </a>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border transition-all duration-300 ${
                      activeImage === idx 
                      ? 'border-brand-500 scale-105 shadow-lg' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = FALLBACK_IMAGE;
                      }}
                    />
                  </button>
                ))}
                {listing.videos?.map((video, idx) => (
                  <div key={`video-${idx}`} className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center cursor-pointer group hover:scale-105 transition-all">
                    <Icon name="play" size={20} className="text-white group-hover:scale-110 transition-transform z-10" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Properties Section */}
      <section className="mt-12 pt-8 border-t border-slate-100 relative z-10 bg-white">
        <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Similar Properties</h2>
              <p className="text-slate-500 font-medium mt-1">Handpicked properties you might like in {listing.location}</p>
            </div>
            <Link to="/search" className="px-6 py-3 bg-slate-50 text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-all flex items-center gap-2">
              View All
              <Icon name="chevronRight" size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {similarListings.map(item => (
              <ListingCard key={item.id} listing={item} />
            ))}
            {similarListings.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No similar properties found nearby.</p>
              </div>
            )}
          </div>
        </section>

      {/* Safety Disclaimer Modal */}
      <SafetyDisclaimer 
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
        onConfirm={() => {
          setIsSafetyOpen(false);
          if (safetyAction) safetyAction();
        }}
      />

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] animate-slide-up">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
              <Icon name="check" size={14} />
            </div>
            <span className="text-sm font-bold">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;
