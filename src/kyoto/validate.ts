import * as joi from 'joi';

import { stopPropagationWith } from '../daisugi/daisugi';
import { Context } from './types';

export function validate(schema) {
  const validationSchema = joi.object(schema);

  return function (context: Context) {
    const { error, value } = validationSchema.validate(
      context.request,
      {
        allowUnknown: true,
      },
    );

    if (error) {
      context.response.statusCode = 400;

      return stopPropagationWith(context);
    }

    context.request = value;

    return context;
  };
}
