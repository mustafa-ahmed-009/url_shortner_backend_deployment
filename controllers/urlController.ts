import { Request, Response } from "express";
import { Url } from "../models/urlModel";
import asyncHanndler from "express-async-handler"
import { nanoid } from "nanoid";
import ApiError from "../utils/apiError";
import { RequestWithUser } from "./authController";


export const createNewShortendedUrl = asyncHanndler(async (req:Request , res:Response) =>{
     const user = (req as RequestWithUser).user;
     let  {url , slug}  = req.body ; 
     if (!slug){
          slug = nanoid(4) ; 
     }
     const document = await Url.create(
          {
               url , 
               slug ,
               userId : user?.id || undefined 
          }
     )
res.status(201).json({
     data:document
})
}) ;

export const redirectUser = asyncHanndler(async (req:Request , res:Response) =>{
     const  {slug}  = req.params ; 
     const document = await Url.findOne({"slug":slug})
     if(!document) {
     throw new ApiError("there no link with this url" , 404)
}
document.numberOfClick = document.numberOfClick  +1 ; 
await document.save() ; 
 res.redirect(document.url)
}) ;

export const getUserUrls = asyncHanndler(async (req:Request , res:Response) =>{
     const user = (req as RequestWithUser).user!;
     

     const documents = await Url.find({
          userId:user.id
     })
   res.status(200).json({
     documents
   })

   
}) ;

export const syncUrls = asyncHanndler(async (req:Request , res:Response) =>{
    const urlsToSync: { url: string, slug: string }[] = req.body;
    const user = (req as RequestWithUser).user!;
    const userId = user._id;
    const operations = urlsToSync.map(urlData => ({
     updateOne: {
       filter: {
         slug: urlData.slug,
         userId: { $exists: false } 
       },
       update: {
         $set: { userId: userId }
       }
     }
   }));

   // 5. Execute the bulk write operation
   if (operations.length > 0) {
       const result = await Url.bulkWrite(operations, { ordered: false });
       console.log('Bulk update result:', result);
       if (result.matchedCount === 0 && result.modifiedCount === 0 && result.upsertedCount === 0) {
           console.log('Sync: No matching unowned documents found to update.');
       } else {
            console.log(`Sync: Matched ${result.matchedCount}, Modified ${result.modifiedCount} documents.`);
       }
   } else {
        console.log('Sync: No URL data provided in the payload.');
   }
   res.status(200).json({ message: 'Sync update request processed successfully.' });
}) ;