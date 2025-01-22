const Image = require("../models/Image")
const { uploadToCloudinary } = require("../helpers/cloudinaryHelper")
const fs = require("fs")
const cloudinary = require("../config/cloudinary")


const uploadImageController = async (req, res) =>{
    try {
        if(!req.file) {
            return res.status(400).json({
                success: false,
                message: "File is required. Please upload an image",
            })
        }

        const { url, publicId } = await uploadToCloudinary(req.file.path)
        const newlyUploadImage = new Image({
            url, 
            publicId,
            uploadedBy: req.userInfo.userId,
        })

        await newlyUploadImage.save();

        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            image: newlyUploadImage,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Something went wrong! Please try again"
        }) 
    }
}


const fetchImageController = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const skip = (page - 1) * limit;

        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1
        const totalImages = await Image.countDocuments();
        const totalPages = Math.ceil(totalImages / limit)


        const sortObj = {}
        sortObj[sortBy] = sortOrder;
        const images = await Image.find().sort(sortObj).skip(skip).limit(limit);


        if(images) {
            res.status(200).json({
                success: true,
                currentPage: page,
                totalPages: totalPages,
                totalImages: totalImages,
                data: images,
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong! Please try again",
        })
        
    }
}

const deleteImageController = async (req, res) => {
    try {
        const getCurrentIdOfImageToBeDeleted = req.params.id;
        const userId = req.userInfo.userId

        const image = await image.findById(getCurrentIdOfImageToBeDeleted)

        if(!image) {
            return res.status(404).json({
                success: false,
                message: "Image not found"
            })
        }

        if(image.uploadedBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: `You are not authorized to delete this image because you haven't uploaded it`,
            })
        }

        await cloudinary.uploader.destroy(image.publicId);


        await Image.findByIdAndUpdate(getCurrentIdOfImageToBeDeleted);

        res.status(200).json({
          success: true,
          message: "Image deleted successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
          success: false,
          message: "Something went wrong! Please try again",
        });
        
    }
}

module.exports = { uploadImageController, fetchImageController, deleteImageController }