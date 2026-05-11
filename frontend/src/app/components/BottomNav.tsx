import { Home, ShoppingBag, Briefcase, MessageCircle, User, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import { neighborhoodsService } from "../services/storage";
import { useEffect, useState } from "react";
import { Neighborhood } from "../services/types";
import { toast } from "sonner";

export function BottomNav() {
  const location = useLocation();
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);

  useEffect(() => {
    const loadNeighborhood = async () => {
      const data = await neighborhoodsService.getUserNeighborhood();
      setNeighborhood(data);
    };
    loadNeighborhood();
  }, []);

  const isEnabled = (label: string) => {
    if (!neighborhood?.settings) return true; // Default to true if not loaded
    const settings = neighborhood.settings;
    if (label === "Market") return settings.enable_marketplace;
    if (label === "Services") return settings.enable_services;
    return true;
  };

  const navItems = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/marketplace", icon: ShoppingBag, label: "Market" },
    { path: "/services", icon: Briefcase, label: "Services" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/verify-residence", icon: ShieldCheck, label: "Verify" }
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 glass-header border-t border-white/20 z-50 pb-safe"
    >
      <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const enabled = isEnabled(item.label);

          const handleClick = (e: React.MouseEvent) => {
            if (!enabled) {
              e.preventDefault();
              toast.error("Admin will not allow this", {
                description: `The ${item.label} feature is currently disabled by your neighborhood admin.`,
                icon: <ShieldCheck className="w-5 h-5 text-red-500" />
              });
            }
          };

          return (
            <Link
              key={item.path}
              to={enabled ? item.path : "#"}
              onClick={handleClick}
              className={`relative flex flex-col items-center justify-center gap-1.5 px-4 py-2 transition-all duration-300 ${isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`w-6 h-6 transition-all duration-300 ${isActive ? "scale-110 fill-primary/20" : "group-hover:scale-110"} ${!enabled ? "opacity-50" : ""}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "opacity-100" : "opacity-70"} ${!enabled ? "opacity-50" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
