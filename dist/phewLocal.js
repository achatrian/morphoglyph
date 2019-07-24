const express = require('express')
const ip = require('ip')
const bodyParser = require('body-parser')
const chalk = require('chalk')

// // Check for template files in data/templates
// async function checkForTemplates () {
//   const writeFile = promisify(fs.writeFile)
//   const templates = await findImages('data/templates')
//   let json = JSON.stringify(templates)
//   await writeFile('data/images.json', json, 'utf8')
// }
//
// // Returns an array of available templates in the specified directory.
// async function findTemplates (dirPath) {
//   const readdir = promisify(fs.readdir)
//
//   try {
//     // Get an array of **all items** at the path.
//     const items = await readdir(dirPath)
//
//     // Exclude hidden files and directories
//     return items.filter(item => {
//       const fileStats = fs.statSync(dirPath + '/' + item)
//       return item[0] !== '.' && !fileStats.isDirectory()
//     })
//   } catch (err) {
//     console.log(err)
//   }
// }


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

  // // Save annoation data
  // app.post('/save', async function (req, res) {
  //   try {
  //     await saveAnnotation(req.body)
  //     res.send('Success, annotation data saved')
  //   } catch (err) {
  //     console.log('Data could not be saved')
  //     console.log(err)
  //     res.send('Failed, annotation data could not be saved')
  //   }
  // })
  //
  // // Check for images that may have been added to the directory
  // app.post('/checkForTemplates', async function (req, res) {
  //   try {
  //     await checkForTemplates()
  //     res.send('Success, found templates')
  //   } catch (err) {
  //     console.log('Could not check for templates')
  //     console.log(err)
  //     res.send('Failed, could not find templates')
  //   }
  // })

  // Serve image files
  app.use('/templates', express.static('data/templates', {})) // makes templates available at /template

  // // Serve static annotation data
  // // Always respond with headers that disable the cache. Specifically this is
  // // important when editing raster images. Without this, when the editor is
  // // reloaded the browser will serve the original, pre-edit, from the cache.
  // app.use('/annotations', express.static('data/annotations', {
  //   setHeaders: function (res, path) {
  //     res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  //   }
  // }))

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
