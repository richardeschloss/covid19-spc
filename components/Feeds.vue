<template>
  <div v-show="feeds.length > 0" class="feeds-container">
    <table class="table">
      <tr v-for="feed in feeds" :key="feed.title[0]">
        <td>
          <div class="feed-title">
            <a :href="feed.link[0]" target="_blank">{{ feed.title[0] }}</a>
          </div>
          <p>{{ feed.pubDate[0] }}</p>
          <p>Source: {{ feed.source[0]['_'] }}</p>
        </td>
      </tr>
    </table>

    <hr />
    <div>
      <a :href="meta.rssLink">{{ meta.title }}</a>
      <p>Copyright {{ meta.copyright }}</p>
    </div>
  </div>
</template>

<script>
import querystring from 'querystring'

export default {
  props: {
    state: {
      type: String,
      default: () => ''
    },
    region: {
      type: String,
      default: () => ''
    }
  },
  data() {
    return {
      meta: {},
      feeds: []
    }
  },
  mounted() {
    const { functionsEnabled } = process.env
    if (functionsEnabled) {
      this.getFeeds({ state: this.state, region: this.region })
      this.$parent.$on('stateSelected', (state) => {
        this.getFeeds({ state })
      })
      this.$parent.$on('regionSelected', (region) => {
        this.getFeeds({ state: this.state, region })
      })
    }
  },
  methods: {
    getFeeds({ state = '', region = '' }) {
      const { feedsPath } = process.env
      const qStr = querystring.stringify({ state, region })
      fetch(`${feedsPath}?${qStr}`)
        .then((res) => res.json())
        .then((feeds) => {
          const data = feeds.rss.channel[0]
          Object.assign(this.meta, {
            copyright: data.copyright[0],
            description: data.description[0],
            rssLink: data.link[0],
            title: data.title[0]
          })
          this.feeds = data.item.sort((a, b) => {
            const a1 = (new Date(a.pubDate[0])).getTime()
            const b1 = (new Date(b.pubDate[0])).getTime()
            if (a1 > b1) {
              return -1
            } else if (a1 < b1) {
              return 1
            } else {
              return 0
            }
          })
        })
    }
  }
}
</script>

<style scoped>
.feeds-container {
  border: 1px solid gray;
  border-radius: 1em;
  box-shadow: 5px 10px lightgrey;
  padding: 2em;
  margin-top: 2em;
}
.feed-title {
  font-weight: bold;
}
</style>
