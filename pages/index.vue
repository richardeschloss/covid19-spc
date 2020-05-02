<template>
  <div class="container index-container">
    <div>
      <h1 class="title">
        Covid19-spc: How's YOUR Region Doing?
        <span v-show="$fetchState.pending">
          (Fetching data...)
        </span>
      </h1>
      <p v-if="$fetchState.timestamp">
        Data Fetched: {{ new Date($fetchState.timestamp).toLocaleString() }}
      </p>
      <combo-select
        v-model="selectedState"
        :items="casesInfo.states"
        @itemSelected="stateSelected"
        placeholder="Select State"
        class="region-select"
      />
      <div class="row">
        <trend-chart
          :dates="casesInfo.dates"
          :trendData="totalCases"
          :selectedState="selectedState"
          :title="casesTitle"
          class="col-md-6"
        />
        <trend-chart
          :dates="casesInfo.dates"
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
import ComboSelect from '@/components/ComboSelect'
import TrendChart from '@/components/TrendChart'

export default {
  components: {
    TrendChart,
    ComboSelect
  },
  data() {
    return {
      selectedState: '',
      casesInfo: {},
      statesIdx: 0,
      states: [],
      deathsTitle: 'Deaths (Daily Increase) -- [select state]',
      deathSubTitle: 'Deaths / Population:',
      totalCases: [],
      totalDeaths: []
    }
  },
  computed: {
    casesTitle() {
      return 'Cases (Daily Increase) -- ' + this.selectedState !== ''
        ? this.selectedState
        : '[select state]'
    }
  },
  fetch() {
    const p = [this.getCases(), this.getDeaths()]
    console.time('fetch')
    Promise.all(p).then(([rawCases, rawDeaths]) => {
      console.timeEnd('fetch')
      this.parseCases(rawCases)
    })
  },
  fetchOnServer: false,
  methods: {
    calcTotals(matrix, colOffset) {
      return matrix
        .map((r) => r.slice(colOffset))
        .reduce((cum, cols) => {
          if (cum.length === 0) {
            cum = Array(cols.length).fill(0)
          }
          return cols.map((col, idx) => (cum[idx] += parseInt(col)))
        }, [])
    },
    parseCsv(data) {
      return data
        .trim()
        .replace(/".+"/g, '---')
        .split('\n')
        .map((r) => r.split(','))
    },
    async getCases() {
      const { casesUrl } = process.env
      const { data } = await axios.get(casesUrl)
      const raw = this.parseCsv(data)
      return { hdr: raw[0], data: raw.slice(1) }
    },
    parseCases({ hdr, data }) {
      const { datesIdx, dates } = this.extractDates(hdr, 'Combined_Key')
      const { statesIdx, states } = this.extractStates(hdr, data)
      Object.assign(this.casesInfo, {
        datesIdx,
        dates,
        statesIdx,
        states,
        cases: data
      })
      this.selectedState = localStorage.getItem('selectedState') || ''
      if (this.selectedState !== '') {
        this.summarizeByState()
      }
    },
    async getDeaths() {
      const { deathsUrl } = process.env
      const { data } = await axios.get(deathsUrl)
      return this.parseCsv(data)
      // const raw = this.parseCsv(data)
      // this.deathsHdr = raw[0]
      // this.deaths = raw.slice(1)
      // this.extractDeathDates()
    },
    extractDates(hdr, datesProp, datesOffset = 1) {
      const datesIdx = hdr.findIndex((i) => i === datesProp) + datesOffset
      return {
        datesIdx,
        dates: hdr.slice(datesIdx).map((d) => new Date(d).getTime())
      }
    },
    extractStates(hdr, data, statesProp = 'Province_State') {
      const statesIdx = hdr.findIndex((i) => i === statesProp)
      return {
        statesIdx,
        states: Array.from(new Set(data.map((r) => r[statesIdx]))).sort()
      }
    },
    extractDeathDates() {
      this.deathsIdx = this.deathsHdr.findIndex((i) => i === 'Population') + 1
      this.deathDates = this.deaths
        .slice(this.deathsIdx)
        .map((d) => new Date(d).getTime())
    },
    stateSelected(state) {
      localStorage.setItem('selectedState', state)
      this.selectedState = state
      this.summarizeByState()
    },
    summarizeByState() {
      this.summarizeStateCases()
    },
    filterBy(arr, prop, colIdx) {
      return arr.filter((r) => r[colIdx] === prop)
    },
    summarizeStateCases() {
      const filteredCases = this.filterBy(
        this.casesInfo.cases,
        this.selectedState,
        this.casesInfo.statesIdx
      )
      this.totalCases = this.calcTotals(filteredCases, this.casesInfo.datesIdx)
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
.index-container {
  padding: 6px;
}

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

.region-select {
  width: 50%;
}

.links {
  padding-top: 15px;
}
</style>
