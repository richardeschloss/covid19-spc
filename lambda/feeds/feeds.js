/* eslint-disable */
const { Rexter } = require('les-utils')
const rexter = Rexter({})

const sources = {
  Google: 'https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=[query]'
}

exports.handler = async function(event, context) {
  try {
    const { state = '', region = '', source = 'Google' } = event.queryStringParameters
    const url = sources[source].replace('[query]', `covid+${state}+${region}`)
    const data = await rexter.get({ url, outputFmt: 'xml' })
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    }
  } catch (err) {
    console.log(err) // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }) // Could be a custom message or object i.e. JSON.stringify(err)
    }
  }
}
