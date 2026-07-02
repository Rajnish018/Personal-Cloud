import express from "express";
import {
  addTicketMessage,
  createTicket,
  getTicket,
  getTickets,
  reopenTicket,
} from "../controllers/support.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/ticket", createTicket);
router.get("/tickets", getTickets);
router.get("/ticket/:id", getTicket);
router.patch("/ticket/:id/reopen", reopenTicket);
router.post("/ticket/:id/messages", addTicketMessage);

export default router;
