const fs = require('fs');
const path = require('path');
const {parseArgs, styleText} = require('util');

const configFile = '/configs/config.json';

function error(err, exitCode = 1) {
    console.error(styleText('red', `generate-env error: ${err}`));
    process.exit(exitCode);
}

// Makes the JSON safe to inline in a <script> element: "</script>" or "<!--" in a value
// would otherwise break out of the script context.
function toInlineScriptJson(value) {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

// Direct eval keeps `require` in scope: compilers use it to read files such as the stack config.
function loadCompiler(src) {
    return eval(src);
}

function main() {
    const {positionals} = parseArgs({strict: false, allowPositionals: true});

    const dirArg = positionals[0];
    if (!dirArg) {
        error('Missing directory argument');
    }
    let dir;
    try {
        dir = fs.realpathSync(path.join(process.cwd(), dirArg));
    } catch (e) {
        error(`Directory "${path.join(process.cwd(), dirArg)}" does not exist`);
    }

    const compilerSrc = `${process.cwd()}/config-compiler.js`;
    if (!fs.existsSync(compilerSrc)) {
        console.warn(styleText('yellow', `No config compiler file found. (Looked at ${compilerSrc})`));
        return;
    }

    const compiler = loadCompiler(fs.readFileSync(compilerSrc, 'utf-8'));
    console.info(styleText('cyan', `Loading compiler at "${compilerSrc}"`));

    let config = {};
    if (fs.existsSync(configFile)) {
        config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    }

    config = compiler(config, process.env);

    let customHTML = {};
    if (config.customHTML) {
        customHTML = {...config.customHTML};
        delete config.customHTML;
    }

    console.info(styleText('yellow', `
############################################
# The following configuration will be      #
# exposed publicly by the client.          #
# Please review there is no sensible data: #
############################################
`), JSON.stringify(config, null, 2));

    const scriptNonce = process.env.CONFIG_NONCE;
    if (scriptNonce && !/^[A-Za-z0-9+/_=-]+$/.test(scriptNonce)) {
        error('CONFIG_NONCE must be a base64 value');
    }
    const compiled = `<script${scriptNonce ? ` nonce="${scriptNonce}"` : ''}>window.config=${toInlineScriptJson(config)};</script>`;
    const indexSrc = `${dir}/index.html`;
    const tplSrc = `${dir}/index.tpl.html`;

    if (!fs.existsSync(tplSrc)) {
        fs.copyFileSync(indexSrc, tplSrc);
        console.log(styleText('green', `[OK] ${indexSrc} copied into ${tplSrc}`));
    }

    // Replacements are passed as functions so that "$&", "$'"... in values are not
    // interpreted as replacement patterns.
    let html = fs.readFileSync(tplSrc, 'utf8').replace('__TPL_CONFIG__', () => compiled);
    Object.keys(customHTML).forEach(k => {
        html = html.replace(k, () => customHTML[k]);
    });

    fs.writeFileSync(indexSrc, html);
    console.log(styleText('green', `[OK] ${indexSrc} written`));
}

main();
