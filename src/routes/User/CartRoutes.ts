import { Router } from "express";
import { isAuthenticated } from "../../middleware/authMiddleware";
import {
  addItemToCart,
  checkoutController,
  emptyCart,
  getUserCartItems,
  removeItemFromCart,
} from "../../controllers/CartControllers";
import { addItemValidator } from "../../middleware/User/Cart/addItemValidator";

export const cartRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Routes related to user shopping cart actions such as adding, removing, and checking out items.
 */

/**
 * @swagger
 * /user/cart:
 *   get:
 *     summary: Get all items in the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved cart items
 */
cartRouter.get("/", isAuthenticated, getUserCartItems);

/**
 * @swagger
 * /user/cart:
 *   post:
 *     summary: Add an item to the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to add
 *               quantity:
 *                 type: integer
 *                 description: Quantity of the product to add
 *             required:
 *               - productId
 *               - quantity
 *     responses:
 *       '200':
 *         description: Item added successfully
 */
cartRouter.post("/", isAuthenticated, addItemValidator, addItemToCart);

/**
 * @swagger
 * /user/cart:
 *   delete:
 *     summary: Empty the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Cart emptied successfully
 */
cartRouter.delete("/", isAuthenticated, emptyCart);

/**
 * @swagger
 * /user/cart/item/{itemId}:
 *   delete:
 *     summary: Remove a specific item from the cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the item to remove from the cart
 *     responses:
 *       '200':
 *         description: Item removed successfully
 */
cartRouter.delete("/item/:itemId", isAuthenticated, removeItemFromCart);

/**
 * @swagger
 * /user/cart/checkout:
 *   post:
 *     summary: Checkout the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Checkout completed successfully
 */
cartRouter.post("/checkout", isAuthenticated, checkoutController);
