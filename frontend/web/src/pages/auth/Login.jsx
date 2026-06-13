import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  CloudIcon, 
  ShieldIcon, 
  RefreshIcon, 
  ShareIcon, 
  MailIcon, 
  LockIcon, 
  EyeIcon, 
  EyeOffIcon, 
  LoginIcon, 
  GoogleIcon, 
  MicrosoftIcon 
} from "../../components/icons/Icons";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem("token", "demo-token");
      navigate("/", { replace: true });
    }, 800);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden select-none">
      
      {/* LEFT SIDEBAR PANEL - Hidden on mobile/tablets, scales up on Desktop views */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-[#0C447C] p-10 flex-shrink-0 relative">
        {/* Subtle background abstract shapes to build visual weight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        
        <div className="flex flex-col gap-10 relative z-10 h-full justify-between">
          <div className="space-y-12">
            {/* Logo Row */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#185FA5] text-white shadow-md shadow-[#185FA5]/30">
                <CloudIcon size={22} color="#85B7EB" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#E6F1FB]">
                NimbusDrive
              </span>
            </div>

            {/* Hero Heading */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-[#E6F1FB] leading-tight">
                Your files,<br />everywhere you are.
              </h2>
              <p className="text-sm text-[#85B7EB] leading-relaxed max-w-sm">
                Secure, fast cloud storage trusted by teams and individuals worldwide.
              </p>
            </div>

            {/* Quick Micro Analytics Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#185FA5]/60 border border-white/[0.08] backdrop-blur-sm rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xl font-bold text-[#E6F1FB]">99.9%</span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#85B7EB]">Uptime SLA</span>
              </div>
              <div className="bg-[#185FA5]/60 border border-white/[0.08] backdrop-blur-sm rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xl font-bold text-[#E6F1FB]">256-bit</span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#85B7EB]">Encryption</span>
              </div>
            </div>
          </div>

          {/* Core Feature Value Checklist */}
          <div className="space-y-4 pt-6 border-t border-white/[0.1]">
            {[
              { icon: <ShieldIcon />, label: "End-to-end encrypted storage" },
              { icon: <RefreshIcon />, label: "Auto-sync seamlessly across devices" },
              { icon: <ShareIcon />,  label: "Easy team workspace collaboration" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-[#85B7EB]">
                <span className="flex-shrink-0 text-[#85B7EB]">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT WORKSPACE FORM PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white">
        <div className="w-full max-w-[400px] flex flex-col">
          
          {/* Header Description */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Sign in to access your cloud asset manager.
            </p>
          </div>

          {/* Form Layer */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field Container */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-500">
                Email address
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#185FA5] transition-colors pointer-events-none flex">
                  <MailIcon />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all duration-150 focus:border-[#185FA5] focus:bg-white focus:ring-4 focus:ring-[#185FA5]/10"
                />
              </div>
            </div>

            {/* Password Field Container */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-500">
                Password
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#185FA5] transition-colors pointer-events-none flex">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 pl-11 pr-11 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all duration-150 focus:border-[#185FA5] focus:bg-white focus:ring-4 focus:ring-[#185FA5]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex items-center justify-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Option Checkbox & Recovery Links */}
            <div className="flex items-center justify-between pt-1 text-sm">
              <label className="flex items-center gap-2 font-medium text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#185FA5] h-4 w-4 rounded border-gray-300 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <Link 
                to="/forgot-password" 
                className="font-semibold text-[#185FA5] hover:text-[#14508c] hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Primary Submit CTA Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl text-sm font-semibold bg-[#185FA5] text-white shadow-sm shadow-[#185FA5]/10 hover:bg-[#14508c] hover:shadow transition-all duration-150 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LoginIcon />
              )}
              <span>{isLoading ? "Signing in..." : "Sign in"}</span>
            </button>
          </form>

          {/* Contextual Separation Line Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-medium text-gray-400 whitespace-nowrap uppercase tracking-wider">
              or continue with
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Social Authenticator Rows */}
          <div className="flex gap-3">
            <SSOButton label="Google" icon={<GoogleIcon />} />
            <SSOButton label="Microsoft" icon={<MicrosoftIcon />} />
          </div>

          {/* Account Creation Footer Footer */}
          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            Don&apos;t have an account?{" "}
            <Link 
              to="/register" 
              className="font-semibold text-[#185FA5] hover:text-[#14508c] hover:underline transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

// Extracted, Clean Single Social Single Button Component Instance
const SSOButton = ({ label, icon }) => {
  return (
    <button
      type="button"
      className="flex-1 h-11 flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 transition-all duration-150 hover:bg-gray-50/80 hover:border-gray-300 hover:text-gray-900 active:scale-[0.99]"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export default Login;