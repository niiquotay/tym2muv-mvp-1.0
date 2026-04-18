
import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
  variant?: 'default' | '3d' | 'flat';
  color?: string;
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  className = "", 
  size = 24, 
  variant = 'default',
  color,
  ...props 
}) => {
  // Map our internal names to Lucide icon names (PascalCase)
  const iconMap: { [key: string]: keyof typeof LucideIcons } = {
    home: 'Home',
    truck: 'Truck',
    shield: 'Shield',
    alert: 'AlertCircle',
    car: 'Car',
    briefcase: 'Briefcase',
    smartphone: 'Smartphone',
    armchair: 'Armchair',
    shirt: 'Shirt',
    wrench: 'Wrench',
    paw: 'PawPrint',
    sprout: 'Sprout',
    baby: 'Baby',
    graduation: 'GraduationCap',
    coins: 'Coins',
    palette: 'Palette',
    "book-heart": 'BookHeart',
    building: 'Building2',
    box: 'Box',
    search: 'Search',
    plus: 'Plus',
    menu: 'Menu',
    sliders: 'SlidersHorizontal',
    sort: 'ArrowUpDown',
    chevronRight: 'ChevronRight',
    chevronDown: 'ChevronDown',
    mapPin: 'MapPin',
    utensils: 'Utensils',
    heart: 'Heart',
    activity: 'Activity',
    globe: 'Globe',
    gamepad: 'Gamepad2',
    music: 'Music',
    mic: 'Mic',
    camera: 'Camera',
    loader: 'Loader2',
    x: 'X',
    star: 'Star',
    check: 'Check',
    send: 'Send',
    sparkles: 'Sparkles',
    messageCircle: 'MessageCircle',
    user: 'User',
    whatsapp: 'MessageSquare', // Lucide doesn't have WhatsApp, using MessageSquare
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter',
    linkedin: 'Linkedin',
    phone: 'Phone',
    mail: 'Mail',
    clock: 'Clock',
    navigation: 'Navigation',
    package: 'Package',
    map: 'Map',
    external: 'ExternalLink',
    info: 'Info',
    bell: 'Bell',
    settings: 'Settings',
    logout: 'LogOut',
    trash: 'Trash2',
    edit: 'Edit3',
    image: 'Image',
    upload: 'Upload',
    download: 'Download',
    filter: 'Filter',
    share: 'Share2',
    share2: 'Share2',
    arrowLeft: 'ArrowLeft',
    shieldCheck: 'ShieldCheck',
    copy: 'Copy',
    key: 'Key',
    eye: 'Eye',
    eyeOff: 'EyeOff',
    lock: 'Lock',
    unlock: 'Unlock',
    creditCard: 'CreditCard',
    wallet: 'Wallet',
    shoppingCart: 'ShoppingCart',
    tag: 'Tag',
    gift: 'Gift',
    award: 'Award',
    trophy: 'Trophy',
    target: 'Target',
    zap: 'Zap',
    flame: 'Flame',
    leaf: 'Leaf',
    sun: 'Sun',
    moon: 'Moon',
    cloud: 'Cloud',
    wind: 'Wind',
    droplets: 'Droplets',
    thermometer: 'Thermometer',
    video: 'Video',
    bed: 'Bed',
    bath: 'Bath',
    parking: 'ParkingCircle',
    security: 'ShieldCheck',
    maximize: 'Maximize',
    calendar: 'Calendar',
    dollarSign: 'DollarSign',
  };

  const LucideIconComponent = (LucideIcons[iconMap[name] || 'Box'] as LucideIcon);

  if (variant === '3d') {
    return (
      <div className={`relative flex items-center justify-center ${className} icon-3d`} style={{ width: size, height: size }}>
        {/* Shadow Layer - Bottom right offset */}
        <LucideIconComponent 
          size={size} 
          className="absolute text-slate-900/10 translate-y-1.5 translate-x-1 blur-[2px]" 
          strokeWidth={2.5}
        />
        {/* Depth Layer - Subtle thickness */}
        <LucideIconComponent 
          size={size} 
          className="absolute text-slate-400/30 translate-y-[1px] translate-x-[0.5px]" 
          strokeWidth={3}
        />
        {/* Highlight Layer - Top left offset */}
        <LucideIconComponent 
          size={size} 
          className="absolute text-white/40 -translate-y-[0.5px] -translate-x-[0.5px]" 
          strokeWidth={1.5}
        />
        {/* Main Icon */}
        <LucideIconComponent 
          size={size} 
          className="relative text-current drop-shadow-sm" 
          strokeWidth={2}
          {...props}
        />
      </div>
    );
  }

  return (
    <LucideIconComponent 
      size={size} 
      className={className} 
      strokeWidth={2}
      {...props} 
    />
  );
};

export default Icon;
