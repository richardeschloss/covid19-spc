const { writeFileSync } = require('fs')
const { Rexter } = require('les-utils')
const { SITE_ID: siteId, API_TOKEN } = process.env
const config = require('./netlify.config.json')

async function checkUsage() {
  const rexter = Rexter({})

  const resp = await rexter.get({
    url: `https://api.netlify.com/api/v1/sites/${siteId}`,
    outputFmt: 'json',
    _reqOptions: {
      headers: {
        Authorization: 'Bearer ' + API_TOKEN
      }
    }
  })

  const {
    invocations,
    runtime
  } = resp.published_deploy.site_capabilities.functions

  const functionsEnabled =
    invocations.used < invocations.included && runtime.used < runtime.included

  console.log({ invocations, runtime })
  console.log('Lambda Enabled? (under usage?)', functionsEnabled)
  config.functionsEnabled = functionsEnabled
  writeFileSync('./netlify.config.json', JSON.stringify(config))
}

checkUsage()
