<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const isLoading = ref(false);
const error = ref("");
const success = ref(false);

const handleRegister = async () => {
    error.value = "";
    if (password.value !== confirmPassword.value) {
        error.value = "Les mots de passe ne correspondent pas.";
        return;
    }

    isLoading.value = true;
    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email.value,
                password: password.value,
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur d'inscription");

        success.value = true;
        setTimeout(() => router.push("/login"), 2000);
    } catch (e) {
        error.value = e.message;
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="master-container">
        <div class="bg-decoration circle-1"></div>
        <div class="bg-decoration circle-2"></div>

        <div class="login-card">
            <div class="card-header register-header">
                <div class="logo-badge"><span class="emoji">🌱</span></div>
                <h1 class="title">Inscription</h1>
                <p class="subtitle">Créez votre compte garde-manger</p>
            </div>

            <div class="card-body">
                <div v-if="success" class="success-box">
                    Compte créé ! Redirection vers la connexion...
                </div>

                <form v-else @submit.prevent="handleRegister">
                    <div class="input-container">
                        <label>Email</label>
                        <input
                            type="email"
                            v-model="email"
                            placeholder="votre@email.com"
                            required
                        />
                    </div>
                    <div class="input-container">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            v-model="password"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div class="input-container">
                        <label>Confirmer le mot de passe</label>
                        <input
                            type="password"
                            v-model="confirmPassword"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        class="login-button"
                        :disabled="isLoading"
                    >
                        <span v-if="!isLoading">Créer mon compte</span>
                        <div v-else class="spinner"></div>
                    </button>
                </form>

                <p v-if="error" class="error-msg">{{ error }}</p>

                <div class="card-footer">
                    <p>
                        Déjà inscrit ?
                        <router-link to="/login" class="signup-link"
                            >Se connecter</router-link
                        >
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Copie directe des styles pour éviter les erreurs d'import */
.master-container {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: sans-serif;
    position: relative;
    overflow: hidden;
}
.bg-decoration {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    z-index: 0;
}
.circle-1 {
    width: 400px;
    height: 400px;
    top: -100px;
    right: -100px;
}
.circle-2 {
    width: 300px;
    height: 300px;
    bottom: -80px;
    left: -80px;
}

.login-card {
    background: white;
    width: 90%;
    max-width: 400px;
    border-radius: 24px;
    overflow: hidden;
    z-index: 1;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}
.card-header {
    background: linear-gradient(135deg, #2eb086 0%, #228b69 100%);
    padding: 40px 24px;
    text-align: center;
    color: white;
}
.register-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.logo-badge {
    background: white;
    width: 60px;
    height: 60px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    margin: 0 auto 15px;
}
.title {
    font-size: 1.5rem;
    margin: 0;
}
.card-body {
    padding: 30px;
}
.input-container {
    margin-bottom: 15px;
}
label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    font-size: 0.9rem;
}
input {
    width: 100%;
    padding: 12px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    box-sizing: border-box;
}
.login-button {
    width: 100%;
    background: #2eb086;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 10px;
}
.register-header + .card-body .login-button {
    background: #764ba2;
}
.error-msg {
    color: #b00020;
    text-align: center;
    margin-top: 10px;
}
.success-box {
    background: #e8f5e9;
    color: #2e7d32;
    padding: 15px;
    border-radius: 10px;
    text-align: center;
}
.card-footer {
    text-align: center;
    margin-top: 20px;
    border-top: 1px solid #eee;
    padding-top: 15px;
}
.signup-link {
    color: #764ba2;
    font-weight: bold;
    text-decoration: none;
}
.spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: auto;
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
