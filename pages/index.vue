<template>
  <div class="container">
    <div>
      <h1 class="title">
        Covid19-spc
      </h1>
      <state-select :states="states" @stateSelected="summarize" />
      <div class="row">
        <trend-chart
          :dates="casesDates"
          :trendData="totalCases"
          :selectedState="selectedState"
          :title="casesTitle"
          class="col-md-6"
        />
        <trend-chart
          :dates="casesDates"
          :trendData="totalDeaths"
          :selectedState="selectedState"
          :title="deathsTitle"
          :subTitle="deathSubTitle"
          class="col-md-6"
        />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import StateSelect from '@/components/StateSelect'
import TrendChart from '@/components/TrendChart'

export default {
  components: {
    TrendChart,
    StateSelect
  },
  data() {
    return {
      isOpen: false,
      selectedState: '',
      casesHdr: [],
      cases: [],
      statesIdx: 0,
      states: [],
      casesIdx: 0,
      casesDates: [],
      casesTitle: 'Cases (Daily Increase) -- [select state]',
      deathsTitle: 'Deaths (Daily Increase) -- [select state]',
      deathSubTitle: 'Deaths / Population:',
      totalCases: [],
      totalDeaths: [],
      showChart: false
    }
  },
  fetch() {
    this.getCases()
    this.getDeaths()
  },
  fetchOnServer: false,
  methods: {
    parseCsv(data) {
      return data
        .trim()
        .replace(/".+"/g, '---')
        .split('\n')
        .map((r) => r.split(','))
    },
    async getCases() {
      console.time('casesFetched')
      const { casesUrl } = process.env
      const { data } = await axios.get(casesUrl)
      console.timeEnd('casesFetched')
      const raw = this.parseCsv(data)
      this.casesHdr = raw[0]
      this.cases = raw.slice(1)
      this.extractCasesDates()
      this.extractStates()
    },
    async getDeaths() {
      console.time('deathsFetched')
      const { deathsUrl } = process.env
      const { data } = await axios.get(deathsUrl)
      console.timeEnd('deathsFetched')
      const raw = this.parseCsv(data)
      this.deathsHdr = raw[0]
      this.deaths = raw.slice(1)
      this.extractDeathDates()
    },
    extractCasesDates() {
      this.casesIdx = this.casesHdr.findIndex((i) => i === 'Combined_Key') + 1
      this.casesDates = this.casesHdr
        .slice(this.casesIdx)
        .map((d) => new Date(d).getTime())
    },
    extractDeathDates() {
      this.deathsIdx = this.deathsHdr.findIndex((i) => i === 'Population') + 1
      this.deathDates = this.deaths
        .slice(this.deathsIdx)
        .map((d) => new Date(d).getTime())
    },
    extractStates() {
      this.statesIdx = this.casesHdr.findIndex((i) => i === 'Province_State')

      this.states = Array.from(
        new Set(this.cases.map((r) => r[this.statesIdx]))
      ).sort()
    },
    summarize(state) {
      this.selectedState = state
      this.summarizeCases(state)
      this.summarizeDeaths(state)
    },
    summarizeCases(state) {
      const byStateCases = this.cases.filter(
        (r) => r[this.statesIdx] === this.selectedState
      )

      this.casesTitle = `Cases (Daily Increase) -- ${state}`
      this.totalCases = byStateCases
        .map((r) => r.slice(this.casesIdx))
        .reduce((cum, cols) => {
          if (cum.length === 0) {
            cum = Array(cols.length).fill(0)
          }
          return cols.map((col, idx) => (cum[idx] += parseInt(col)))
        }, [])
    },
    summarizeDeaths(state) {
      const byStateCases = this.deaths.filter(
        (r) => r[this.statesIdx] === this.selectedState
      )
      this.deathsTitle = `Deaths (Daily Increase) -- ${state}`
      this.totalDeaths = byStateCases
        .map((r) => r.slice(this.deathsIdx))
        .reduce((cum, cols) => {
          if (cum.length === 0) {
            cum = Array(cols.length).fill(0)
          }
          return cols.map((col, idx) => (cum[idx] += parseInt(col)))
        }, [])

      const lastDeathCnt = this.totalDeaths[this.totalDeaths.length - 1]

      const totalPopulation = byStateCases
        .map((r) => r[this.deathsIdx - 1])
        .reduce((cum, val) => (cum += parseInt(val)), 0)

      this.deathSubTitle = `Deaths / Population: ${(
        (lastDeathCnt / totalPopulation) *
        100
      ).toFixed(4)}%`
    }
  }
}
</script>

<style scoped>
.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 24px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 22px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
