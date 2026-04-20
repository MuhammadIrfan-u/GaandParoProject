import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Home as HomeIcon } from "lucide-react";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/onboarding");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="bg-white rounded-3xl p-6 inline-block mb-6 shadow-2xl">
          <HomeIcon className="w-20 h-20 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-white text-4xl mb-2">NeighborHub</h1>
        <p className="text-indigo-100">Your trusted community</p>
      </div>
    </div>
  );
}
