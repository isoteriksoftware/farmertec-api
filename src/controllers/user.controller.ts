import { Request } from 'express';
import randomString from 'random-string';
import { PendingVerification } from '../models/pending_verification.model';
import { User, validationRules } from '../models/user.model';
import { withTransaction } from '../util/database';
import { validateRequest } from '../util/validation';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import { hashString, isFileUploaded, moveUploadedFile } from '../util/commons';

export const checkJwt = expressJwt({
  secret: process.env.TOKEN_SECRET!,
  requestProperty: "auth",
  algorithms: ["HS256"],
});

export const getAccountAvailability = async (req: Request, res: any) => {
  const body = req.body;

  if (!body.email)
    return res.failNotFound('No input provided');

  const feedbacks = [];

  if (body.email && await User.findOne({ email: body.email }))
    feedbacks.push('Email is registered');

  if (feedbacks.length === 0)
    return res.respond('Account available');
  
  return res.failValidationError(feedbacks, 'account-not-available');
};

export const createUser = async (req: Request, res: any, next: any) => {
  const handler = async () => {
    await withTransaction(next, async (session) => {
      const body = req.body;

      // Duplicate errors
      const errors = [];

      let user = await User.findOne({ email: body.email });
      if (user)
        errors.push("This email address is already registered");

      if (errors.length > 0)
        return res.failValidationError(errors, "validation-error");
      
      // Extract the required data
      const data = {
        email: body.email,
        full_name: body.full_name,
        phone: body.phone,
        address: body.address,
        id_token: await hashString(randomString({ length: 128 })),
        password: await hashString(body.password),
      };

      // Save the user
      user = new User(data);
      await user.save({ session });

      res.respondCreated(null, 'User account created');
    });
  };

  validateRequest(req, res, validationRules.create, handler);
};

export const authenticateUser = async (req: Request, res: any) => {
  // check Basic auth header
  if (!req.headers.authorization || req.headers.authorization.indexOf("Basic ") === -1)
    return res.failUnauthorized('Missing Authorization Header');
  
  // verify auth credentials
  const base64Credentials = req.headers.authorization.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [username, password] = credentials.split(":");

  // username can be either an Email or a Username
  let user = null;

  // check with email
  user = await User.findOne({ email: username });

  // At this point, if user is still undefined then this user doesn't exist
  if (!user)
    return res.failUnauthorized("Invalid username, email or password", 'invalid-credentials');

  // validate password
  if (await bcrypt.compare(password, user.password)) {
    // Credentials are valid.
    // Create fresh tokens for the client
    const access_token = jwt.sign(
      { id: user.id_token },
      process.env.TOKEN_SECRET!,
      {
        expiresIn: process.env.TOKEN_EXPIRY!,
        algorithm: "HS256",
      }
    );
    const refresh_token = jwt.sign(
      { refresh_id: user.id_token },
      process.env.TOKEN_SECRET!,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY!,
        algorithm: "HS256",
      }
    );

    const data = {
      access_token: access_token,
      refresh_token: refresh_token,
      token_type: "Bearer",
      access_token_expires_in: process.env.TOKEN_EXPIRY!,
      refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRY!,
    };

    return res.respond(data);
  } else {
    return res.failUnauthorized("Invalid username, email or password");
  }
};

export const getNewTokens = async (req: Request, res: any) => {
  // Fetch the id token
  const idToken = req.auth.refresh_id;

  if (!idToken) return res.failUnauthorized("Unauthorized", "invalid_token");

  // Fetch the user
  const user = await User.findOne({ id_token: idToken, });

  if (!user) return res.failUnauthorized("Unauthorized", "invalid_token");

  // Generate new tokens
  const access_token = jwt.sign(
    { id: user.id_token },
    process.env.TOKEN_SECRET!,
    {
      expiresIn: process.env.TOKEN_EXPIRY!,
      algorithm: "HS256",
    }
  );
  const refresh_token = jwt.sign(
    { refresh_id: user.id_token },
    process.env.TOKEN_SECRET!,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY!,
      algorithm: "HS256",
    }
  );

  const data = {
    access_token: access_token,
    refresh_token: refresh_token,
    token_type: "Bearer",
    access_token_expires_in: process.env.TOKEN_EXPIRY,
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRY,
  };

  return res.respond(data);
};

export const postAuthentication = async (req: Request, res: any, next: any) => {
  // Fetch the id token
  const idToken = req.auth.id;

  if (!idToken) return res.failUnauthorized();

  // Fetch the user
  const user = await User.findOne({ id_token: idToken, }, { password: 0, id_token: 0 });

  if (!user) return res.failUnauthorized();

  req.user = user;
  next();
};

export const getUserData = async (req: Request, res: any) => {
  return res.respond(req.user);
};

export const initiatePasswordReset = async (req: Request, res: any, next: any) => {
  const handler = async () => {
    await withTransaction(next, async (session) => {
      const user = await User.findOne({ email: req.body.email });
      if (!user)
        return res.failNotFound('This email is not registered.', 'email-not-found');

      const dispatchEmail = (verificationCode: string) => {
        res.respond(null, 200, 'Verification code sent');
      };

      // Find any existing verification data
      const verification = 
        await PendingVerification.findOne({ user: user._id, verification_type: 'PASSWORD_RESET' });

      if (verification)
        return dispatchEmail(verification.verification_code);

      // Create new verification data
      await withTransaction(next, async () => {
        const verification = new PendingVerification({
          verification_type: 'PASSWORD_RESET',
          verification_code: randomString({ length: 4, letters: false }),
          user: user._id,
        });
        await verification.save({ session });

        dispatchEmail(verification.verification_code);
      });
    });
  };

  validateRequest(req, res, validationRules.initiatePasswordReset, handler);
};

export const finalizePasswordReset = async (req: Request, res: any, next: any) => {
  const handler = async () => {
    await withTransaction(next, async (session) => {
      const body = req.body;

      // Fetch the verification data
      const verification = 
        await PendingVerification.findOne({ verification_code: body.verification_code, verification_type: 'PASSWORD_RESET' })
          .populate('user');
      if (!verification)
        return res.failNotFound('Invalid verification code', 'verification-code-not-found');

      // Update password
      verification.user.password = await hashString(body.new_password);
      verification.user.updated_on = Date.now();
      await verification.user.save({ session });

      // Remove the verification data
      await PendingVerification.deleteOne({ verification_code: body.verification_code }).session(session);

      return res.respond(null, 200, 'Password updated');
    });
  };

  validateRequest(req, res, validationRules.finalizePasswordReset, handler);
};

export const updateUser = async (req: Request, res: any, next: any) => {
  const handler = async () => {
    await withTransaction(next, async (session) => {
      const body = req.body;
      const updatableFields = ['full_name', 'phone', 'address', 'password'];
      const fields = Object.keys(body);
      const updatedFields = updatableFields.filter(field => fields.indexOf(field) !== -1);

      const isAvatarUploaded = isFileUploaded(req, 'avatar');
      if (updatedFields.length === 0 && !isAvatarUploaded)
        return res.failNotFound('No updatable field provided', 'no-updatable-field');

      const user = req.user;
      updatedFields.forEach(field => user[field] = body[field]);

      if (updatedFields.indexOf('password') !== -1)
        user.password = await hashString(body.password);

      const finalize = async () => {
        await user.save({ session });
        res.respondUpdated('User updated');
      };

      // Check for avatar upload
      if (isAvatarUploaded) {
        const file = req.files.avatar;
        if (file.truncated)
          return res.failValidationError([`File size must not exceed ${process.env.MAX_FILE_SIZE_MB}MB`, 'validation-error']);
        
        const extension = file.name.substring(file.name.lastIndexOf('.') + 1) || '';
        if (['png', 'jpg', 'jpeg'].indexOf(extension) === -1)
          return res.failValidationError(['Avatar must be an image file!'], 'invalid-avatar-file');

        await moveUploadedFile(file, 'avatars',
          async(fileName: string) => {
            user.avatar = fileName;
            await finalize();
          },
          () => {
            res.failServerError('Failed to upload avatar');
          });
      }
      else {
        await finalize();
      }
    });
  };

  validateRequest(req, res, validationRules.update, handler);
};