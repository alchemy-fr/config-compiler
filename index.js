function main() {
    const argv = require('minimist')(process.argv.slice(2));
    const fs = require('fs');
    const path = require('path');
    const glob = require('glob');
    const crypto = require('crypto');
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

        console.info(chalk.yellow(`
############################################
# The following configuration will be      #
# exposed publicly by the client.          #
# Please review there is no sensible data: #
############################################
`), JSON.stringify(config, null, 2));

        const data = JSON.stringify(config);
        const md5sum = crypto.createHash('md5').update(data).digest('hex');
        const compiled = `window.config=${data};\n`;
        const indexSrc = `${dir}/index.html`;
        const tplSrc = `${dir}/index.tpl.html`;
        const outputConfig = `${dir}/env-config.${md5sum}.js`;

        if (!fs.existsSync(tplSrc)) {
            fs.copyFileSync(indexSrc, tplSrc);
            console.log(chalk.green(`[OK] ${indexSrc} copied into ${tplSrc}`));
        }

        fs.writeFileSync(outputConfig, compiled);
        console.log(chalk.green(`[OK] ${outputConfig} written`));

        fs.readFile(tplSrc, 'utf8', function (err, data) {
            err && error(err);

            fs.writeFileSync(indexSrc, data.replace('__TPL_HASH__', md5sum));
            console.log(chalk.green(`[OK] ${indexSrc} written`));
        });
    });
}

main();
