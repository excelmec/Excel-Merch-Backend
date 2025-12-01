import { Router } from "express";
import {
  isAuthenticated,
  isMerchAdmin,
  isMerchOrderManager,
} from "../../middleware/authMiddleware";
import multer from "multer";
import {
  createNewItemController,
  deleteItemController,
  updateItemController,
} from "../../controllers/ItemControllers";
import { createItemValidator } from "../../middleware/Item/createItemValidator";
import { updateItemValidator } from "../../middleware/Item/updateItemValidator";
import {
  getAllOrders,
  getOrderAdmin,
  updateOrderStatus,
  getMissingStock
} from "../../controllers/AdminControllers";
import { updateOrderStatusValidator } from "../../middleware/Admin/updateOrderStatusValidator";

export const adminRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Routes related to administrative actions such as managing items and orders.
 */

/**
 * @swagger
 * /admin/orderStatus/{orderId}:
 *   put:
 *     summary: Update the status of an order
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to update
 *     responses:
 *       '200':
 *         description: Success
 */
adminRouter.put(
  "/orderStatus/:orderId",
  isAuthenticated,
  isMerchOrderManager,
  updateOrderStatusValidator,
  updateOrderStatus
);

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 50,
    fieldSize: 1024 * 1024 * 30,
  },
});

const fieldConfig = [
  {
    name: "media",
    maxCount: 50,
  },
];

/**
 * @swagger
 * /admin/item:
 *   post:
 *     summary: Create a new item
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 */
adminRouter.post(
  "/item",
  isAuthenticated,
  isMerchAdmin,
  upload.fields(fieldConfig),
  createItemValidator,
  createNewItemController
);

/**
 * @swagger
 * /admin/item/{itemId}:
 *   put:
 *     summary: Update an existing item
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the item to update
 *     responses:
 *       '200':
 *         description: Success
 */
adminRouter.put(
  "/item/:itemId",
  isAuthenticated,
  isMerchAdmin,
  upload.fields(fieldConfig),
  updateItemValidator,
  updateItemController
);

/**
 * @swagger
 * /admin/item/{itemId}:
 *   delete:
 *     summary: Delete an item
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the item to delete
 *     responses:
 *       '200':
 *         description: Success
 */
adminRouter.delete(
  "/item/:itemId",
  isAuthenticated,
  isMerchAdmin,
  deleteItemController
);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 */
adminRouter.get("/orders", isAuthenticated, isMerchOrderManager, getAllOrders);

/**
 * @swagger
 * /admin/missingStock:
 *   get:
 *     summary: Get missing stock details, needed to complete preorders
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 */
adminRouter.get("/missingStock", isAuthenticated, isMerchOrderManager, getMissingStock);

/**
 * @swagger
 * /admin/orders/{orderId}:
 *   get:
 *     summary: Get a specific order by ID
 *     tags: [Admin]
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
adminRouter.get(
  "/orders/:orderId",
  isAuthenticated,
  isMerchOrderManager,
  getOrderAdmin
);
