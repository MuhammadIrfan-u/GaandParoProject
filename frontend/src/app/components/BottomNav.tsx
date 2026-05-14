import { Home, ShoppingBag, Briefcase, MessageCircle, User, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import { neighborhoodsService, authService } from "../services/storage";
import { supabase } from "../services/supabaseClient";
import { useEffect, useState } from "react";
import { Neighborhood } from "../services/types";
import { toast } from "sonner";

export function BottomNav() {
  const location = useLocation();
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    const loadNeighborhood = async () => {
      const data = await neighborhoodsService.getUserNeighborhood();
      setNeighborhood(data);
    };
    loadNeighborhood();
  }, []);

  // Re-run when route or neighborhood changes so auth is hydrated after login and Superadmin check uses a numeric user_id.
  useEffect(() => {
    let cancelled = false;
    const uid = authService.getCurrentUser()?.id ?? localStorage.getItem("user_id");
    if (!uid) {
      setIsSuperadmin(false);
      return;
    }
    const numericId = parseInt(String(uid).replace(/\D/g, ""), 10);
    if (Number.isNaN(numericId)) {
      setIsSuperadmin(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase.from("Superadmin").select("id").eq("user_id", numericId).maybeSingle();
        if (!cancelled) setIsSuperadmin(!!data);
      } catch {
        if (!cancelled) setIsSuperadmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, neighborhood?.id]);

  const isEnabled = (label: string) => {
    const user = authService.getCurrentUser();
    const servicesBypass = isSuperadmin || user?.isAdmin === true;
    if (label === "Services" && servicesBypass) return true;

    if (!neighborhood?.settings) return true;
    const settings = neighborhood.settings;
    // Treat missing flags as enabled; only explicit false disables (matches DB defaults).
    if (label === "Market") return settings.enable_marketplace !== false;
    if (label === "Services") return settings.enable_services !== false;
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
