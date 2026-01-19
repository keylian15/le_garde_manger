<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/debug/users')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    users.value = await res.json()
  } catch (e) {
    error.value = e.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="about">
    <section class="intro">
      <h1>À propos du Garde-Manger</h1>
      <p>
        Cette application permet de gérer un garde-manger (aliments, plats, etc.)
      </p>  
    </section>

    <section class="users">
      <h2>Nos chers Utilisateurs</h2>
      <div v-if="loading" class="state">Chargement…</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <table v-else >
        Merci a vous ! 
      </table>
    </section>
  </main>
  
</template>

<style scoped>
.about { max-width: 960px; margin: 2rem auto; padding: 0 1rem; display: grid; gap: 1.25rem; }
.intro h1 { margin: 0 0 0.5rem; }
.note { color: #8a6d3b; background: #fff3cd; border: 1px solid #ffeeba; padding: 0.5rem 0.75rem; border-radius: 8px; }
.state { color: #666; }
.state.error { color: #b00020; }
.table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
.table th, .table td { padding: 0.5rem 0.6rem; border-bottom: 1px solid #eee; text-align: left; }
.table th { background: #fafafa; font-weight: 600; }
.table .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.85rem; }
.empty { color: #666; text-align: center; }
</style>
