import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error-handler';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new AppError(message, 400));
      } else {
        next(error);
      }
    }
  };
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new AppError(message, 400));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new AppError(message, 400));
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new AppError(message, 400));
      } else {
        next(error);
      }
    }
  };
};
