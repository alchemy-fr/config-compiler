function main() {
    const argv = require('minimist')(process.argv.slice(2));
    const fs = require('fs');
    const path = require('path');
    const glob = require('glob');
    const chalk = require('chalk');

    function error(err, exitCode = 1) {
        console.error(chalk.red(`generate-env error: ${err}`));
        process.exit(exitCode);
    }

    const dirArg = argv._[0];
    if (!dirArg) {
        error('Missing directory argument');
    }
    let dir;
    try {
        dir = fs.realpathSync(path.join(process.cwd(), dirArg));
    } catch (e) {
        error(`Directory "${path.join(process.cwd(), dirArg)}" does not exists`);
    }

    const compilerSrc = `${process.cwd()}/config-compiler.js`;
    let config = {};

    glob('/configs/config.json', function (er, files) {
        if (!fs.existsSync(compilerSrc)) {
            console.warn(chalk.yellow(`No config compiler file found. (Looked at ${compilerSrc})`));
            return;
        }

        const compiler = eval(fs.readFileSync(compilerSrc, 'utf-8'));
        console.info(chalk.cyan(`Loading compiler at "${compilerSrc}"`));

        files.forEach(f => {
            const contents = fs.readFileSync(f);
            config = Object.assign(config, JSON.parse(contents));
        });

        config = compiler(config, process.env);

        let customHTML = {};
        if (config.customHTML) {
            customHTML = {...config.customHTML};
            delete config.customHTML;
        }

        console.info(chalk.yellow(`
############################################
# The following configuration will be      #
# exposed publicly by the client.          #
# Please review there is no sensible data: #
############################################
`), JSON.stringify(config, null, 2));
        const data = JSON.stringify(config);
        const compiled = `<script nonce="${process.env.CONFIG_NONCE || 'SoAGRuE8'}">window.config=${data};</script>`;
        const indexSrc = `${dir}/index.html`;
        const tplSrc = `${dir}/index.tpl.html`;

        if (!fs.existsSync(tplSrc)) {
            fs.copyFileSync(indexSrc, tplSrc);
            console.log(chalk.green(`[OK] ${indexSrc} copied into ${tplSrc}`));
        }

        fs.readFile(tplSrc, 'utf8', function (err, data) {
            err && error(err);

            let d = data.replace('__TPL_CONFIG__', compiled);
            Object.keys(customHTML).forEach(k => {
                d = d.replace(k, customHTML[k]);
            });

            fs.writeFileSync(indexSrc, d);
            console.log(chalk.green(`[OK] ${indexSrc} written`));
        });
    });
}

main();
