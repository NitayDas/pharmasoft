import { Search, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../Provider/UserProvider";

export default function Header() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (user) {
      await logout();
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="w-full border-b bg-sky-200 shadow-sm">
      {/* Top Section */}
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link to="/" className="flex flex-col leading-tight cursor-pointer">
          <h1 className="text-2xl font-bold text-red-700">Star Medical</h1>
          <span className="text-xs text-gray-600">For better health</span>
        </Link>

        {/* Search */}
        <div className="flex items-center border rounded overflow-hidden w-[40%] bg-white">
          <input
            type="text"
            placeholder="Search medicines..."
            className="w-full px-4 py-2 outline-none"
          />
          <button className="bg-teal-700 px-4 py-2 text-white hover:bg-teal-800">
            <Search size={20} />
          </button>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-5">
          
          {/* Cart */}
          <div className="relative cursor-pointer text-gray-700">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              0
            </span>
          </div>

          {/* User name optional */}
          {user && (
            <span className="text-sm font-medium text-gray-700">
              {user.username}
            </span>
          )}

          {/* Auth Button */}
          <button
            onClick={handleAuth}
            className="bg-teal-700 text-white px-4 py-2 rounded hover:bg-teal-800 transition"
          >
            {user ? "Logout" : "Sign In"}
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="flex gap-6 px-6 py-3 bg-white text-sm font-medium text-gray-700 border-t">
        <Link to="/" className="hover:text-teal-700">Home</Link>
        <Link to="/medicine" className="hover:text-teal-700">Medicine</Link>
        <Link to="/healthcare" className="hover:text-teal-700">Healthcare</Link>
        <Link to="/beauty" className="hover:text-teal-700">Beauty</Link>
        <Link to="/supplement" className="hover:text-teal-700">Supplement</Link>
      </nav>
    </header>
  );
}