<template>
  <div style="width:25%;">
    <div>
      <input
        v-model="selectedState"
        list="states"
        placeholder="Select State"
        class="state-choice form-control"
      />
    </div>
    <datalist id="states">
      <option
        v-for="state in states"
        :key="state"
        :value="state"
        class="state-choice"
      />
    </datalist>
  </div>
</template>

<script>
export default {
  props: {
    states: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedState: ''
    }
  },
  watch: {
    selectedState(state) {
      if (state && this.states.includes(state)) {
        this.$emit('stateSelected', state)
        // this.showChart = true
        // this.summarizeCases()
      }
    }
  }
}
</script>

<style scoped></style>
