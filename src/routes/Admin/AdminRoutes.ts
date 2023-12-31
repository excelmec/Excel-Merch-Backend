import { Router } from 'express';
import { isAuthenticated, isMerchAdmin } from '../../middleware/authMiddleware';
import { updateOrderStatus } from '../../controllers/OrderControllers';
import multer from 'multer';
import {
	createNewItemController,
	deleteItemController,
	updateItemController,
} from '../../controllers/ItemControllers';
import { createItemValidator } from '../../middleware/Item/createItemValidator';
import { updateItemValidator } from '../../middleware/Item/updateItemValidator';

export const adminRouter = Router();

adminRouter.put(
	'/orderStatus/:orderId',
	isAuthenticated,
	isMerchAdmin,
	updateOrderStatus
);

const storage = multer.memoryStorage();
const upload = multer({ 
	storage: storage,
	limits: {
		fileSize: 1024 * 1024 * 50,
		fieldSize: 1024 * 1024 * 30,
	}
 });

const fieldConfig = [
	{
		name: 'media',
		maxCount: 50
	}
];

adminRouter.post(
	'/item',
	isAuthenticated,
	isMerchAdmin,
	upload.fields(fieldConfig),
	createItemValidator,
	createNewItemController
);

// TODO: handle mediaChanges
adminRouter.put(
	'/item/:itemId',
	isAuthenticated,
	isMerchAdmin,
	upload.fields(fieldConfig),
	updateItemValidator,
	updateItemController
);

adminRouter.delete(
	'/item/:itemId',
	isAuthenticated,
	isMerchAdmin,
	deleteItemController
);
