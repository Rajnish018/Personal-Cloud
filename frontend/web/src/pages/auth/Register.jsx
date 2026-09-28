import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../utils/constants";
import CloudLoader from "../../components/loadingScreen/CloudLoader";
import {
	  CloudIcon,
	  UserIcon,
	  MailIcon,
	  LockIcon,
	  EyeIcon,
	  EyeOffIcon,
	  CheckIcon,
	  XIcon,
	  RocketIcon,
	  StorageIcon,
	  DevicesIcon,
	  ShareIcon,
	  HistoryIcon,
	  LightningIcon,
	  GoogleIcon,
	  MicrosoftIcon,
} from '../../components/icons/Icons';

const Register = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    
    if (score <= 1) return { label: "Weak", color: "bg-red-500", text: "text-red-500", width: "w-1/4" };
    if (score === 2) return { label: "Fair", color: "bg-amber-500", text: "text-amber-500", width: "w-2/4" };
    if (score === 3) return { label: "Good", color: "bg-emerald-400", text: "text-emerald-400", width: "w-3/4" };
    return { label: "Strong", color: "bg-emerald-600", text: "text-emerald-600", width: "w-full" };
  };

  const strength = getPasswordStrength(form.password);

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.email.includes("@")) errs.email = "Enter a valid email";
    if (form.password.length < 8) errs.password = "At least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    if (!agreed) errs.agreed = "You must agree to continue";
    return errs;
  };

  useEffect(() => {
    if (!isSubmitting) return;

    const timer = window.setTimeout(() => {
      navigate(ROUTES.HOME, { replace: true });
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [isSubmitting, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsSubmitting(true);

    try {
      await register({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <CloudLoader onComplete={() => {}} />;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-x-hidden select-none">
      
      {/* LEFT SIDEBAR PANEL - Hidden on mobile/tablets, scales up on Desktop views */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-[#0C447C] p-10 flex-shrink-0 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        
        <div className="flex flex-col gap-10 relative z-10 h-full justify-between">
          <div className="space-y-12">
            {/* Logo Row */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#185FA5] text-white shadow-md shadow-[#185FA5]/30">
                <CloudIcon size={22} color="#85B7EB" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#E6F1FB]">
                Personal Cloud
              </span>
            </div>

            {/* Hero Heading */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-[#E6F1FB] leading-tight">
                Start storing<br />for free today.
              </h2>
              <p className="text-sm text-[#85B7EB] leading-relaxed max-w-sm">
                Join over 2 million users who trust Personal Cloud to keep files safe, synced, and accessible anywhere.
              </p>
            </div>

            {/* Plan dynamic card element */}
            <div className="bg-[#185FA5]/60 border border-white/[0.08] backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-3.5 shadow-xl">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#85B7EB] mb-1">
                Free plan includes
              </span>
              {[
                { icon: <StorageIcon />, text: "15 GB free cloud storage" },
                { icon: <DevicesIcon />, text: "Sync up to 3 devices concurrently" },
                { icon: <ShareIcon />,   text: "Share secured files & folders" },
                { icon: <HistoryIcon />, text: "30-day granular version history" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-[#E6F1FB]">
                  <span className="flex-shrink-0 text-[#85B7EB]">{icon}</span>
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Upgrade Notice */}
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#85B7EB] pt-6 border-t border-white/[0.1]">
            <LightningIcon />
            <span>Upgrade anytime for unlimited core enterprise tier space</span>
          </div>
        </div>
      </div>

      {/* RIGHT FORM CANVAS */}
      <div className="relative flex-1 flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        {/* {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
              <div className="w-10 h-10 rounded-full border-4 border-white border-t-[#185FA5] border-t-4 border-[#185FA5] animate-spin" />
              <span className="text-sm font-semibold text-[#185FA5]">Creating account…</span>
            </div>
          </div>
        )} */}
        <div className="w-full max-w-[420px] flex flex-col py-6">
          
          {/* Header Texts */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Free forever. No credit card required.
            </p>
          </div>

          {/* Core Register Form Entry */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Split row for names */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-500">First name</label>
                <div className="relative group">
                  <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none flex ${errors.firstName ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#185FA5]'}`}>
                    <UserIcon />
                  </span>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={update("firstName")}
                    placeholder="Jane"
                    className={`w-full h-10 pl-10 pr-4 rounded-xl border text-sm font-medium outline-none transition-all duration-150 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-4 ${
                      errors.firstName 
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' 
                        : 'border-gray-200 focus:border-[#185FA5] focus:ring-[#185FA5]/10'
                    }`}
                  />
                </div>
                {errors.firstName && <p className="text-xs font-semibold text-red-500 px-1 mt-1">{errors.firstName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-500">Last name</label>
                <div className="relative group">
                  <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none flex ${errors.lastName ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#185FA5]'}`}>
                    <UserIcon />
                  </span>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={update("lastName")}
                    placeholder="Doe"
                    className={`w-full h-10 pl-10 pr-4 rounded-xl border text-sm font-medium outline-none transition-all duration-150 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-4 ${
                      errors.lastName 
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' 
                        : 'border-gray-200 focus:border-[#185FA5] focus:ring-[#185FA5]/10'
                    }`}
                  />
                </div>
                {errors.lastName && <p className="text-xs font-semibold text-red-500 px-1 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email Field Wrapper */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-500">Email address</label>
              <div className="relative group">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none flex ${errors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#185FA5]'}`}>
                  <MailIcon />
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                  className={`w-full h-10 pl-10 pr-4 rounded-xl border text-sm font-medium outline-none transition-all duration-150 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-4 ${
                    errors.email 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' 
                      : 'border-gray-200 focus:border-[#185FA5] focus:ring-[#185FA5]/10'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs font-semibold text-red-500 px-1 mt-1">{errors.email}</p>}
            </div>

            {/* Password Entry Field Container */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-500">Password</label>
              <div className="relative group">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none flex ${errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#185FA5]'}`}>
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Min. 8 characters"
                  className={`w-full h-10 pl-10 pr-10 rounded-xl border text-sm font-medium outline-none transition-all duration-150 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-4 ${
                    errors.password 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' 
                      : 'border-gray-200 focus:border-[#185FA5] focus:ring-[#185FA5]/10'
                  }`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex items-center justify-center"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              
              {/* Dynamic inline Password Strength Indicator Track Bar */}
              {form.password && (
                <div className="flex items-center gap-2.5 pt-1.5 px-0.5">
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ease-out ${strength.width} ${strength.color}`} />
                  </div>
                  <span className={`text-[10px] font-bold tracking-wider uppercase min-w-[42px] text-right ${strength.text}`}>
                    {strength.label}
                  </span>
                </div>
              )}
              {errors.password && <p className="text-xs font-semibold text-red-500 px-1 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password Field Wrapper Container */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-500">Confirm password</label>
              <div className="relative group">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none flex ${errors.confirmPassword ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#185FA5]'}`}>
                  <LockIcon />
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  placeholder="Re-enter password"
                  className={`w-full h-10 pl-10 pr-10 rounded-xl border text-sm font-medium outline-none transition-all duration-150 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-4 ${
                    errors.confirmPassword 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' 
                      : 'border-gray-200 focus:border-[#185FA5] focus:ring-[#185FA5]/10'
                  }`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex items-center justify-center"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Instant password structural match text banner validation */}
              {form.confirmPassword && (
                <div className="flex items-center gap-1.5 pt-1 px-0.5">
                  {form.password === form.confirmPassword ? (
                    <>
                      <CheckIcon color="#10B981" />
                      <span className="text-xs font-semibold text-emerald-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XIcon color="#EF4444" />
                      <span className="text-xs font-semibold text-red-500">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
              {errors.confirmPassword && !form.confirmPassword && <p className="text-xs font-semibold text-red-500 px-1 mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Terms of Service Acceptance Field Option Row */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-sm font-medium text-gray-600 cursor-pointer select-none leading-relaxed">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (errors.agreed) setErrors((prev) => ({ ...prev, agreed: null }));
                  }}
                  className="accent-[#185FA5] h-4 w-4 rounded border-gray-300 mt-0.5 cursor-pointer flex-shrink-0"
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" className="text-[#185FA5] font-semibold hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-[#185FA5] font-semibold hover:underline">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreed && <p className="text-xs font-semibold text-red-500 px-1 mt-1">{errors.agreed}</p>}
            </div>

            {/* Form submission action trigger button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl text-sm font-semibold bg-[#185FA5] text-white shadow-sm shadow-[#185FA5]/10 hover:bg-[#14508c] hover:shadow transition-all duration-150 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none pt-1"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <RocketIcon />
              )}
              <span>{isSubmitting ? "Creating account..." : "Create free account"}</span>
            </button>
          </form>

          {/* Separation line element placeholder block */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-medium text-gray-400 whitespace-nowrap uppercase tracking-wider">
              or sign up with
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* OAuth Third party providers buttons stack row */}
          <div className="flex gap-3">
            <SSOButton label="Google" icon={<GoogleIcon />} />
            <SSOButton label="Microsoft" icon={<MicrosoftIcon />} />
          </div>

          {/* Account Authentication Alternative Route Footer Footer */}
          <p className="mt-6 text-center text-sm font-medium text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#185FA5] hover:text-[#14508c] hover:underline transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

// Isolated SSO instance button child layout definition block 
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



export default Register;
