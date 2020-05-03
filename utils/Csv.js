import axios from 'axios'

const Csv = {
  extractColumn(arr, col) {
    return arr.map((r) => r[col])
  },
  async fetch(url) {
    const { data } = await axios.get(url)
    const raw = Csv.parse(data)
    return { hdr: raw[0], data: raw.slice(1) }
  },
  filterRows(data, prop, colIdx) {
    return data.filter((r) => r[colIdx] === prop)
  },
  parse(data) {
    return data
      .trim()
      .replace(/".+"/g, '---')
      .split('\n')
      .map((r) => r.split(','))
  },
  propIdx(hdr, prop, offset = 0) {
    return hdr.findIndex((p) => p === prop) + offset
  },
  subtotals(arr, offset) {
    return arr
      .map((r) => r.slice(offset))
      .reduce((cum, cols) => {
        if (cum.length === 0) {
          cum = Array(cols.length).fill(0)
        }
        return cols.map((col, idx) => (cum[idx] += parseInt(col)))
      }, [])
  },
  sumColumn(arr, col) {
    return arr
      .map((r) => r[col])
      .reduce((cum, val) => (cum += parseInt(val)), 0)
  },
  uniqueByColumn(arr, col) {
    return Array.from(new Set(arr.map((r) => r[col]))).sort()
  }
}

export default Csv
