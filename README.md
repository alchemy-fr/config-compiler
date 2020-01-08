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
