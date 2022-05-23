import { Request } from 'express';
import path from 'path';
import { Business, validationRules } from '../models/business.model';
import { isFileUploaded, moveUploadedFile } from '../util/commons';
import { extractUpdatableModelFieldsFromRequest, withTransaction } from '../util/database';
import { validateRequest } from '../util/validation';

export const createBusiness = async (req: Request, res: any, next: any) => {
  const handler = async () => {
    await withTransaction(next, async (session) => {
      const body = req.body;

      // Duplicate errors
      const errors = [];

      let business = await Business.findOne({ name: body.name });
      if (business)
        errors.push("This business name is already registered");

      business = await Business.findOne({ phone: body.phone });
      if (business)
        errors.push("This phone number is already registered");

      business = await Business.findOne({ account_number: body.account_number });
      if (business)
        errors.push("This account number is already registered");

      if (!isFileUploaded(req, 'banner'))
        errors.push("Banner is required");
      if (!isFileUploaded(req, 'logo'))
        errors.push("Logo is required");

      const banner = req.files.banner;
      const logo = req.files.logo;

      if (banner.truncated)
        errors.push(`Banner size must not exceed ${process.env.MAX_FILE_SIZE_MB}MB`);
      if (logo.truncated)
        errors.push(`Logo size must not exceed ${process.env.MAX_FILE_SIZE_MB}MB`);
        
      const bannerExtension = banner.name.substring(banner.name.lastIndexOf('.') + 1) || '';
      if (['png', 'jpg', 'jpeg'].indexOf(bannerExtension) === -1)
        errors.push('Banner must be an image file');
      
      const logoExtension = logo.name.substring(logo.name.lastIndexOf('.') + 1) || '';
      if (['png', 'jpg', 'jpeg'].indexOf(logoExtension) === -1)
        errors.push('Logo must be an image file');

      if (errors.length > 0)
        return res.failValidationError(errors, "validation-error");
      
      // Extract the required data
      const data: any = {};
      const validFields = [
        'name', 'description', 'type', 'address', 'country', 'city', 'state', 'account_name', 'account_number', 'bank_name',
        'twitter', 'facebook', 'instagram', 'linkedin',
      ];
      extractUpdatableModelFieldsFromRequest(req, data, validFields);
      
      // Upload banner and logo
      const imagesPath = path.resolve('businesses', 'images');
      data.banner = await moveUploadedFile(banner, imagesPath);
      data.logo = await moveUploadedFile(logo, imagesPath);

      // Save the business
      business = new Business(data);
      await business.save({ session });

      res.respondCreated(null, 'Business created');
    });
  };

  validateRequest(req, res, validationRules.create, handler);
};