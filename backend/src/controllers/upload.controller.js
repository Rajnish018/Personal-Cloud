import { storageClient } from "../config/storageClient.js";
import { incrementUsage } from "../services/storageService.js";

export const uploadFile = async (req, res) => {

  try {

    const file = req.file;

    const userId = req.user._id.toString();

    let folder = "others";

    if (file.mimetype.startsWith("image/")) {

      folder = "images";

    } else if (
      file.mimetype.startsWith("video/")
    ) {

      folder = "videos";

    } else if (
      file.mimetype === "application/pdf"
    ) {

      folder = "documents";
    }

    const objectName =
      `${userId}/${folder}/${file.originalname}`;

    await storageClient.putObject(

      "users",

      objectName,

      file.buffer,

      file.size,

      {
        "Content-Type": file.mimetype,
        "Content-Disposition": "inline",
      }

    );
    // Update user's storage usage
    await incrementUsage(userId, file.size);

    return res.status(200).json({

      success: true,

      path: objectName,

      message: "File uploaded successfully",

    });

  }

  catch(error){

    console.log(error);

    return res.status(500).json({

      success:false,

      message:"Upload failed"

    });

  }

};