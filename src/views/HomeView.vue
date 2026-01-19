<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { authStore } from "@/stores/auth";

const q = ref("");
const type = ref(""); // '', 'aliment', 'plat', 'dessert', 'boisson', 'hippo'
const foods = ref([]);
const loading = ref(false);
const error = ref("");

// Create form state
const newName = ref("");
const newType = ref("");
const newCalories = ref("");
const newDesc = ref("");
const addLoading = ref(false);
const addError = ref("");

const authHeader = computed(() => {
    if (authStore.token) {
        return "Bearer " + authStore.token;
    }
    if (authStore.isAuthenticated && authStore.email && authStore.password) {
        return "Basic " + btoa(`${authStore.email}:${authStore.password}`);
    }
    return "";
});

async function fetchFoods(term = "", t = type.value) {
    loading.value = true;
    error.value = "";
    try {
        const params = new URLSearchParams();
        if (term) params.set("q", term);
        if (t) params.set("type", t);
        const qs = params.toString();
        if (!authHeader.value) throw new Error("Veuillez vous connecter");
        const res = await fetch(`/api/foods${qs ? `?${qs}` : ""}`, {
            headers: { Authorization: authHeader.value },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        foods.value = await res.json();
    } catch (e) {
        error.value = e.message || "Erreur lors du chargement";
    } finally {
        loading.value = false;
    }
}

let debounceTimer;
watch(q, (val) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchFoods(val, type.value), 300);
});

watch(type, (val) => {
    fetchFoods(q.value, val);
});

onMounted(() => {
    if (authStore.isAuthenticated) {
        fetchFoods();
    }
});

async function addFood() {
    addError.value = "";
    if (!authHeader.value) {
        addError.value = "Veuillez vous connecter";
        return;
    }
    if (!newName.value || !newType.value) {
        addError.value = "Nom et type requis";
        return;
    }
    addLoading.value = true;
    try {
        const res = await fetch("/api/foods", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader.value,
            },
            body: JSON.stringify({
                name: newName.value,
                type: newType.value,
                calories:
                    newCalories.value === "" ? null : Number(newCalories.value),
                description: newDesc.value || null,
            }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Reset form
        newName.value = "";
        newType.value = "";
        newCalories.value = "";
        newDesc.value = "";
        // Refresh list
        await fetchFoods(q.value, type.value);
    } catch (e) {
        addError.value = e.message || "Erreur lors de l'ajout";
    } finally {
        addLoading.value = false;
    }
}

// Inline edit/delete state and actions
const editingId = ref(null);
const editName = ref("");
const editType = ref("");
const editCalories = ref("");
const editDesc = ref("");
const editLoading = ref(false);
const listError = ref("");

function startEdit(f) {
    editingId.value = f.id;
    editName.value = f.name;
    editType.value = f.type;
    editCalories.value = f.calories == null ? "" : String(f.calories);
    editDesc.value = f.description || "";
}

function cancelEdit() {
    editingId.value = null;
    editName.value = "";
    editType.value = "";
    editCalories.value = "";
    editDesc.value = "";
    listError.value = "";
}

async function saveEdit(id) {
    listError.value = "";
    if (!authHeader.value) {
        listError.value = "Veuillez vous connecter";
        return;
    }
    if (!editName.value || !editType.value) {
        listError.value = "Nom et type requis";
        return;
    }
    editLoading.value = true;
    try {
        const res = await fetch(`/api/foods/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader.value,
            },
            body: JSON.stringify({
                name: editName.value,
                type: editType.value,
                calories:
                    editCalories.value === ""
                        ? null
                        : Number(editCalories.value),
                description: editDesc.value || null,
            }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        cancelEdit();
        await fetchFoods(q.value, type.value);
    } catch (e) {
        listError.value = e.message || "Erreur lors de la modification";
    } finally {
        editLoading.value = false;
    }
}

async function deleteFood(id) {
    listError.value = "";
    if (!authHeader.value) {
        listError.value = "Veuillez vous connecter";
        return;
    }
    try {
        const res = await fetch(`/api/foods/${id}`, {
            method: "DELETE",
            headers: { Authorization: authHeader.value },
        });
        if (!res.ok && res.status !== 204)
            throw new Error(`HTTP ${res.status}`);
        if (editingId.value === id) cancelEdit();
        await fetchFoods(q.value, type.value);
    } catch (e) {
        listError.value = e.message || "Erreur lors de la suppression";
    }
}
</script>

<template>
    <main class="container">
        <h1>Garde-manger</h1>

        <div class="create">
            <h2>Ajouter un aliment</h2>
            <div class="form-container">
                <input v-model="newName" placeholder="Nom (obligatoire)" />
                <select v-model="newType">
                    <option value="">Type…</option>
                    <option value="aliment">Aliment</option>
                    <option value="plat">Plat</option>
                    <option value="dessert">Dessert</option>
                    <option value="boisson">Boisson</option>
                    <option value="hippo">Hippo</option>
                </select>
                <input
                    v-model="newCalories"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Calories (optionnel)"
                />
                <input
                    v-model="newDesc"
                    placeholder="Description (optionnel)"
                />
                <button @click="addFood" :disabled="addLoading" class="btn-add">
                    {{ addLoading ? "Ajout…" : "Ajouter" }}
                </button>
            </div>
            <div v-if="addError" class="state error" style="margin-top: 0.5rem">
                {{ addError }}
            </div>
        </div>

        <div class="search">
            <label for="q">Rechercher un aliment</label>
            <input
                id="q"
                v-model="q"
                type="text"
                placeholder="Ex: riz, pâtes, lait"
            />
        </div>

        <div class="filters">
            <button
                v-for="t in [
                    '',
                    'aliment',
                    'plat',
                    'dessert',
                    'boisson',
                    'hippo',
                ]"
                :key="t || 'all'"
                class="chip"
                :class="{ active: type === t }"
                @click="type = t"
            >
                {{ t || "Tous" }}
            </button>
        </div>

        <div v-if="loading" class="state">Chargement…</div>
        <div v-else-if="error" class="state error">{{ error }}</div>
        <div v-else>
            <div
                v-if="listError"
                class="state error"
                style="margin-bottom: 0.5rem"
            >
                {{ listError }}
            </div>
            <ul class="list">
                <li v-if="foods.length === 0" class="empty">Aucun élément</li>
                <li v-for="f in foods" :key="f.id" class="item">
                    <template v-if="editingId === f.id">
                        <div class="row">
                            <input v-model="editName" placeholder="Nom" />
                            <select v-model="editType">
                                <option value="aliment">aliment</option>
                                <option value="plat">plat</option>
                                <option value="dessert">dessert</option>
                                <option value="boisson">boisson</option>
                                <option value="hippo">hippo</option>
                            </select>
                            <input
                                v-model="editCalories"
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Calories"
                            />
                        </div>
                        <input v-model="editDesc" placeholder="Description" />
                        <div class="actions">
                            <button
                                class="primary"
                                :disabled="editLoading"
                                @click="saveEdit(f.id)"
                            >
                                {{
                                    editLoading
                                        ? "Enregistrement…"
                                        : "Enregistrer"
                                }}
                            </button>
                            <button @click="cancelEdit">Annuler</button>
                        </div>
                    </template>
                    <template v-else>
                        <div>
                            <span class="name">{{ f.name }}</span>
                            <span class="meta"
                                >• {{ f.type
                                }}<template v-if="f.calories != null">
                                    • {{ f.calories }} kcal</template
                                ></span
                            >
                        </div>
                        <div v-if="f.description" class="desc">
                            {{ f.description }}
                        </div>
                        <div class="actions">
                            <button @click="startEdit(f)">Modifier</button>
                            <button class="danger" @click="deleteFood(f.id)">
                                Supprimer
                            </button>
                        </div>
                    </template>
                </li>
            </ul>
        </div>
    </main>
</template>

<style scoped>
.container {
    max-width: 900px; /* Augmenté un peu pour laisser respirer le formulaire */
    margin: 2rem auto;
    padding: 0 1rem;
}

/* Encadré de création */
.create {
    margin: 1rem 0 2rem;
    padding: 1.25rem;
    border: 1px solid #eee;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.create h2 {
    font-size: 1.1rem;
    margin: 0 0 1rem;
    color: #333;
}

/* Grille du formulaire */
.form-container {
    display: grid;
    /* On définit des proportions pour chaque colonne */
    grid-template-columns: 1.5fr 1fr 1fr 2fr auto;
    gap: 0.75rem;
    align-items: center;
}

.form-container input,
.form-container select {
    padding: 0.6rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    width: 100%;
}

.btn-add {
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    border: none;
    background: #2e7d32;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
}

.btn-add:hover:not(:disabled) {
    background: #1b5e20;
}

.btn-add:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Adaptabilité pour les petits écrans */
@media (max-width: 768px) {
    .form-container {
        grid-template-columns: 1fr 1fr; /* Deux colonnes sur tablette */
    }
    .btn-add {
        grid-column: span 2; /* Le bouton prend toute la largeur */
    }
}

/* Reste des styles existants conservés */
.search {
    display: grid;
    gap: 0.5rem;
    margin: 1rem 0 1.5rem;
}
input[type="text"] {
    padding: 0.6rem 0.8rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    width: 100%;
}
.state {
    color: #666;
}
.state.error {
    color: #b00020;
}
.list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
    max-height: 60vh;
    overflow-y: auto;
}
.item {
    padding: 0.8rem 1rem;
    border: 1px solid #eee;
    border-radius: 8px;
    background: #fff;
}
.name {
    font-weight: 600;
}
.meta {
    color: #666;
    margin-left: 0.5rem;
}
.desc {
    color: #444;
    margin-top: 0.25rem;
    font-size: 0.9rem;
}
.filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.5rem 0 1rem;
}
.chip {
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    border: 1px solid #ddd;
    background: #fafafa;
    cursor: pointer;
    font-size: 0.85rem;
}
.chip.active {
    background: #e8f0fe;
    border-color: #90caf9;
    color: #1967d2;
}
.row {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr 0.6fr;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}
.actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}
.actions button {
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    border: 1px solid #ddd;
    background: #fafafa;
    cursor: pointer;
    font-size: 0.85rem;
}
.actions .primary {
    background: #1976d2;
    border-color: #1565c0;
    color: #fff;
}
.actions .danger {
    background: #d32f2f;
    border-color: #c62828;
    color: #fff;
}
</style>
