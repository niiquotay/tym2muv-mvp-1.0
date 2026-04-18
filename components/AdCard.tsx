
import React from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';

interface AdCardProps {
  type: 'standard' | 'tall';
  title: string;
  description: string;
  cta: string;
  image: string;
  color?: string;
}

const AdCard: React.FC<AdCardProps> = ({ type, title, description, cta, image, color = 'from-brand-600 to-fuchsia-600' }) => {
  const isTall = type === 'tall';

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative overflow-hidden rounded-2xl flex flex-col ${isTall ? 'row-span-2 h-full' : 'min-h-[160px] sm:h-full'} group shadow-sm border border-slate-100`}
    >
      {/* Background Image with Overlay */}
      <div className={`absolute inset-0 z-0`}>
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-80 mix-blend-multiply`}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-3 sm:p-4 mt-auto flex flex-col h-full justify-end">
        <div className="mb-1 sm:mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider border border-white/30">
            <Icon name="star" size={10} className="fill-white" />
            Sponsored
          </span>
        </div>
        
        <h3 className={`font-black text-white leading-tight mb-1 sm:mb-2 ${isTall ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>
          {title}
        </h3>
        
        <p className="text-white/80 text-[10px] sm:text-xs line-clamp-1 sm:line-clamp-2 mb-3 sm:mb-4">
          {description}
        </p>
        
        <button className="w-full py-1.5 sm:py-2 bg-white text-slate-900 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-brand-50 transition-colors flex items-center justify-center gap-2 group/btn">
          {cta}
          <Icon name="chevronRight" size={14} className="sm:w-4 sm:h-4 transition-transform group-hover/btn:translate-x-1" />
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-2 right-2 z-10">
        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
          <Icon name="info" size={14} className="text-white/60" />
        </div>
      </div>
    </motion.div>
  );
};

export default AdCard;
