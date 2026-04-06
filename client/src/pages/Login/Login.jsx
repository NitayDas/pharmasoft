import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Provider/UserProvider";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const { user, login, loading, error, setError } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await login(username, password);
      navigate("/dashboard", { replace: true });
    } catch {}
  };

  return (
    <div className="min-h-screen flex bg-sky-50">
      
      {/* Left Side */}
      <div className="hidden md:flex w-1/2 bg-teal-700 text-white flex-col justify-center px-16">
        <h1 className="text-5xl font-bold leading-tight">
          Smart tools for <span className="text-yellow-300">modern</span> pharmacies
        </h1>

        <p className="mt-6 text-lg text-sky-100">
          Manage inventory, prescriptions, billing and reporting in one place.
        </p>

        <div className="mt-8 space-y-3">
          <div>✅ Real-time stock tracking</div>
          <div>✅ Prescription management</div>
          <div>✅ Sales & billing reports</div>
          <div>✅ Role-based access control</div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex w-full md:w-1/2 justify-center items-center px-6">
        <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-teal-700">Welcome Back</h2>
            <p className="text-gray-500 mt-2">Sign in to your pharmacy dashboard</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-600 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Username */}
            <div>
              <label className="block text-sm mb-1 font-medium">Username</label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm mb-1 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 text-sm text-gray-500"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Demo credentials */}
            <div className="bg-sky-50 p-4 rounded-lg text-sm">
              <p><b>Username:</b> admin</p>
              <p><b>Password:</b> Admin@1234</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-lg font-medium transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Accounts are assigned by system administrator
          </p>
        </div>
      </div>
    </div>
  );
}