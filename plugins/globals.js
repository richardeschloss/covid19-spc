import Vue from 'vue'
import HighchartsVue from 'highcharts-vue'

import Highcharts from 'highcharts'
import stockInit from 'highcharts/modules/stock'

if (typeof Highcharts === 'object') {
  stockInit(Highcharts)
}

Vue.use(HighchartsVue)
