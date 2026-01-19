<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const newPassword = ref("");
const confirmPassword = ref("");
const isLoading = ref(false);
const error = ref("");
const success = ref("");
const token = ref("");

onMounted(() => {
    token.value = route.params.token || "";
    if (!token.value) {
        error.value = "Token de réinitialisation manquant.";
    }
});

const handleResetPassword = async () => {
    error.value = "";
    success.value = "";

    // Validation
    if (newPassword.value !== confirmPassword.value) {
        error.value = "Les mots de passe ne correspondent pas.";
        return;
    }

    if (newPassword.value.length < 6) {
        error.value = "Le mot de passe doit contenir au moins 6 caractères.";
        return;
    }

    isLoading.value = true;

    try {
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token.value,
                newPassword: newPassword.value,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }

        success.value = data.message || 'Votre mot de passe a été réinitialisé avec succès !';
        newPassword.value = "";
        confirmPassword.value = "";

        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
            router.push('/login');
        }, 3000);
    } catch (e) {
        if (e.message.includes('Token invalide') || e.message.includes('Token expiré')) {
            error.value = "Ce lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.";
        } else {
            error.value = e.message || "Une erreur s'est produite. Veuillez réessayer.";
        }
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="master-container">
        <div class="bg-decoration circle-1"></div>
        <div class="bg-decoration circle-2"></div>
        <div class="bg-decoration circle-3"></div>

        <div class="login-card">
            <div class="card-header">
                <div class="logo-badge">
                    <span class="emoji">🔐</span>
                </div>
                <h1 class="title">Nouveau mot de passe</h1>
                <p class="subtitle">Choisissez un nouveau mot de passe sécurisé</p>
            </div>

            <div class="card-body">
                <form @submit.prevent="handleResetPassword" class="form">
                    <div class="input-container">
                        <label>Nouveau mot de passe</label>
                        <input
                            type="password"
                            v-model="newPassword"
                            placeholder="••••••••"
                            required
                            :disabled="isLoading || !token"
                            minlength="6"
                        />
                    </div>

                    <div class="input-container">
                        <label>Confirmer le mot de passe</label>
                        <input
                            type="password"
                            v-model="confirmPassword"
                            placeholder="••••••••"
                            required
                            :disabled="isLoading || !token"
                            minlength="6"
                        />
                    </div>

                    <button
                        type="submit"
                        class="login-button"
                        :disabled="isLoading || !token"
                    >
                        <span v-if="!isLoading">Réinitialiser mon mot de passe</span>
                        <div v-else class="spinner"></div>
                    </button>
                </form>

                <p v-if="error" style="color: #b00020; margin-top: 12px; font-size: 14px; line-height: 1.6">
                    {{ error }}
                </p>

                <p v-if="success" style="color: #2e7d32; margin-top: 12px; font-size: 14px; line-height: 1.6">
                    {{ success }}
                </p>

                <div class="card-footer">
                    <p>
                        <router-link to="/login" class="signup-link">Retour à la connexion</router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<!-- styles moved to src/assets/main.css -->
