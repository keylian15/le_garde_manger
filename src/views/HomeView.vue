<script setup>
import { ref, onMounted, watch } from 'vue'

const q = ref('')
const type = ref('') // '', 'aliment', 'plat', 'dessert', 'boisson', 'hippo'
const foods = ref([])
const loading = ref(false)
const error = ref('')

async function fetchFoods(term = '', t = type.value) {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (term) params.set('q', term)
    if (t) params.set('type', t)
    const qs = params.toString()
    const res = await fetch(`/api/foods${qs ? `?${qs}` : ''}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    foods.value = await res.json()
  } catch (e) {
    error.value = e.message || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

let debounceTimer
watch(q, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchFoods(val, type.value), 300)
})

watch(type, (val) => {
  fetchFoods(q.value, val)
})

onMounted(() => {
  fetchFoods()
})
</script>

<template>
  <main class="container">
    <h1>Garde-manger</h1>

    <div class="search">
      <label for="q">Rechercher un aliment</label>
      <input id="q" v-model="q" type="text" placeholder="Ex: riz, pâtes, lait" />
    </div>

    <div class="filters">
      <button
        v-for="t in ['', 'aliment', 'plat', 'dessert', 'boisson', 'autre']"
        :key="t || 'all'"
        class="chip"
        :class="{ active: type === t }"
        @click="type = t"
      >
        {{ t || 'Tous' }}
      </button>
    </div>

    <div v-if="loading" class="state">Chargement…</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <ul v-else class="list">
      <li v-if="foods.length === 0" class="empty">Aucun élément</li>
      <li v-for="f in foods" :key="f.id" class="item">
        <span class="name">{{ f.name }}</span>
        <span class="meta">• {{ f.type }}<template v-if="f.calories != null"> • {{ f.calories }} kcal</template></span>
        <div v-if="f.description" class="desc">{{ f.description }}</div>
      </li>
    </ul>
  </main>
  
</template>

<style scoped>
.container {
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 1rem;
}
.search {
  display: grid;
  gap: 0.5rem;
  margin: 1rem 0 1.5rem;
}
input[type="text"] {
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.state { color: #666; }
.state.error { color: #b00020; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
.item { padding: 0.6rem 0.8rem; border: 1px solid #eee; border-radius: 8px; background: #fff; }
.empty { color: #666; padding: 0.6rem 0.8rem; }
.name { font-weight: 600; }
.meta { color: #666; margin-left: 0.5rem; }
.desc { color: #444; margin-top: 0.25rem; }
.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0 1rem; }
.chip { padding: 0.35rem 0.7rem; border-radius: 999px; border: 1px solid #ddd; background: #fafafa; cursor: pointer; }
.chip.active { background: #e8f0fe; border-color: #90caf9; }
</style> 
