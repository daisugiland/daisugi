import * as joi from 'joi';

import { failWith } from '@daisugi/daisugi';
import { Context } from './types';

export function validate(schema) {
  const validationSchema = joi.object(schema);

  return function (context: Context) {
    const { error, value } = validationSchema.validate(
      context.request,
      { allowUnknown: true },
    );

    if (error) {
      context.response.statusCode = 400;

      return failWith(context);
    }

    context.request = value;

    return context;
  };
}
