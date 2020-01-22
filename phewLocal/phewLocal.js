const express = require('express')
const ip = require('ip')
const bodyParser = require('body-parser')
const chalk = require('chalk')
const path = require('path')
const fsp = require('fs').promises
const fs = require('fs');
const ini = require('ini');


const config = ini.parse(fs.readFileSync(path.join(__dirname, 'config.ini'), 'utf-8'));
const templatesDir = path.isAbsolute(config.templates_dir) ? config.templates_dir : path.join(__dirname, config.templates_dir);


async function saveTemplates (data) {
    // Write annotation data as JSON file.
    const templateFilePath = path.join(templatesDir, data.templateName + '.json')
    const json = JSON.stringify(data.template)

    try {
        await fsp.writeFile(templateFilePath, json, 'utf8')
    } catch (err) {
        // If the error was because the directory did no extist then make it first
        if (err.code === 'ENOENT') {
            try {
                await fsp.mkdir(path.dirname(templateFilePath), { recursive: true })
                await fsp.writeFile(templateFilePath, json, 'utf8')
            } catch (err) {
                console.log(err)
            }
        }
    }
}


async function startServer () {
    const app = express()
    const port = 2999

    // Allow CORS
    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })

    // Need to parse POST Body data (for parsing application/json)
    // Increase the limit from the default (100kb) to enable large annotation JSON
    // files
    app.use(bodyParser.json({
        limit: '100mb'
    }))

    // Save template data
    app.post('/save', async function (req, res) {
        try {
            await saveTemplates(req.body)
            res.send('Success, template data saved')
        } catch (err) {
            console.log('Data could not be saved')
            console.log(err)
            res.send('Failed, template data could not be saved')
        }
    })

    // Serve template files
    app.use('/templates', express.static('data/templates', {})) // makes templates available at /template


    // Serve the built application
    app.use(express.static('.'))

    // Get the IP address of the current machine. The application will also be
    // usable over the network from this address.
    const networkIPAddress = ip.address()

    // Listen to requests
    app.listen(port, () => {
        console.log(`  PHEW running at:`)
        console.log('  - Local:   ' + chalk.cyan(`http://localhost:${port}/`))
        console.log('  - Network: ' + chalk.cyan(`http://` + networkIPAddress + `:${port}/`))
    })
}

startServer()
