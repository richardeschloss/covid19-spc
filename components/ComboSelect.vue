<template>
  <div>
    <div>
      <input
        v-model="selectedItem"
        :placeholder="placeholder"
        :list="id"
        class="form-control"
      />
    </div>
    <datalist :id="id">
      <option v-for="item in items" :key="item" :value="item" />
    </datalist>
  </div>
</template>

<script>
export default {
  props: {
    id: {
      type: String,
      default: () => ''
    },
    items: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: () => ''
    },
    value: {
      type: String,
      default: () => ''
    }
  },
  computed: {
    selectedItem: {
      get() {
        return this.value
      },
      set(val) {
        if (val && this.items.includes(val)) {
          this.$emit('itemSelected', val)
        } else {
          this.$emit('input', val)
        }
      }
    }
  }
}
</script>

<style scoped></style>
