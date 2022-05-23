require("dotenv").config();
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

import express, { Express } from 'express';
import mongoose from 'mongoose';
import responseHelper from 'express-response-helper';
import compression from 'compression';
import routes from './routes/index.routes';
import { UnauthorizedError } from 'express-jwt';
import expressFileUpload from 'express-fileupload';

// Create express instance
const app: Express = express();

const allowedOriginsString: string | undefined = app.get('env') === 'production' ? process.env.ORIGINS_WHITELIST_LIVE : process.env.ORIGINS_WHITELIST;
const allowedOrigins: string[] = allowedOriginsString?.split(',') ?? [];

const corsConfig = {
    origin: (origin: any, callback: any) => {
      if (!origin) {
        return callback(null, true);
      }
  
      if(allowedOrigins.indexOf(origin) === -1){
        return callback(new Error('Unknown origin'), false);
      }    
      
      return callback(null, origin);
    },
    methods: 'POST, GET, OPTIONS, DELETE, PATCH, PUT',
    credentials: true
};

// Configure application-wide middlewares
app.use(responseHelper.helper());
app.options("*", cors(corsConfig));
app.use(cors(corsConfig));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(compression());
app.use(expressFileUpload({
  limits: { fileSize: parseFloat(process.env.MAX_FILE_SIZE_MB!) * 1024 * 1024 },
}));

// Routes
app.get("/", (_req, res) => {
  res.send("FarmBit Mobile API");
});

app.use('/v1', routes);

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
    console.log(err);

    if (err instanceof UnauthorizedError) {
      const unauthorized = err as UnauthorizedError;
      return res.failUnauthorized([unauthorized.message], unauthorized.code);
    }

    return res.failServerError();
});

// Connect to the database and start server
const port = process.env.PORT || 5000;
const dbName = app.get('env') === 'production' ? 'farmertec_live' : 'farmertec_test';
const dbUser = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbLink = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.hu9ei.mongodb.net/${dbName}?retryWrites=true&w=majority`;
mongoose.connect(dbLink, { 
    autoIndex: true,
    autoCreate: true,
  }, (error: any) => {
    if (error) {
      console.log('Failed to connect to database');
      throw error;
    }
  
    const http = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    http.setTimeout(10000);
});