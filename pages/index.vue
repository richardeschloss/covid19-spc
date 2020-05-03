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
      <div class="row">
        <combo-select
          v-model="selectedState"
          :items="casesInfo.states"
          @itemSelected="stateSelected"
          placeholder="Select State"
          class="col-md-6"
        />
      </div>
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
import Csv from '@/utils/Csv'
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
      deathsInfo: {
        deathRate: 0
      },
      totalCases: [],
      totalDeaths: []
    }
  },
  computed: {
    casesTitle() {
      return (
        'Cases (Daily Increase) -- ' +
        (this.selectedState !== '' ? this.selectedState : '[select state]')
      )
    },
    deathsTitle() {
      return (
        'Deaths (Daily Increase) -- ' +
        (this.selectedState !== '' ? this.selectedState : '[select state]')
      )
    },
    deathSubTitle() {
      return (
        'Deaths / Population: ' +
        (this.deathsInfo.deathRate > 0
          ? (this.deathsInfo.deathRate * 100).toFixed(4) + '%'
          : '')
      )
    }
  },
  fetch() {
    this.selectedState = localStorage.getItem('selectedState') || ''
    const p = [process.env.casesUrl, process.env.deathsUrl].map(Csv.fetch)
    console.time('fetch')
    Promise.all(p).then(([rawCases, rawDeaths]) => {
      console.timeEnd('fetch')
      this.parseCases(rawCases)
      this.parseDeaths(rawDeaths)
      if (this.selectedState !== '') {
        this.summarizeByState()
      }
    })
  },
  fetchOnServer: false,
  methods: {
    parseCases({ hdr, data }) {
      const datesIdx = Csv.propIdx(hdr, 'Combined_Key', 1)
      const dates = hdr.slice(datesIdx).map((d) => new Date(d).getTime())
      const statesIdx = Csv.propIdx(hdr, 'Province_State')
      const states = Csv.uniqueByColumn(data, statesIdx)
      Object.assign(this.casesInfo, {
        datesIdx,
        dates,
        statesIdx,
        states,
        cases: data
      })
    },
    parseDeaths({ hdr, data }) {
      const populationIdx = Csv.propIdx(hdr, 'Population')
      const datesIdx = populationIdx + 1
      const dates = hdr.slice(datesIdx).map((d) => new Date(d).getTime())
      const statesIdx = Csv.propIdx(hdr, 'Province_State')
      const states = Csv.uniqueByColumn(data, statesIdx)
      Object.assign(this.deathsInfo, {
        populationIdx,
        datesIdx,
        dates,
        statesIdx,
        states,
        deaths: data
      })
    },
    stateSelected(state) {
      localStorage.setItem('selectedState', state)
      this.selectedState = state
      this.summarizeByState()
    },
    summarizeByState() {
      this.summarizeStateCases()
      this.summarizeStateDeaths()
    },
    summarizeStateCases() {
      const filteredCases = Csv.filterRows(
        this.casesInfo.cases,
        this.selectedState,
        this.casesInfo.statesIdx
      )
      this.totalCases = Csv.subtotals(filteredCases, this.casesInfo.datesIdx)
    },
    summarizeStateDeaths() {
      const filteredCases = Csv.filterRows(
        this.deathsInfo.deaths,
        this.selectedState,
        this.deathsInfo.statesIdx
      )
      this.totalDeaths = Csv.subtotals(filteredCases, this.deathsInfo.datesIdx)
      const lastDeathCnt = this.totalDeaths[this.totalDeaths.length - 1]
      const totalPopulation = Csv.sumColumn(
        filteredCases,
        this.deathsInfo.populationIdx
      )

      this.deathsInfo.deathRate = lastDeathCnt / totalPopulation
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
