const { Rexter } = require('les-utils')
const { siteId } = require('./.netlify/state.json')
const { API_TOKEN } = process.env

console.log('using access token', API_TOKEN)

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

  console.log('Lambda under usage...Lambda Enabled!', functionsEnabled)
}

checkUsage()
