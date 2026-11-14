import {
  Utensils, Car, ShoppingBag, GraduationCap, Film, HeartPulse, Receipt, Tag, Wallet, Laptop,
  PiggyBank, Briefcase, Building2, Plane, Gift, Coffee, Gamepad2, Music, Dumbbell, Smartphone,
  TrendingUp, Landmark, Shirt, Baby, PawPrint, Wifi, Fuel, Bus, BookOpen,
} from 'lucide-react';

// The database stores the icon NAME (a string). This map turns it into a component.
export const ICONS = {
  Utensils, Car, ShoppingBag, GraduationCap, Film, HeartPulse, Receipt, Tag, Wallet, Laptop,
  PiggyBank, Briefcase, Building2, Plane, Gift, Coffee, Gamepad2, Music, Dumbbell, Smartphone,
  TrendingUp, Landmark, Shirt, Baby, PawPrint, Wifi, Fuel, Bus, BookOpen,
};

export const ICON_NAMES = Object.keys(ICONS);

export const getIcon = (name) => ICONS[name] || Tag;
