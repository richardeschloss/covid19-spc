<template>
  <div>
    <highcharts
      v-if="trendData.length > 0"
      :constructor-type="'stockChart'"
      :options="chartOptions"
    ></highcharts>
  </div>
</template>

<script>
import Stats from 'les-utils/dist/stats'

import Highcharts from 'highcharts'
import stockInit from 'highcharts/modules/stock'

if (typeof Highcharts === 'object') {
  stockInit(Highcharts)
}

export default {
  props: {
    dates: {
      type: Array,
      default: () => []
    },
    selectedState: {
      type: String,
      default: () => ''
    },
    subTitle: {
      type: String,
      default: () => ''
    },
    title: {
      type: String,
      default: () => ''
    },
    trendData: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    dailyIncreases() {
      return Stats.dailyIncreases(this.trendData)
    },

    controlStats() {
      return Stats.controlStats(this.dailyIncreases, { period: 14, factor: 2 })
    },

    chartOptions() {
      return {
        credits: {
          enabled: false
        },
        chart: {
          type: 'spline',
          zoomType: 'x'
        },
        rangeSelector: {
          selected: 0
        },
        title: {
          text: this.title
        },
        subtitle: {
          text: this.subTitle
        },
        xAxis: {
          type: 'datetime'
        },
        series: [
          {
            name: 'Daily Increases',
            color: 'purple',
            data: this.dailyIncreases.map((v, idx) => [this.dates[idx], v])
          },
          {
            name: 'Running Mean',
            color: 'black',
            dashStyle: 'Dash',
            data: this.controlStats.mean.map((v, idx) => [this.dates[idx], v])
          },
          {
            name: 'UCL',
            color: 'red',
            data: this.controlStats.ucl.map((v, idx) => [this.dates[idx], v])
          },
          {
            name: 'LCL',
            color: 'red',
            data: this.controlStats.lcl.map((v, idx) => [this.dates[idx], v])
          }
        ]
      }
    }
  }
}
</script>

<style scoped></style>
