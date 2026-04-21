import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getListingById, createPayment } from '../services/firebaseService';
import { Listing } from '../types';
import Icon from '../components/Icon';
import { getSymbolFromCode } from '../services/location';

const PaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    const fetchListing = async () => {
      if (id) {
        const data = await getListingById(id);
        setListing(data);
      }
    };
    fetchListing();
  }, [id, user, navigate]);

  const handleSimulatePayment = async () => {
    if (!listing || !user) return;
    setIsProcessing(true);
    
    // Simulate real network request to Stripe / Backend
    setTimeout(async () => {
      try {
        await createPayment({
          userId: user.id,
          amount: listing.price,
          currency: listing.currency || 'USD',
          status: 'completed',
          createdAt: new Date().toISOString(),
          purpose: 'listing_fee',
          referenceId: listing.id,
          gateway: 'Credit Card'
        });
        setIsSuccess(true);
      } catch (error) {
        console.error("Payment failed", error);
        alert("Payment failed. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  if (!listing) return <div className="p-10 text-center">Loading property...</div>;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="check" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
          <p className="text-slate-500 mb-8">
            Your payment for <strong>{listing.title}</strong> has been confirmed.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-all">
            <Icon name="arrowLeft" size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Secure Checkout</h2>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
          <div className="flex gap-4 items-center">
            <img src={listing.images?.[0] || listing.imageUrl} alt={listing.title} className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate">{listing.title}</h3>
              <p className="text-sm text-slate-500 truncate">{listing.location}</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
            <span className="text-slate-500 font-medium">Total to Pay</span>
            <span className="text-xl font-black text-brand-600">
              {getSymbolFromCode(listing.currency || 'USD')}{listing.price.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-4 border-2 border-brand-500 bg-brand-50/50 rounded-xl flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded shadow-sm flex items-center justify-center text-brand-600">
                <Icon name="creditCard" size={16} />
              </div>
              <span className="font-bold text-slate-700">Credit / Debit Card</span>
            </div>
            <div className="w-5 h-5 rounded-full border-4 border-brand-500 bg-white"></div>
          </div>
          <div className="p-4 border border-slate-200 hover:border-slate-300 bg-white rounded-xl flex items-center justify-between cursor-pointer transition-all opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded border border-slate-100 flex items-center justify-center text-slate-400">
                <span className="font-bold text-xs uppercase">Pay</span>
              </div>
              <span className="font-bold text-slate-500">Mobile Money (Coming Soon)</span>
            </div>
            <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
          </div>
        </div>

        <button 
          onClick={handleSimulatePayment}
          disabled={isProcessing}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              Pay {getSymbolFromCode(listing.currency || 'USD')}{listing.price.toLocaleString()}
              <Icon name="lock" size={16} className="text-slate-400 group-hover:text-white transition-colors" />
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
          <Icon name="shieldCheck" size={12} />
          Payments are securely simulated for {user?.name}
        </p>
      </div>
    </div>
  );
}

export default PaymentPage;
