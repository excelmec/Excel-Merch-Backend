import { Router } from "express";
import { razorPayWebhook } from "../../controllers/PaymentController";

export const webhookRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Webhook
 *     description: Routes related to Razorpay webhook event handling.
 */

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Handle Razorpay webhook events
 *     tags: [Webhook]
 *     description: Receives and processes webhook events from Razorpay such as OrderPaid, RefundProcessed, and RefundFailed.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               event: order.paid
 *               payload:
 *                 payment:
 *                   entity:
 *                     id: pay_29QQoUBi66xm2f
 *                     amount: 5000
 *                     currency: INR
 *     responses:
 *       '200':
 *         description: Webhook processed successfully
 */
webhookRouter.post("/", razorPayWebhook);
