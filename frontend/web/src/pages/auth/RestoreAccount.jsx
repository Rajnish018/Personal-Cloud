import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom"; // Fixed missing imports
import { authApi } from "../../api/authApi";
import { ROUTES } from "../../utils/constants";
import {
    CloudIcon,
    RefreshIcon,
    MailIcon,
    ShieldIcon
} from "../../components/icons/Icons";

const RestoreAccount = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Safely extract the email passed from the login redirect state
    const [email, setEmail] = useState(location.state?.email || "");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleRestore = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            // Call backend restore account API
            await authApi.restoreAccount({ email });
            setSuccess(true);
        } catch (error) {
            // Global Axios interceptor or local alert state handles errors here
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden select-none">

            {/* LEFT SIDEBAR PANEL */}
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

                        {/* Content Header */}
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight text-[#E6F1FB] leading-tight">
                                Welcome back<br />to your cloud.
                            </h2>
                            <p className="text-sm text-[#85B7EB] leading-relaxed max-w-sm">
                                Reversing your account deletion will instantly recover your layout preferences, data structures, and access tiers.
                            </p>
                        </div>
                    </div>

                    {/* Bottom Security Footer Info */}
                    <div className="flex items-center gap-3 text-[#85B7EB] pt-6 border-t border-white/[0.1]">
                        <span className="flex-shrink-0 text-[#85B7EB]"><ShieldIcon /></span>
                        <span className="text-sm font-medium">Verified security protocol tier</span>
                    </div>
                </div>
            </div>

            {/* RIGHT WORKSPACE PANELS */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white">
                <div className="w-full max-w-[400px] flex flex-col">

                    {!success ? (
                        <>
                            {/* Form State */}
                            <div className="mb-8">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                                    Reactivate Account
                                </h1>
                                <p className="text-sm text-gray-500 mt-2">
                                    Your account is currently marked as deleted. Would you like to restore it and recover your assets?
                                </p>
                            </div>

                            <form onSubmit={handleRestore} className="space-y-5">
                                {/* Email Display/Field Container */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-500">
                                        Account Email address
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

                                {/* Submit Action Button */}
                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl text-sm font-semibold bg-[#185FA5] text-white shadow-sm shadow-[#185FA5]/10 hover:bg-[#14508c] hover:shadow transition-all duration-150 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <RefreshIcon size={18} />
                                    )}
                                    <span>{loading ? "Reactivating..." : "Confirm Reactivation"}</span>
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Success State Confirmation Display */
                        <div className="text-center py-4 space-y-6">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <RefreshIcon size={28} />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                    Account Restored!
                                </h1>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                                    Your profile configuration is live again. You can now log back into your workspace layout safely.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(ROUTES.LOGIN || "/login")}
                                className="w-full h-11 flex items-center justify-center rounded-xl text-sm font-semibold bg-[#185FA5] text-white hover:bg-[#14508c] transition-colors shadow-sm"
                            >
                                Return to Sign In
                            </button>
                        </div>
                    )}

                    {/* Back Action Footer */}
                    {!success && (
                        <p className="mt-8 text-center text-sm font-medium text-gray-500">
                            Changed your mind?{" "}
                            <Link
                                to="/login"
                                className="font-semibold text-[#185FA5] hover:text-[#14508c] hover:underline transition-colors"
                            >
                                Back to Sign in
                            </Link>
                        </p>
                    )}

                </div>
            </div>

        </div>
    );
};

export default RestoreAccount;