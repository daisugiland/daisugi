import * as joi from 'joi';
import * as path from 'path';
import joiToSwagger from 'joi-to-swagger';

import { Context } from '../oza/oza';

const schema = {
  params: joi.object().keys({
    id: joi.string().required(),
  }),
  querystring: joi.object().keys({
    q: joi
      .string()
      .optional()
      .default('*')
      .example('*')
      .description(
        "Search term, if you don't want to filter, just use '*'",
      ),
  }),
};

/*
console.log(
  joiToSwagger(schema.querystring).swagger,
);
*/

function file(context: Context) {
  context.sendFile(path.join(__dirname, './index.html'));

  return context;
}

export function filePage(daisugi, oza) {
  const { sequenceOf } = daisugi;
  const { get, validate } = oza;

  return sequenceOf([
    get('/file/:id'),
    validate(schema),
    file,
    // page,
    // setCache(),
    // compress(),
  ]);
}
