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
          id="stateSelect"
          v-model="selectedState"
          :items="casesInfo.states"
          @itemSelected="stateSelected"
          placeholder="Select State"
          class="col-md-6"
        />
        <combo-select
          id="regionSelect"
          v-model="selectedRegion"
          :items="casesInfo.regions"
          @input="regionInput"
          @itemSelected="regionSelected"
          placeholder="Select Region"
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
      <div>
        <feeds :state="selectedState" :region="selectedRegion" />
      </div>
    </div>
  </div>
</template>

<script>
import Csv from '@/utils/Csv'
import ComboSelect from '@/components/ComboSelect'
import TrendChart from '@/components/TrendChart'
import Feeds from '@/components/Feeds'

export default {
  components: {
    TrendChart,
    ComboSelect,
    Feeds
  },
  data() {
    return {
      casesTitle: 'Cases (Daily Increase) -- [select state]',
      deathsTitle: 'Deaths (Daily Increase) -- [select state]',
      deathSubTitle: 'Deaths / Population: ',
      selectedRegion: '',
      selectedState: '',
      casesInfo: {
        cases: [],
        states: [],
        regions: []
      },
      deathsInfo: {
        deaths: [],
        deathRate: 0,
        states: [],
        regions: []
      },
      totalCases: [],
      totalDeaths: []
    }
  },
  fetch() {
    this.selectedState = localStorage.getItem('selectedState') || ''
    this.selectedRegion = localStorage.getItem('selectedRegion') || ''
    const p = [process.env.casesUrl, process.env.deathsUrl].map(Csv.fetch)
    console.time('fetch')
    Promise.all(p).then(([rawCases, rawDeaths]) => {
      console.timeEnd('fetch')
      this.parseCases(rawCases)
      this.parseDeaths(rawDeaths)
      if (this.selectedState !== '') {
        this.summarizeCases()
        this.summarizeDeaths()
      }
    })
  },
  fetchOnServer: false,
  methods: {
    parseCases({ hdr, data }) {
      const datesIdx = Csv.propIdx(hdr, 'Combined_Key', 1)
      const dates = hdr.slice(datesIdx).map((d) => new Date(d).getTime())
      const regionIdx = Csv.propIdx(hdr, 'Admin2')
      const statesIdx = Csv.propIdx(hdr, 'Province_State')
      const states = Csv.uniqueByColumn(data, statesIdx)
      Object.assign(this.casesInfo, {
        datesIdx,
        dates,
        regionIdx,
        statesIdx,
        states,
        cases: data
      })
    },
    parseDeaths({ hdr, data }) {
      const populationIdx = Csv.propIdx(hdr, 'Population')
      const datesIdx = populationIdx + 1
      const dates = hdr.slice(datesIdx).map((d) => new Date(d).getTime())
      const regionIdx = Csv.propIdx(hdr, 'Admin2')
      const statesIdx = Csv.propIdx(hdr, 'Province_State')
      const states = Csv.uniqueByColumn(data, statesIdx)
      Object.assign(this.deathsInfo, {
        hdr,
        populationIdx,
        datesIdx,
        dates,
        regionIdx,
        statesIdx,
        states,
        deaths: data
      })
    },
    regionInput(input) {
      if (input === '') {
        this.selectedRegion = ''
        this.summarizeCases()
        this.summarizeDeaths()
      }
    },
    regionSelected(region) {
      localStorage.setItem('selectedRegion', region)
      this.$emit('stateSelected', region)
      this.selectedRegion = region
      this.summarizeCases()
      this.summarizeDeaths()
    },
    stateSelected(state) {
      localStorage.setItem('selectedState', state)
      this.$emit('stateSelected', state)
      this.selectedState = state
      this.selectedRegion = ''
      localStorage.setItem('selectedRegion', '')
      this.summarizeCases()
      this.summarizeDeaths()
    },
    summarizeCases() {
      let filtered = Csv.filterRows(
        this.casesInfo.cases,
        this.selectedState,
        this.casesInfo.statesIdx
      )

      this.casesInfo.regions = Csv.extractColumn(
        filtered,
        this.casesInfo.regionIdx
      )
      if (this.selectedRegion !== '') {
        filtered = Csv.filterRows(
          this.casesInfo.cases,
          this.selectedRegion,
          this.casesInfo.regionIdx
        )

        this.totalCases = Csv.subtotals(filtered, this.casesInfo.datesIdx)
        this.casesTitle = `Cases (Daily Increase) -- ${this.selectedRegion}, ${this.selectedState}`
      } else {
        this.totalCases = Csv.subtotals(filtered, this.casesInfo.datesIdx)
        this.casesTitle = `Cases (Daily Increase) -- ${this.selectedState}`
      }
    },
    summarizeDeaths() {
      let filtered
      if (this.selectedRegion !== '') {
        filtered = Csv.filterRows(
          this.deathsInfo.deaths,
          this.selectedRegion,
          this.deathsInfo.regionIdx
        )

        this.deathsTitle = `Deaths (Daily Increase) -- ${this.selectedRegion}, ${this.selectedState}`
      } else {
        filtered = Csv.filterRows(
          this.deathsInfo.deaths,
          this.selectedState,
          this.deathsInfo.statesIdx
        )

        this.deathsInfo.regions = Csv.extractColumn(
          filtered,
          this.deathsInfo.regionIdx
        )
        this.deathsTitle = `Deaths (Daily Increase) -- ${this.selectedState}`
      }
      this.totalDeaths = Csv.subtotals(filtered, this.deathsInfo.datesIdx)

      const lastDeathCnt = this.totalDeaths[this.totalDeaths.length - 1]
      const totalPopulation = Csv.sumColumn(
        filtered,
        this.deathsInfo.populationIdx
      )

      this.deathsInfo.deathRate = lastDeathCnt / totalPopulation
      this.deathSubTitle = `Deaths / Population: ${(
        this.deathsInfo.deathRate * 100
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
