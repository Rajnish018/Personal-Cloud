import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  Receipt,
} from "lucide-react";
import { billingApi } from "../../api";
import { QUERY_KEYS } from "../../utils/constants";
import { formatBytes } from "../../utils/drive";

const formatPrice = (plan) => {
  if (!plan || plan.priceCents === 0) return "Free";

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: plan.currency || "USD",
    minimumFractionDigits: 0,
  }).format(plan.priceCents / 100);
};

const planLabel = (plan) => {
  if (!plan) return "Free";
  return `${plan.name} Plan`;
};

const Billing = () => {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState("");

  const plansQuery = useQuery({
    queryKey: QUERY_KEYS.billingPlans,
    queryFn: billingApi.getPlans,
  });

  const summaryQuery = useQuery({
    queryKey: QUERY_KEYS.billingSummary,
    queryFn: billingApi.getSummary,
  });

  const plans = plansQuery.data?.plans || [];
  const summary = summaryQuery.data || {};
  const activePlan = useMemo(
    () => summary.currentPlan || plans.find((plan) => plan.id === summary.accountType),
    [plans, summary.accountType, summary.currentPlan]
  );
  const invoices = summary.invoices || [];

  useEffect(() => {
    setSelectedPlan((current) => current || activePlan?.id || plans[0]?.id || "");
  }, [activePlan?.id, plans]);

  const updatePlan = useMutation({
    mutationFn: billingApi.updatePlan,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billingSummary });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.storageMetrics });
      queryClient.setQueryData(QUERY_KEYS.authUser, { user: data.user });
      toast.success(data.message || "Billing plan updated");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Unable to update billing plan");
    },
  });

  const handlePlanUpdate = async () => {
    if (!selectedPlan || selectedPlan === activePlan?.id) return;
    await updatePlan.mutateAsync(selectedPlan);
  };

  const isLoading = plansQuery.isLoading || summaryQuery.isLoading;
  const error = plansQuery.error || summaryQuery.error;
  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-400">
        <Loader2 size={32} className="text-[#185FA5] animate-spin mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading billing details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <AlertCircle size={32} className="text-red-500 mb-2" />
        <h3 className="text-sm font-bold text-gray-800">Billing unavailable</h3>
        <p className="text-xs text-gray-500 max-w-xs mt-1">
          {error?.response?.data?.message || "Unable to load billing details."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased selection:bg-[#185FA5]/10 select-none">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <header className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-gray-50 rounded-2xl text-gray-700 border border-gray-100 shrink-0">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-[#185FA5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                Billing Suite
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-950 sm:text-2xl">
                Payments & Plans
              </h1>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Plan</span>
              <h2 className="text-lg font-black text-gray-950 flex items-center gap-2">
                {planLabel(activePlan)} <Sparkles size={16} className="text-[#185FA5]" />
              </h2>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3 text-xs font-bold text-gray-600">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Billing Cycle Cost:</span>
                <span className="text-gray-900">
                  {formatPrice(activePlan)}
                  {activePlan?.priceCents ? ` / ${activePlan.interval || "month"}` : ""}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Storage Allocation:</span>
                <span className="text-gray-900">{formatBytes(summary.storageLimit || activePlan?.storageLimit)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Next Renewal Date:</span>
                <span className="text-gray-900 flex items-center gap-1">
                  <Calendar size={13} className="text-gray-400" />
                  {summary.renewalDate || "Not scheduled"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Payment Source:</span>
                <span className="text-gray-900">{summary.paymentMethod || "No card on file"}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase text-gray-950 tracking-wide">Available Storage Plans</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isActive = activePlan?.id === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 text-left ${
                      isSelected ? "border-[#185FA5] bg-[#f0f7ff]/40" : "border-gray-100 bg-gray-50/40 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <h4 className="text-sm font-extrabold text-gray-900">{plan.name}</h4>
                      <span className="text-xs font-bold text-gray-400">
                        {formatPrice(plan)}
                        {plan.priceCents ? "/mo" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {formatBytes(plan.storageLimit)} storage. {plan.description}
                    </p>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handlePlanUpdate}
              disabled={!selectedPlanData || selectedPlan === activePlan?.id || updatePlan.isPending}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#185FA5] text-white rounded-xl text-xs font-bold hover:bg-[#155492] shadow-md shadow-[#185FA5]/10 transition-all disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            >
              {updatePlan.isPending && <Loader2 size={14} className="animate-spin" />}
              {selectedPlan === activePlan?.id ? "Current Plan Selected" : `Switch to ${selectedPlanData?.name || "Selected Plan"}`}
            </button>
          </div>
        </div>

        <main className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Receipt size={16} className="text-[#185FA5]" />
            <h3 className="text-sm font-black text-gray-950 uppercase tracking-wide">Invoice History</h3>
          </div>

          {!invoices.length ? (
            <div className="p-8 text-center text-xs font-semibold text-gray-400">
              No invoices are available for this account yet.
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">Invoice</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50/30 group transition-all text-xs">
                    <td className="px-6 py-4 text-gray-900 font-bold">{invoice.id}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{invoice.date}</td>
                    <td className="px-6 py-4 text-gray-800">{invoice.amount}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 size={10} /> {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Billing;
