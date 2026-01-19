<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const email = ref("");
const isLoading = ref(false);
const error = ref("");
const success = ref("");

const handleForgotPassword = async () => {
    error.value = "";
    success.value = "";
    isLoading.value = true;
    
    try {
        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email.value }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }

        success.value = data.message || 'Un email de réinitialisation a été envoyé si cette adresse existe dans notre système.';
        email.value = "";
        
        // Rediriger vers la page de connexion après 5 secondes
        setTimeout(() => {
            router.push('/login');
        }, 5000);
    } catch (e) {
        error.value = e.message || "Une erreur s'est produite. Veuillez réessayer.";
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
                    <span class="emoji">🔑</span>
                </div>
                <h1 class="title">Mot de passe oublié ?</h1>
                <p class="subtitle">Entrez votre email pour réinitialiser votre mot de passe</p>
            </div>

            <div class="card-body">
                <form @submit.prevent="handleForgotPassword" class="form">
                    <div class="input-container">
                        <label>Email</label>
                        <input
                            type="email"
                            v-model="email"
                            placeholder="votre@email.com"
                            required
                            :disabled="isLoading"
                        />
                    </div>

                    <button
                        type="submit"
                        class="login-button"
                        :disabled="isLoading"
                    >
                        <span v-if="!isLoading">Envoyer le lien de réinitialisation</span>
                        <div v-else class="spinner"></div>
                    </button>
                </form>

                <p v-if="error" style="color: #b00020; margin-top: 12px; font-size: 14px">
                    {{ error }}
                </p>
                
                <p v-if="success" style="color: #2e7d32; margin-top: 12px; font-size: 14px; line-height: 1.6">
                    {{ success }}
                </p>

                <div class="card-footer">
                    <p>
                        Vous vous souvenez de votre mot de passe ?
                        <router-link to="/login" class="signup-link">Se connecter</router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<!-- styles moved to src/assets/main.css -->