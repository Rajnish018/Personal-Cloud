import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "agent", "system"],
      default: "user",
    },
    name: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: true }
);

const SupportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    priority: {
      type: String,
      enum: ["Low", "Normal", "High"],
      default: "Normal",
    },
    category: {
      type: String,
      enum: ["Account", "Billing", "Files", "Sharing", "Security", "Storage", "Other"],
      default: "Other",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved"],
      default: "Open",
      index: true,
    },
    messages: [supportMessageSchema],
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SupportTicketSchema.index({ user: 1, createdAt: -1 });
SupportTicketSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model("SupportTicket", SupportTicketSchema);
