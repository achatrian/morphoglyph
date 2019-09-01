const express = require('express')
const fsp = require('fs').promises
const path = require('path')
const ip = require('ip')
const bodyParser = require('body-parser')
const chalk = require('chalk')

// Check for template files in data/templates
async function checkForImages () {
    const templates = await walk('data/templates')
    const json = JSON.stringify(templates)
    await fsp.writeFile('data/templates.json', json, 'utf8')
}

// Returns an array of available templates in the specified directory.
async function walk (dir, fileList = []) {
    const files = await fsp.readdir(dir)
    for (const file of files) {
        const stat = await fsp.stat(path.join(dir, file))

        if (stat.isDirectory()) {
            fileList.push({
                name: path.basename(file),
                children: []
            })

            const children = fileList[fileList.length - 1].children
            await walk(path.join(dir, file), children)
        } else if (file !== '.DS_Store') {
            fileList.push({
                name: file,
                ext: path.extname(file),
                path: path.join(dir, file).split(dir + '/')[1] // TODO test
            })
        }
    }
    return fileList
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


    // Serve image files
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
