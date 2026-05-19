import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getListingById, createPayment } from '../services/supabaseService';
import { Listing } from '../types';
import Icon from '../components/Icon';
import { getSymbolFromCode } from '../services/location';
import PaystackPop from '@paystack/inline-js';

const PaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

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

  const handlePaystackPayment = () => {
    if (!listing || !user) return;
    
    const handler = (PaystackPop as any).setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxx',
      email: user.email || 'customer@example.com',
      amount: listing.price * 100, // Amount in kobo/pesewas
      currency: listing.currency || 'GHS',
      ref: `TYM_${Math.floor(Math.random() * 1000000000 + 1)}`,
      callback: async (response: any) => {
        setIsProcessing(true);
        try {
          await createPayment({
            userId: user.id,
            amount: listing.price,
            currency: listing.currency || 'USD',
            status: 'completed',
            createdAt: new Date().toISOString(),
            purpose: 'listing_fee',
            referenceId: listing.id,
            gateway: 'Paystack'
          });
          setIsSuccess(true);
        } catch (error) {
          console.error("Payment failed", error);
          alert("Payment was successful but recording failed. Please contact support.");
        } finally {
          setIsProcessing(false);
        }
      },
      onClose: () => {
        alert("Payment cancelled.");
      }
    });

    handler.openIframe();
  };

  if (!listing) return <div className="p-10 text-center">Loading secure checkout...</div>;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Icon name="check" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">Payment Successful!</h2>
          <p className="text-slate-500 mb-8 font-medium">
            Your payment for <strong className="text-slate-700">{listing.title}</strong> has been confirmed securely.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/80 p-4 font-sans">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl shadow-slate-200/50 max-w-md w-full border border-slate-100 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-all">
            <Icon name="arrowLeft" size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
             <Icon name="lock" size={18} className="text-brand-500" /> Secure Checkout
          </h2>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 relative z-10">
          <div className="flex gap-4 items-center">
            <img src={listing.images?.[0] || listing.imageUrl} alt={listing.title} className="w-16 h-16 rounded-xl object-cover shadow-sm bg-white" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate leading-snug">{listing.title}</h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">{listing.location}</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
            <span className="text-slate-500 font-medium text-sm">Total to Pay</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight font-display">
              {getSymbolFromCode(listing.currency || 'USD')}{listing.price.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <button 
            onClick={handlePaystackPayment}
            disabled={isProcessing}
            className="w-full py-4 mt-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-wait text-sm"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <Icon name="shieldCheck" size={18} />
                Pay with Paystack
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-400 font-medium uppercase tracking-widest">Or</span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowBankDetails(!showBankDetails)}
            className="w-full py-4 bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Icon name="creditCard" size={18} />
            Manual Bank Transfer
          </button>
          
          {showBankDetails && (
            <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50 text-sm text-blue-900">
              <p className="font-bold mb-2">Manual Transfer Details:</p>
              <p className="mb-1"><strong>Bank:</strong> Guaranty Trust Bank</p>
              <p className="mb-1"><strong>Account Name:</strong> Tym2Muv LLC</p>
              <p className="mb-1"><strong>Account No:</strong> 0123456789</p>
              <p className="mt-3 text-xs text-blue-700">Please include reference: <strong>TYM-{listing.id.substring(0, 5).toUpperCase()}</strong></p>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-100 text-center relative z-10">
           <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
             <Icon name="shieldCheck" size={14} className="text-emerald-500" />
             Payments secured by Paystack
           </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
