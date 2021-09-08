import { absolutePath } from 'swagger-ui-dist';
import * as fs from 'fs';

import { Context } from './types';

const swagger = {
  swagger: '2.0',
  info: {
    description:
      'This is a sample server Petstore server.  You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).  For this sample, you can use the api key `special-key` to test the authorization filters.',
    version: '1.0.5',
    title: 'Swagger Petstore',
    termsOfService: 'http://swagger.io/terms/',
    contact: { email: 'apiteam@swagger.io' },
    license: {
      name: 'Apache 2.0',
      url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
    },
  },
  host: 'petstore.swagger.io',
  tags: [],
  schemes: ['https', 'http'],
  paths: {},
  securityDefinitions: {},
  definitions: {},
  externalDocs: {
    description: 'Find out more about Swagger',
    url: 'http://swagger.io',
  },
};

const assetPath = absolutePath();

const filenames = [
  'favicon-16x16.png',
  'favicon-32x32.png',
  'oauth2-redirect.html',
  'swagger-ui-bundle.js',
  'swagger-ui-bundle.js.map',
  'swagger-ui-standalone-preset.js',
  'swagger-ui-standalone-preset.js.map',
  'swagger-ui.css',
  'swagger-ui.css.map',
  'swagger-ui.js',
  'swagger-ui.js.map',
];

const originalIndexHTML = fs.readFileSync(
  `${assetPath}/index.html`,
  'utf-8',
);

const indexHTML = originalIndexHTML.replace(
  /<script>((.| |\n)*)<\/script>/,
  `
<script>
  window.onload = function() {
    // Begin Swagger UI call region
    const ui = SwaggerUIBundle({
      url: "/swagger.json",
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      plugins: [
        SwaggerUIBundle.plugins.DownloadUrl
      ],
      layout: "StandaloneLayout"
    });
    // End Swagger UI call region

    window.ui = ui;
  };
</script>
`,
);

function staticPage(filename) {
  return function (context: Context) {
    context.sendFile(`${assetPath}/${filename}`);

    return context;
  };
}

function indexPage(context: Context) {
  context.response.body = indexHTML;
  context.response.headers['content-type'] =
    'text/html; charset=UTF-8';

  return context;
}

function swaggerPage(context: Context) {
  context.response.body = JSON.stringify(swagger);
  context.response.headers['content-type'] =
    'application/json';

  return context;
}

export function openAPIStatics(sequenceOf, get) {
  const routes = filenames.map((filename) => {
    return sequenceOf([
      get(`/${filename}`),
      staticPage(filename),
    ]);
  });

  return [
    ...routes,
    sequenceOf([get('/swagger'), indexPage]),
    sequenceOf([get('/swagger.json'), swaggerPage]),
  ];
}
