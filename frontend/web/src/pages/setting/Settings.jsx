import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  Check,
  Clock,
  Eye,
  EyeOff,
  HardDrive,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  User,
  X,
  Fingerprint,
  Monitor,
  Edit2
} from "lucide-react";
import {
  useChangePassword,
  useDeleteAccount,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from "../../hooks/useUsers";
import { formatBytes, formatDate } from "../../utils/drive";
import { userApi } from "../../api";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const allowedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
const maxAvatarSize = 5 * 1024 * 1024;

const getAvatarUrl = (user) =>
  user?.avatar?.secureUrl || user?.avatarUrl || user?.photoUrl || "";

const getInitials = (name = "Nimbus User") =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

const Settings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { data, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const user = data?.user || {};
  const storage = data?.storage || {};
  const storageTotal = storage.total || user.storageLimit || 15 * 1024 ** 3;
  const storageUsed = storage.used || user.storageUsed || 0;
  const storageRemaining = storage.remaining ?? Math.max(storageTotal - storageUsed, 0);
  const storagePercent = storageTotal ? Math.min((storageUsed / storageTotal) * 100, 100) : 0;
  const avatarUrl = getAvatarUrl(user);
  console.log("User data:", user);

  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [deleteText, setDeleteText] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [activeTab, setActiveTab] = useState("profile");
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 1, device: "Chrome on MacOS", location: "New York, USA", current: true, time: "Active now" },
    { id: 2, device: "Safari on iPhone", location: "New York, USA", current: false, time: "2 hours ago" },
    { id: 3, device: "Firefox on Windows", location: "Boston, USA", current: false, time: "3 days ago" },
  ]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setProfileForm({ name: user.name || "", email: user.email || "" });
  }, [user.email, user.name]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    await updateProfile.mutateAsync(profileForm);
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedAvatarTypes.includes(file.type)) {
      toast.error("Please choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > maxAvatarSize) {
      toast.error("Profile photo must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    try {
      await uploadAvatar.mutateAsync({ file });
    } catch (error) {
      console.error("Profile photo upload failed:", error);
    } finally {
      event.target.value = "";
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(emptyPasswordForm);
      setPasswordSuccess(true);
      window.setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError("Current password is incorrect.");
    }
  };

  const handleDeleteAccount = async () => {
    await deleteAccount.mutateAsync();
    navigate("/login", { replace: true });
  };

  const getStorageStatus = () => {
    if (storagePercent < 50) return { text: "Healthy", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (storagePercent < 80) return { text: "Moderate", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    return { text: "Critical", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];


  const status = getStorageStatus();

  const handleVerifyEmail = async () => {
    try {
      const response = await userApi.verifyEmailSend();
      console.log("Email verification response:", response);
      toast.success("OTP sent to your email")
      navigate("/settings/verify-email")
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to send verification email."
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 antialiased selection:bg-[#185FA5]/10 selection:text-[#185FA5]">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#185FA5] via-[#1a6bb8] to-[#0d3a66] p-8 sm:p-10 shadow-2xl shadow-[#185FA5]/20">
          <div className="absolute right-0 top-0 h-72 w-72 -translate-y-1/3 translate-x-1/4 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-0 h-56 w-56 -translate-x-1/4 translate-y-1/3 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.name || "Profile"}
                      className="h-24 w-24 rounded-2xl border-4 border-white/20 object-cover shadow-xl"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 text-3xl font-bold text-white shadow-xl backdrop-blur-sm">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                    className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-[#185FA5] text-white shadow-lg transition hover:scale-110 hover:bg-[#14508c] active:scale-95 disabled:opacity-60"
                  >
                    <Camera size={18} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                  <ShieldCheck size={13} />
                  {user.role || "Personal account"}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {user.name || "Account Settings"}
                </h1>
                <p className="mt-2 text-base text-white/70">
                  Manage your profile, security, and workspace preferences.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
                    <Mail size={15} />
                    <span className="truncate">{user.email || "No email"}</span>
                  </span>
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${user.isEmailVerified ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-400/20 text-amber-200"
                    }`}>
                    <BadgeCheck size={15} />
                    {user.isEmailVerified ? "Verified" : "Pending verification"}
                  </span>
                  {!user.isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#185FA5] shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Mail size={15} />
                      Verify Email

                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Storage Widget */}
            <div className="shrink-0 rounded-2xl bg-white/10 p-5 backdrop-blur-sm sm:w-72">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Storage used</p>
                  <p className="mt-1 text-2xl font-bold text-white">{formatBytes(storageUsed)}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                  <HardDrive size={22} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium text-white/70 mb-1.5">
                  <span>{Math.round(storagePercent)}% used</span>
                  <span>{formatBytes(storageRemaining)} free</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full bg-white/90 transition-all duration-700`} style={{ width: `${storagePercent}%` }} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.bg} ${status.color} ${status.border}`}>
                  {status.text}
                </span>
                <span className="text-[11px] text-white/60">{formatBytes(storageTotal)} total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive
                  ? "bg-[#185FA5] text-white shadow-md shadow-[#185FA5]/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          <div className="space-y-6">

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleProfileSubmit(e);
                  // Assuming successful submission flips editing back to false
                  // You can also handle this inside your mutate onSuccess callback
                  setIsEditing(false);
                }} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md">

                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#185FA5]/10 text-[#185FA5]">
                          <User size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">Profile Details</h2>
                          <p className="text-sm text-slate-500">Update your identity across the workspace</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">

                        {/* Edit / Pencil Icon Button */}
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                          >
                            <Edit2 size={16} className="text-slate-500" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Full name" icon={User} description="Your display name">
                        <input
                          value={profileForm.name}
                          onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                          required
                          disabled={!isEditing}
                          className={`w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300 transition-opacity ${!isEditing ? "opacity-70 cursor-not-allowed" : ""}`}
                          placeholder="John Doe"
                        />
                      </Field>

                      <Field label="Email address" icon={Mail} description="Used for notifications">
                        <input
                          value={profileForm.email}
                          onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                          required
                          type="email"
                          disabled={!isEditing}
                          className={`w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300 transition-opacity ${!isEditing ? "opacity-70 cursor-not-allowed" : ""}`}
                          placeholder="john@example.com"
                        />
                      </Field>
                    </div>

                    {/* Form Action Controls */}
                    {isEditing && (
                      <div className="mt-6 flex justify-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <button
                          type="button"
                          disabled={updateProfile.isPending}
                          onClick={() => {
                            setIsEditing(false);
                            // Optional: Reset form to original values here if needed
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={updateProfile.isPending}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#185FA5] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#185FA5]/20 transition hover:bg-[#14508c] hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
                        >
                          <Save size={16} />
                          {updateProfile.isPending ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Password Form */}
                <form onSubmit={handlePasswordSubmit} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/10 text-slate-900">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Password & Security</h2>
                        <p className="text-sm text-slate-500">Change your password and secure your account</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    <PasswordField label="Current password" icon={Lock} value={passwordForm.currentPassword}
                      onChange={(v) => setPasswordForm((p) => ({ ...p, currentPassword: v }))}
                      show={showPassword.current} onToggle={() => setShowPassword((p) => ({ ...p, current: !p.current }))} placeholder="Enter your current password" />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <PasswordField label="New password" icon={KeyRound} value={passwordForm.newPassword}
                        onChange={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))}
                        show={showPassword.new} onToggle={() => setShowPassword((p) => ({ ...p, new: !p.new }))} placeholder="Min 8 characters" />
                      <PasswordField label="Confirm password" icon={KeyRound} value={passwordForm.confirmPassword}
                        onChange={(v) => setPasswordForm((p) => ({ ...p, confirmPassword: v }))}
                        show={showPassword.confirm} onToggle={() => setShowPassword((p) => ({ ...p, confirm: !p.confirm }))} placeholder="Repeat new password" />
                    </div>
                    {passwordForm.newPassword && (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                          <span>Password strength:</span>
                          <span className={`font-bold ${passwordForm.newPassword.length >= 12 ? "text-emerald-600" : passwordForm.newPassword.length >= 8 ? "text-amber-600" : "text-rose-600"}`}>
                            {passwordForm.newPassword.length >= 12 ? "Strong" : passwordForm.newPassword.length >= 8 ? "Medium" : "Weak"}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div className={`h-full rounded-full transition-all duration-300 ${passwordForm.newPassword.length >= 12 ? "bg-emerald-500 w-full" : passwordForm.newPassword.length >= 8 ? "bg-amber-500 w-2/3" : "bg-rose-500 w-1/3"}`} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {["8+ characters", "Uppercase", "Number", "Special char"].map((req, i) => {
                            const checks = [
                              passwordForm.newPassword.length >= 8,
                              /[A-Z]/.test(passwordForm.newPassword),
                              /[0-9]/.test(passwordForm.newPassword),
                              /[^A-Za-z0-9]/.test(passwordForm.newPassword),
                            ];
                            const passed = checks[i];
                            return (
                              <span key={req} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${passed ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                                {passed ? <Check size={10} /> : <X size={10} />}
                                {req}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {passwordError && (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle size={16} />
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 animate-in fade-in slide-in-from-top-2">
                        <Check size={16} />
                        Password updated successfully!
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button type="submit" disabled={changePassword.isPending}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] disabled:opacity-60">
                        <ShieldCheck size={16} />
                        {changePassword.isPending ? "Updating..." : "Update password"}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Two-Factor Auth */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Fingerprint size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h2>
                        <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${twoFactor ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                          <Shield size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Authenticator App</p>
                          <p className="text-xs text-slate-500">Use an app like Google Authenticator or Authy</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setTwoFactor(!twoFactor)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${twoFactor ? "bg-emerald-500" : "bg-slate-200"}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${twoFactor ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                    {twoFactor && (
                      <div className="mt-4 rounded-xl bg-emerald-50 p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                          <Check size={16} />
                          Two-factor authentication is enabled
                        </div>
                        <p className="mt-1 text-xs text-emerald-600">Your account is now protected with an additional security layer.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <div className="overflow-hidden rounded-2xl border border-rose-200/80 bg-white shadow-sm">
                <div className="border-b border-rose-100 bg-rose-50/50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Delete Account</h2>
                      <p className="text-sm text-slate-500">This action cannot be undone</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="rounded-xl bg-rose-50/50 p-4 mb-6 border border-rose-100">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                        <Trash2 size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-rose-900">Warning</p>
                        <p className="mt-1 text-sm text-rose-700 leading-relaxed">
                          Deleting your account will permanently remove all your data, files, folders, shared links, and settings. This action is irreversible and cannot be recovered.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Type <span className="font-mono text-rose-600">DELETE</span> to confirm
                      </label>
                      <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
                        placeholder="DELETE" />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500/20" />
                      <span className="text-xs font-semibold text-slate-600">I understand that all my data will be permanently deleted</span>
                    </div>
                    <button type="button" onClick={handleDeleteAccount}
                      disabled={deleteText !== "DELETE" || deleteAccount.isPending}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">
                      {deleteAccount.isPending ? <X size={16} /> : <Trash2 size={16} />}
                      {deleteAccount.isPending ? "Deleting account..." : "Permanently delete account"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {/* Account Status Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-[#185FA5] to-[#14508c] px-6 py-5">
                <div className="flex items-center gap-2 text-white/80">
                  <Sparkles size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Account Status</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{user.accountType || "Free Plan"}</p>
                <p className="mt-1 text-sm text-white/70">{formatBytes(storageTotal)} storage included</p>
              </div>
              <div className="p-5 space-y-3">
                <SnapshotRow label="Member since" value={formatDate(user.joinedAt || user.createdAt)} icon={Clock} />
                <SnapshotRow label="Storage limit" value={formatBytes(storageTotal)} icon={HardDrive} />
                <SnapshotRow label="Profile photo" value={avatarUrl ? "Uploaded" : "Initials avatar"} icon={Camera} />
                <SnapshotRow label="Email status" value={user.isEmailVerified ? "Verified" : "Pending"} icon={BadgeCheck} />
                <SnapshotRow label="2FA Status" value={twoFactor ? "Enabled" : "Disabled"} icon={Shield} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, icon: Icon, description, children }) => (
  <label className="block rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 transition-all duration-200 focus-within:border-[#185FA5] focus-within:bg-white focus-within:shadow-lg focus-within:shadow-[#185FA5]/5 focus-within:ring-1 focus-within:ring-[#185FA5]/20">
    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
      <Icon size={14} />
      {label}
    </span>
    {description && <span className="mt-0.5 block text-[11px] text-slate-400">{description}</span>}
    <div className="mt-2">{children}</div>
  </label>
);

const PasswordField = ({ label, icon: Icon, value, onChange, show, onToggle, placeholder }) => (
  <label className="block rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 transition-all duration-200 focus-within:border-[#185FA5] focus-within:bg-white focus-within:shadow-lg focus-within:shadow-[#185FA5]/5 focus-within:ring-1 focus-within:ring-[#185FA5]/20">
    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
      <Icon size={14} />
      {label}
    </span>
    <div className="mt-2 flex items-center gap-2">
      <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} required
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300" placeholder={placeholder} />
      <button type="button" onClick={onToggle} className="shrink-0 text-slate-400 transition hover:text-slate-600">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </label>
);

const ToggleRow = ({ icon: Icon, label, description, checked, onChange }) => (
  <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50/50">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${checked ? "bg-[#185FA5]" : "bg-slate-200"}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

const SnapshotRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-slate-400" />
      <span className="text-xs font-bold uppercase text-slate-400">{label}</span>
    </div>
    <span className="truncate text-sm font-bold text-slate-800">{value || "-"}</span>
  </div>
);


export default Settings;
