import { Router } from "express";
import {
  getItemByIdController,
  getItemsController,
} from "../controllers/ItemControllers";

export const itemRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Item
 *     description: Routes related to browsing and retrieving merchandise items.
 */

/**
 * @swagger
 * /item:
 *   get:
 *     summary: Get all available items
 *     tags: [Item]
 *     responses:
 *       '200':
 *         description: Success
 */
itemRouter.get("/", getItemsController);

/**
 * @swagger
 * /item/{itemId}:
 *   get:
 *     summary: Get a specific item by ID
 *     tags: [Item]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the item to retrieve
 *     responses:
 *       '200':
 *         description: Success
 */
itemRouter.get("/:itemId", getItemByIdController);
