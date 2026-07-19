import { Router } from "express";
import { isAuthenticated } from "../../middleware/authMiddleware";
import {
  getProfileController,
  updateProfileController,
  deleteAddressController
} from "../../controllers/UserControllers";
import { cartRouter } from "./CartRoutes";
import {
  cancelOrder,
  getOrder,
  getOrders,
} from "../../controllers/OrderControllers";
import { updateProfileValidator } from "../../middleware/User/updateProfileValidator";
import { cancelOrderValidator } from "../../middleware/User/Order/cancelOrderValidator";

export const userRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Routes related to user actions such as managing orders, profiles, and authentication.
 */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 */
userRouter.get("/profile", isAuthenticated, getProfileController);

/**
 * @swagger
 * /user/profile:
 *   post:
 *     summary: Update the authenticated user's profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 */
userRouter.post(
  "/profile",
  isAuthenticated,
  updateProfileValidator,
  updateProfileController
);

/**
 * @swagger
 * /user/profile/address/{addressId}:
 *   delete:
 *     summary: Delete a specific address of the authenticated user
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 */
userRouter.delete(
  "/profile/address/:addressId",
  isAuthenticated,
  deleteAddressController
);

userRouter.use("/cart", cartRouter);

/**
 * @swagger
 * /user/orders:
 *   get:
 *     summary: Get the authenticated user's order history
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 */
userRouter.get("/orders", isAuthenticated, getOrders);

/**
 * @swagger
 * /user/orders/{orderId}:
 *   get:
 *     summary: Get a specific order by ID
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to retrieve
 *     responses:
 *       '200':
 *         description: Success
 */
userRouter.get("/orders/:orderId", isAuthenticated, getOrder);

/**
 * @swagger
 * /user/orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order canceled successfully
 */
userRouter.post(
  "/orders/:orderId/cancel",
  isAuthenticated,
  cancelOrderValidator,
  cancelOrder
);
