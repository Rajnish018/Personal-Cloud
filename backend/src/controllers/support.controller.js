import mongoose from "mongoose";
import SupportTicket from "../models/supportTicket.model.js";

const VALID_CATEGORIES = new Set([
  "Account",
  "Billing",
  "Files",
  "Sharing",
  "Security",
  "Storage",
  "Other",
]);

const VALID_PRIORITIES = new Set(["Low", "Normal", "High"]);

const canAccessTicket = (ticket, user) => {
  if (!ticket || !user) return false;
  if (user.role === "admin") return true;
  return String(ticket.user || "") === String(user._id) || ticket.email === user.email;
};

const serializeTicket = (ticket) => ({
  ...ticket.toObject(),
  id: ticket._id.toString(),
});

// @desc    Create a new support ticket
// @route   POST /api/support/ticket
export const createTicket = async (req, res) => {
  try {
    const {
      name = req.user?.name,
      email = req.user?.email,
      subject,
      message,
      category = "Other",
      priority = "Normal",
    } = req.body;
    
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, email, subject, and message are required" 
      });
    }

    if (!VALID_CATEGORIES.has(category) || !VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid support category or priority",
      });
    }

    const initialMessage = {
      sender: "user",
      name: req.user?.name || name,
      text: message,
    };

    const ticket = await SupportTicket.create({
      user: req.user?._id,
      name,
      email,
      subject,
      message,
      category,
      priority,
      messages: [initialMessage],
      lastMessageAt: new Date(),
    });
    
    return res.status(201).json({ 
      success: true, 
      message: "Support ticket created successfully", 
      data: { ticketId: ticket._id, ticket: serializeTicket(ticket) } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create support ticket' 
    });
  }
};

// @desc    Get support tickets for current user, or all for admins
// @route   GET /api/support/tickets
export const getTickets = async (req, res) => {
  try {
    const filter =
      req.user?.role === "admin"
        ? {}
        : { $or: [{ user: req.user._id }, { email: req.user.email }] };
    const tickets = await SupportTicket.find(filter).sort({ lastMessageAt: -1, createdAt: -1 });
    
    return res.status(200).json({ 
      success: true, 
      message: "Tickets fetched successfully", 
      data: { tickets: tickets.map(serializeTicket) } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tickets' 
    });
  }
};

// @desc    Get a single ticket by ID
// @route   GET /api/support/ticket/:id
export const getTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket id",
      });
    }

    const ticket = await SupportTicket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this ticket",
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: "Ticket retrieved successfully", 
      data: { ticket: serializeTicket(ticket) } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ticket' 
    });
  }
};

// @desc    Reopen a ticket (set status to Open)
// @route   PATCH /api/support/ticket/:id/reopen
export const reopenTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket id",
      });
    }

    const ticket = await SupportTicket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to reopen this ticket",
      });
    }

    ticket.status = "Open";
    ticket.lastMessageAt = new Date();
    ticket.messages.push({
      sender: "system",
      name: "Personal Cloud Support",
      text: "Ticket reopened and returned to the support queue.",
      createdAt: new Date(),
    });

    await ticket.save();

    return res.status(200).json({ 
      success: true, 
      message: "Ticket reopened successfully", 
      data: { ticket: serializeTicket(ticket) } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to reopen ticket' 
    });
  }
};

// @desc    Add a chat message to a support ticket
// @route   POST /api/support/ticket/:id/messages
export const addTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket id",
      });
    }

    if (!text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to message this ticket",
      });
    }

    if (ticket.status === "Resolved") {
      return res.status(409).json({
        success: false,
        message: "Reopen the ticket before sending another message",
      });
    }

    ticket.messages.push({
      sender: req.user.role === "admin" ? "agent" : "user",
      name: req.user.role === "admin" ? `${req.user.name} (Support)` : req.user.name,
      text,
    });
    ticket.status = ticket.status === "Open" ? "In Progress" : ticket.status;
    ticket.lastMessageAt = new Date();
    await ticket.save();

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: { ticket: serializeTicket(ticket) },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};
