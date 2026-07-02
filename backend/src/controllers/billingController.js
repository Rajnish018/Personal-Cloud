import User from "../models/user.model.js";

const GB = 1024 * 1024 * 1024;

const plans = [
  {
    id: "free",
    name: "Free",
    storageGB: 5,
    storageLimit: 5 * GB,
    priceCents: 0,
    currency: "USD",
    interval: "month",
    description: "Basic personal storage for getting started.",
  },
  {
    id: "pro",
    name: "Pro",
    storageGB: 100,
    storageLimit: 100 * GB,
    priceCents: 2900,
    currency: "USD",
    interval: "month",
    description: "Larger workspace storage for active file libraries.",
  },
  {
    id: "business",
    name: "Business",
    storageGB: 1024,
    storageLimit: 1024 * GB,
    priceCents: 9900,
    currency: "USD",
    interval: "month",
    description: "Team-scale storage for heavier collaboration.",
  },
];

const findPlan = (planId) => plans.find((plan) => plan.id === planId);

export const getPlans = (req, res) => {
  res.status(200).json({ success: true, plans });
};

export const getBillingSummary = (req, res) => {
  const userPlan = findPlan(req.user.accountType) || plans[0];

  res.status(200).json({
    success: true,
    currentPlan: userPlan,
    accountType: userPlan.id,
    storageUsed: req.user.storageUsed || 0,
    storageLimit: req.user.storageLimit || userPlan.storageLimit,
    storageRemaining: Math.max((req.user.storageLimit || userPlan.storageLimit) - (req.user.storageUsed || 0), 0),
    billingStatus: userPlan.priceCents > 0 ? "active" : "free",
    invoices: [],
    paymentMethod: null,
    renewalDate: null,
  });
};

export const upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) {
      return res.status(400).json({ success: false, message: "Plan not provided" });
    }

    const selectedPlan = findPlan(plan);
    if (!selectedPlan) {
      return res.status(422).json({ success: false, message: "Invalid billing plan" });
    }

    const userId = req.user && req.user._id ? req.user._id.toString() : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthenticated" });
    }

    const storageUsed = req.user.storageUsed || 0;
    if (selectedPlan.storageLimit < storageUsed) {
      return res.status(409).json({
        success: false,
        message: "This plan does not include enough storage for your current files.",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { accountType: selectedPlan.id, storageLimit: selectedPlan.storageLimit },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: `Plan updated to ${selectedPlan.name}`,
      currentPlan: selectedPlan,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        accountType: user.accountType,
        isEmailVerified: user.isEmailVerified,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        storageRemaining: Math.max(user.storageLimit - (user.storageUsed || 0), 0),
        joinedAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Upgrade failed" });
  }
};
