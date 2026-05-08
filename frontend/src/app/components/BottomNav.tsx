import { Home, ShoppingBag, Briefcase, MessageCircle, User, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router";
import { motion } from "motion/react";

export function BottomNav() {
  const location = useLocation();

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

          return (
            <Link
              key={item.path}
              to={item.path}
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
              <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? "scale-110 fill-primary/20" : "group-hover:scale-110"}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "opacity-100" : "opacity-70"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
