import  bcrypt from 'bcrypt';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import randomString from 'random-string';

export const getBaseFilesDir = () => {
  return path.join(__dirname, '../../files');
};

export const getFilesDir = (append: string = '') => {
  return path.join(getBaseFilesDir(), append);
};

export const hashString = async (what: string): Promise<string> => {
  const salt = await bcrypt.genSalt();
  return await bcrypt.hash(what, salt);
};

export const isFileUploaded = (req: Request, fileName: string) => {
  return req.files && Object.keys(req.files).length !== 0 && req.files[fileName];
};

export const moveUploadedFile = async (file: any, savePath: string, onSucceed: (fileName: string) => void, onError: Function) => {
  if (file.truncated) {
    return onError();
  }
  
  const extension = file.name.substring(file.name.lastIndexOf('.')) || '';
  const fileName = randomString({ length: 32 }) + extension;
  const filesDir = path.join(getBaseFilesDir(), savePath);
  if (!fs.existsSync(filesDir)){
    fs.mkdirSync(filesDir, { recursive: true });
  }

  try {
    await file.mv(path.join(filesDir, fileName));
    onSucceed(fileName);
  } catch (err: any) {
    console.log(err);
    onError();
  }
};

export const daysToTimestamp = (days: number) => days * 8.64e+7;
export const percentageOfValue = (value: number, percentage: number) => (value * percentage) / 100;
export const toMaturityApy = (apy: number, maturityDays: number) => (apy / 365) * maturityDays;
export const roundNumber = (value: number) => Math.round(value);

export const getDecimals = (value: number) => {
  const strValue = String(value);
  const parts = strValue.split('.');

  if (parts.length === 2) {
    return parts[1].length;
  } else {
    return 0;
  }
};

export const toDecimals = (value: number | string, decimals = 18) => {
  const pattern = `^-?\\d+(?:\\.\\d{0,${decimals}})?`;
  return value.toString().match(new RegExp(pattern, 'g'))![0];
}

export const delay = (millis: number) => {
  return new Promise(resolve => {
      setTimeout(() => { resolve('') }, millis);
  })
}