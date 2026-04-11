import { Link, useNavigate } from "react-router";
import { ShieldX, ArrowLeft, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// US1 Business rule: "You do not have permission to access this page."
export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout("user_action");
    navigate("/login");
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>

        {/* Message — exact wording từ US1 business rule */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-2 leading-relaxed">
          You do not have permission to access this page.
        </p>
        {user && (
          <p className="text-sm text-gray-400 mb-8">
            Signed in as <span className="font-medium text-gray-600">{user.email}</span>{" "}
            ({user.role})
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#7C2D12] text-white rounded-xl font-semibold hover:bg-[#6B2510] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-gray-400 hover:text-gray-800 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in as Admin
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-gray-400 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Log In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}