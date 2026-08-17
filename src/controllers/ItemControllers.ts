import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { adjustPreorders } from "../utils/adjustPreorder";
import { MediaObject, Size, stockCount } from "@prisma/client";
import { storageBucket, BUCKET_NAME } from "../utils/storage";
import { v4 as uuidv4 } from "uuid";
import { NotFoundError } from "../utils/error";
import lodash from "lodash";

export interface MediaObjectRequest
  extends Pick<MediaObject, "type" | "colorOption" | "viewOrdering"> {
  fileName: string;
}

export interface ItemRequest {
  data: ParsedItemRequestData;
}

export interface ParsedItemRequestData {
  name: string;
  description: string;
  price: number;

  sizeOptions: Size[];
  colorOptions: string[];

  canBePreordered: boolean;

  stockCount: Pick<stockCount, "colorOption" | "sizeOption" | "count">[];
  mediaObjects: MediaObjectRequest[];
}

export async function createNewItemController(
  req: Request<{}, {}, ItemRequest>,
  res: Response,
  next: NextFunction
) {
  const {
    name,
    description,
    price,
    stockCount,
    sizeOptions,
    colorOptions,
    canBePreordered,
    mediaObjects,
  } = req.body.data;

  try {
    const mediaFiles = (req.files as { media: Express.Multer.File[] }).media;

    let mediaObjectsWithId: Omit<MediaObject, "itemId" | "url">[] = [];

    /**
     * Replace the original file name with a uuid
     */
    mediaFiles.forEach((mediaFile, index) => {
      const mediaObjectId = uuidv4();
      // const extention = mediaFile.originalname.split('.').pop();

      const mediaMetadata = mediaObjects.find(
        (mediaObject) => mediaObject.fileName === mediaFile.originalname
      );
      if (!mediaMetadata) {
        throw new Error(
          `mediaMetadata not found for ${mediaFile.originalname}`
        );
      }

      mediaObjectsWithId.push({
        ...mediaMetadata,
        id: mediaObjectId,
      });

      mediaFiles[index].originalname = mediaObjectId;
    });

    const newItem = await prisma.$transaction(async (prismaTxClient) => {
      const itemCreateRes = await prismaTxClient.item.create({
        data: {
          name,
          description,
          price,
          sizeOptions,
          colorOptions,
          canBePreordered,
          stockCount: { create: stockCount },
        },
        include: {
          stockCount: true,
        },
      });

      const itemId = itemCreateRes.id;
      const mediaObjectsWithIdAndUrl: MediaObject[] = mediaObjectsWithId.map(
        (mediaObject) => ({
          colorOption: mediaObject.colorOption,
          type: mediaObject.type,
          viewOrdering: mediaObject.viewOrdering,
          id: mediaObject.id,
          itemId: itemId,
          url: `https://storage.googleapis.com/${BUCKET_NAME}/merch/item/${itemId}/${mediaObject.id}`,
        })
      );
      const mediaObjectsCreateRes = await prismaTxClient.mediaObject.createMany(
        {
          data: mediaObjectsWithIdAndUrl,
        }
      );

      if (mediaObjectsCreateRes.count !== mediaObjectsWithIdAndUrl.length) {
        throw new Error("Failed to create mediaObjects");
      }

      return {
        ...itemCreateRes,
        mediaObjects: mediaObjectsWithIdAndUrl.sort(
          (a, b) => a.viewOrdering - b.viewOrdering
        ),
      };
    });

    /**
     * Upload the files to GCS
     */
    const uploadPromises: Promise<any>[] = [];
    for (const mediaFile of mediaFiles) {
      uploadPromises.push(
        storageBucket.file(`merch/item/${newItem.id}/${mediaFile.originalname}`).save(mediaFile.buffer, {
          contentType: mediaFile.mimetype,
        })
      );
    }

    await Promise.all(uploadPromises);

    return res.status(200).json({
      item: newItem,
      message: "Item created successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateItemController(
  req: Request<{ itemId: string }, {}, ItemRequest>,
  res: Response,
  next: NextFunction
) {
  try {
    const itemId = parseInt(req.params.itemId, 10);

    const {
      name,
      description,
      price,
      stockCount,
      sizeOptions,
      colorOptions,
      canBePreordered,
      mediaObjects,
    } = req.body.data;

    const mediaFiles = (req.files as { media: Express.Multer.File[] }).media;

    const oldItem = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        mediaObjects: true,
        stockCount: true,
      },
    });

    if (!oldItem) {
      throw new NotFoundError("Item not found");
    }

    const mediaObjectsToUpdate: MediaObject[] = [];
    const mediaObjectsToDelete: MediaObject[] = [];
    const mediaObjectsToCreate: Omit<MediaObject, "itemId">[] = [];

    mediaObjects.forEach((mediaObject) => {
      const oldItemMediaObject = oldItem.mediaObjects.find(
        (oldItemMediaObject) => oldItemMediaObject.id === mediaObject.fileName
      );

      /**
       * If the mediaObject doesn't exist, create it
       */
      if (!oldItemMediaObject) {
        const mediaObjectId = uuidv4();
        mediaObjectsToCreate.push({
          colorOption: mediaObject.colorOption,
          type: mediaObject.type,
          viewOrdering: mediaObject.viewOrdering,
          id: mediaObjectId,
          // itemId: itemId,
          url: `https://storage.googleapis.com/${BUCKET_NAME}/merch/item/${itemId}/${mediaObjectId}`,
        });

        const mediaFileIndex = mediaFiles.findIndex(
          (mediaFile) => mediaFile.originalname === mediaObject.fileName
        );
        if (mediaFileIndex === -1) {
          throw new Error(`mediaFile not found for ${mediaObject.fileName}`);
        }
        mediaFiles[mediaFileIndex].originalname = mediaObjectId;
        return;
      }

      if (lodash.isEqual(oldItemMediaObject, mediaObject)) {
        return;
      }

      mediaObjectsToUpdate.push({
        id: oldItemMediaObject.id,
        itemId: itemId,
        url: `https://storage.googleapis.com/${BUCKET_NAME}/merch/item/${itemId}/${mediaObject.fileName}`,

        colorOption: mediaObject.colorOption,
        type: mediaObject.type,
        viewOrdering: mediaObject.viewOrdering,
      });
      return;
    });

    oldItem.mediaObjects.forEach((oldItemMediaObject) => {
      const mediaObject = mediaObjects.find(
        (mediaObject) => mediaObject.fileName === oldItemMediaObject.id
      );

      if (!mediaObject) {
        mediaObjectsToDelete.push(oldItemMediaObject);
      }
    });

    const oldStockCount = oldItem.stockCount;

    const stockCountToCreate: Omit<stockCount, "itemId">[] = [];
    const stockCountToUpdate: stockCount[] = [];
    const stockCountToDelete: stockCount[] = [];

    stockCount.forEach((stockCount) => {
      const oldStockCountItem = oldStockCount.find((oldStockCountItem) => {
        return (
          oldStockCountItem.colorOption === stockCount.colorOption &&
          oldStockCountItem.sizeOption === stockCount.sizeOption
        );
      });

      /**
       * If the stockCount doesn't exist, create it
       */
      if (!oldStockCountItem) {
        stockCountToCreate.push({
          ...stockCount,
        });
        return;
      }

      /**
       * If the stockCount is the same, don't update
       */
      if (lodash.isEqual(oldStockCountItem, stockCount)) {
        return;
      }

      stockCountToUpdate.push({
        ...stockCount,
        itemId,
      });
    });

    oldStockCount.forEach((oldStockCountItem) => {
      const stockCountItem = stockCount.find(
        (stockCountItem) =>
          stockCountItem.colorOption === oldStockCountItem.colorOption &&
          stockCountItem.sizeOption === oldStockCountItem.sizeOption
      );

      if (!stockCountItem) {
        stockCountToDelete.push(oldStockCountItem);
      }
    });

    await prisma.$transaction([
      prisma.item.update({
        where: { id: itemId },
        data: {
          name,
          description,
          price,
          sizeOptions: { set: sizeOptions },
          colorOptions: { set: colorOptions },
          canBePreordered,

          stockCount: {
            create: stockCountToCreate,
            deleteMany: stockCountToDelete,
          },

          mediaObjects: {
            create: mediaObjectsToCreate,
            deleteMany: mediaObjectsToDelete,
          },
        },
      }),
      ...stockCountToUpdate.map((stockCount) => {
        return prisma.stockCount.update({
          where: {
            itemId_colorOption_sizeOption: {
              itemId,
              colorOption: stockCount.colorOption,
              sizeOption: stockCount.sizeOption,
            },
          },
          data: {
            count: stockCount.count,
          },
        });
      }),
      ...mediaObjectsToUpdate.map((mediaObject) => {
        return prisma.mediaObject.update({
          where: {
            id: mediaObject.id,
          },
          data: {
            colorOption: mediaObject.colorOption,
            type: mediaObject.type,
            viewOrdering: mediaObject.viewOrdering,
          },
        });
      }),
    ]);
    await adjustPreorders(itemId);

    /**
     * Upload the new files to GCS
     */
    const uploadDeletePromises: Promise<any>[] = [];

    for (const mediaObjectToCreate of mediaObjectsToCreate) {
      const mediaFile = mediaFiles.find(
        (mediaFile) => mediaFile.originalname === mediaObjectToCreate.id
      );

      if (!mediaFile) {
        throw new Error(`mediaFile not found for ${mediaObjectToCreate.id}`);
      }

      uploadDeletePromises.push(
        storageBucket.file(`merch/item/${itemId}/${mediaObjectToCreate.id}`).save(mediaFile.buffer, {
          contentType: mediaFile.mimetype,
        })
      );
    }

    for (const mediaObjectToDelete of mediaObjectsToDelete) {
      uploadDeletePromises.push(
        storageBucket.file(`merch/item/${itemId}/${mediaObjectToDelete.id}`).delete()
      );
    }

    await Promise.all(uploadDeletePromises);

    return res.status(200).json({
      message: "Item updated successfully",
      item: await prisma.item.findUnique({
        where: { id: itemId },
        include: {
          mediaObjects: {
            orderBy: {
              viewOrdering: "asc",
            },
          },
          stockCount: true,
        },
      }),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteItemController(
  req: Request<{ itemId: string }>,
  res: Response,
  next: NextFunction
) {
  const itemId = parseInt(req.params.itemId, 10);

  try {
    const oldItem = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        mediaObjects: true,
        stockCount: true,
      },
    });

    if (!oldItem) {
      throw new NotFoundError("Item not found");
    }

    await prisma.item.update({
      where: { id: itemId },
      data: {
        deleted: true,
      },
    });

    await storageBucket.deleteFiles({
      prefix: `merch/item/${itemId}/`,
    });

    return res.json({ message: "Item deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function getItemsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const items = await prisma.item.findMany({
      where: {
        deleted: false,
      },
      include: {
        mediaObjects: {
          orderBy: {
            viewOrdering: "asc",
          },
        },
        stockCount: true,
      },
    });

    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function getItemByIdController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const itemId = parseInt(req.params.itemId, 10);

  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId, deleted: false },
      include: {
        mediaObjects: {
          orderBy: {
            viewOrdering: "asc",
          },
        },
        stockCount: true,
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
}
