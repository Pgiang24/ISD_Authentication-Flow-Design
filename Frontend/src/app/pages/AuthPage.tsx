import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Check, Mountain, Leaf, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "register";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters",    pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number",           pass: /[0-9]/.test(password) },
    { label: "Special character",pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < strength ? colors[strength - 1] : "bg-gray-200"}`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span key={c.label} className={`text-xs flex items-center gap-1 ${c.pass ? "text-green-600" : "text-gray-400"}`}>
              <Check className="w-3 h-3" />
              {c.label}
            </span>
          ))}
        </div>
        {strength > 0 && (
          <span className={`text-xs font-medium ${strength === 4 ? "text-green-600" : strength === 3 ? "text-yellow-600" : strength === 2 ? "text-orange-500" : "text-red-500"}`}>
            {labels[strength - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode]               = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [rememberMe, setRememberMe]     = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      const stored = localStorage.getItem("ale_farms_user");
      const user = stored ? JSON.parse(stored) : null;
      if (user?.role === "admin") navigate("/admin");
      else navigate("/");
    } else {
      setError(result.error || "Login failed.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all required fields."); return;
    }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const result = await register(form.name, form.email, form.password, form.phone);
    setLoading(false);
    if (result.success) navigate("/");
    else setError(result.error || "Registration failed.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1592513388667-c01b5a7b7dc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
          alt="Northwest Mountains"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C0A00]/80 via-[#7C2D12]/60 to-[#2D6A4F]/50" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl">🏔️</span>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">ALE Farm's</div>
              <div className="text-sm text-white/70">Premium Smoked Meats</div>
            </div>
          </div>
          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              From Our Farm<br />
              <span className="text-[#D4A853]">To Your Table</span>
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-sm">
              Handcrafted smoked meats using traditional methods, sourced from our Northwest mountain farm. Every bite tells a story.
            </p>
            <div className="flex flex-col gap-4 pt-4">
              {[
                { icon: Mountain, text: "Farm-raised in the Northwest mountains" },
                { icon: Leaf,     text: "100% natural, no preservatives or MSG" },
                { icon: Shield,   text: "VSATTP certified & food safety compliant" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4A853]/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#D4A853]" />
                  </div>
                  <span className="text-white/80 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-white/40 text-sm">© 2026 ALE Farm's. All rights reserved.</div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#FAF7F2] p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-[#7C2D12] flex items-center justify-center">
              <span className="text-lg">🏔️</span>
            </div>
            <div>
              <div className="text-xl font-bold text-[#7C2D12]">ALE Farm's</div>
              <div className="text-xs text-gray-500">Premium Smoked Meats</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Tabs */}
            <div className="flex rounded-xl bg-[#FAF7F2] p-1 mb-8">
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "bg-white shadow text-[#7C2D12]" : "text-gray-500 hover:text-gray-700"}`}
              >
                Log In
              </button>
              <button
                onClick={() => { setMode("register"); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "register" ? "bg-white shadow text-[#7C2D12]" : "text-gray-500 hover:text-gray-700"}`}
              >
                Sign Up
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5" autoComplete="on">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                  <p className="text-gray-500 text-sm mt-1">Sign in to your ALE Farm's account</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 ${error && !form.email ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={set("password")}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className={`w-full px-4 py-3 pr-12 rounded-xl border bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 ${error && !form.password ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#7C2D12]"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <button type="button" className="text-sm text-[#7C2D12] hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#7C2D12] hover:bg-[#6B2510] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {loading ? "Signing in..." : "Log In"}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setMode("register")} className="text-[#7C2D12] font-semibold hover:underline">
                    Sign up
                  </button>
                </p>

                <div className="pt-2 rounded-xl bg-[#D4A853]/10 border border-[#D4A853]/30 p-3 text-xs text-gray-600">
                  <strong>Demo:</strong> customer@alefarms.com / password123 &nbsp;|&nbsp; admin@alefarms.com / admin123
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5" autoComplete="on">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
                  <p className="text-gray-500 text-sm mt-1">Join ALE Farm's community today</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Nguyen Van A"
                      autoComplete="name"
                      className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 ${error && !form.name ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={set("phone")}
                        placeholder="09xx xxx xxx"
                        autoComplete="tel"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={set("password")}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <PasswordStrength password={form.password} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={set("confirmPassword")}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`w-full px-4 py-3 pr-12 rounded-xl border bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 ${form.confirmPassword && form.confirmPassword !== form.password ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {form.confirmPassword && form.confirmPassword !== form.password && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#7C2D12] hover:bg-[#6B2510] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {loading ? "Creating account..." : "Create Account"}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setMode("login")} className="text-[#7C2D12] font-semibold hover:underline">
                    Log in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}