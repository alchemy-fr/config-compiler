# Config compiler

A binary that takes a JSON configuration file and a JS compiler file and update the HTML template with the corresponding hash for cache burst.

Used by phraseanet services Docker containers.
This allow to update served configuration file without rebuilding the image. Configuration will be update after a (re)start.

## Usage

Given the following 2 files:

`config.json`
```json
{
  "namespace_foo": "bar",
  "secret": "s3cr3t!"
}
```

`config-compiler.js`
```js
(function (config, env) {
    return {
        foo: config.namespace_foo,
        is_dev: env.APP_ENV === 'dev',
    };
});
```

`config-compiler.js`
```js
(function (config, env) {
    return {
        foo: config.namespace_foo,
        isDev: env.APP_ENV === 'dev',
    };
});
```

`index.tpl.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <script src="%PUBLIC_URL%/env-config.__TPL_HASH__.js"></script>
  </head>
  <body>
  </body>
</html>
```

Run:
```bash
./generate-env-alpine /path/to/project
```

This will produce the following config:

`env-config.67b9814ff23399dee06b6293a0bf4618.js`
```js
window.config={
  "foo": "bar",
  "isDev": true
};
```

## Append custom script

You can return the magic key `customHTML` node as follows:
```js
// config-compiler.js
(function (config, env) {
    return {
        customHTML: {
            __TPL_HEAD__: `<script>alert("Script executed in env: {env}");</script>`.replace(/{env}/g, env.APP_ENV),
        },
        foo: config.namespace_foo,
        isDev: env.APP_ENV === 'dev',
        scriptHeadContents: scriptTpl.replace(/\{env\}/g, env.APP_ENV),
    };
});
```

And in the HTML template file:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <script src="%PUBLIC_URL%/env-config.__TPL_HASH__.js"></script>
    __TPL_HEAD__
  </head>
  <body>
  </body>
</html>
```

This will produce this HTML file:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <script src="/env-config.9T9esB0tcmbRstmRIDQH.js"></script>
    <script>alert("Script executed in env: dev");</script>
  </head>
  <body>
  </body>
</html>
```

Of course you can add as variables as you want:
```js
// config-compiler.js
(function (config, env) {
    return {
        customHTML: {
            __TPL_HEAD__: `<script>alert("Script executed in env: {env}");</script>`.replace(/{env}/g, env.APP_ENV),
            __TPL_BODY_1__: `<div>:)</div>`,
            __TPL_BODY_2__: `<div>:(</div>`,
        },
    };
});
```

Don't forget to place the `__TPL_BODY_1__` and `__TPL_BODY_2__` text in the right place of your template.
