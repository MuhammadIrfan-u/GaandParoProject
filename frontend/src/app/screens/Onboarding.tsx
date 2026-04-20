import { useState } from "react";
import { useNavigate } from "react-router";
import { Home as HomeIcon, Users, Shield, MessageCircle } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: HomeIcon,
      title: "Welcome to NeighborHub",
      description: "Connect with your neighbors and build a stronger, safer community together.",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: Shield,
      title: "Verified & Secure",
      description: "All members are verified to ensure a trusted and safe neighborhood network.",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: Users,
      title: "Stay Connected",
      description: "Share updates, organize events, and help each other in your community.",
      color: "from-purple-500 to-pink-600",
    },
    {
      icon: MessageCircle,
      title: "Local Marketplace",
      description: "Buy, sell, and trade with verified neighbors. Find local services you can trust.",
      color: "from-orange-500 to-red-600",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/login");
    }
  };

  const handleSkip = () => {
    navigate("/login");
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-indigo-600 to-purple-600 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className={`bg-gradient-to-br ${slide.color} rounded-3xl p-8 mb-8 shadow-2xl`}>
            <Icon className="w-24 h-24 text-white mx-auto" strokeWidth={1.5} />
          </div>

          <h1 className="text-white text-3xl text-center mb-4">{slide.title}</h1>
          <p className="text-indigo-100 text-center text-lg leading-relaxed">{slide.description}</p>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center gap-2 mb-6">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="flex-1 text-white hover:bg-white/20"
            >
              Skip
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-white text-primary hover:bg-white/90"
            >
              {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}