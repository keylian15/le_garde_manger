<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authStore } from "@/stores/auth";

const router = useRouter();
const email = ref("");
const password = ref("");
const isLoading = ref(false);
const error = ref("");

const handleLogin = async () => {
    error.value = "";
    isLoading.value = true;
    try {
        const qs = new URLSearchParams({ u: email.value, p: password.value }).toString();
        const res = await fetch(`/api/auth/login?${qs}`, { method: 'POST' });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!data.ok) throw new Error('Identifiants invalides');
        authStore.login(email.value, password.value);
        if (data.token) authStore.setToken(data.token);
        router.push('/');
    } catch (e) {
        error.value = e.message || 'Connexion échouée';
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
                    <span class="emoji">🥕</span>
                </div>
                <h1 class="title">Mon Garde-Manger</h1>
                <p class="subtitle">Gérez vos stocks, évitez le gaspillage</p>
            </div>

            <div class="card-body">
                <form @submit.prevent="handleLogin" class="form">
                    <div class="input-container">
                        <label>Email</label>
                        <input
                            type="text"
                            v-model="email"
                            placeholder="votre@email.com"
                            required
                        />
                    </div>

                    <div class="input-container">
                        <div class="label-row">
                            <label>Mot de passe</label>
                            <a href="#" class="forgot-link">Oublié ?</a>
                        </div>
                        <input
                            type="password"
                            v-model="password"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        class="login-button"
                        :disabled="isLoading"
                    >
                        <span v-if="!isLoading">Se connecter</span>
                        <div v-else class="spinner"></div>
                    </button>
                </form>
                <p v-if="error" style="color:#b00020; margin-top:8px;">{{ error }}</p>

                <div class="card-footer">
                    <p>
                        Nouveau ici ?
                        <a href="#" class="signup-link">Créer un compte</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 1. Reset & Fond */
.master-container {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    position: relative;
    overflow: auto;
}

/* 2. Décorations d'arrière-plan */
.bg-decoration {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    z-index: 0;
    animation: float 6s ease-in-out infinite;
}
.circle-1 {
    width: 400px;
    height: 400px;
    top: -100px;
    right: -100px;
    animation-delay: 0s;
}
.circle-2 {
    width: 300px;
    height: 300px;
    bottom: -80px;
    left: -80px;
    animation-delay: 2s;
}
.circle-3 {
    width: 200px;
    height: 200px;
    top: 50%;
    left: -50px;
    animation-delay: 4s;
}

@keyframes float {
    0%,
    100% {
        transform: translateY(0) scale(1);
    }
    50% {
        transform: translateY(-20px) scale(1.05);
    }
}

/* 3. Carte */
.login-card {
    background: white;
    width: 90%;
    max-width: 400px;
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    z-index: 1;
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 4. Header */
.card-header {
    background: linear-gradient(135deg, #2eb086 0%, #228b69 100%);
    padding: 80px 24px 24px; /* + de place en haut */
    text-align: center;
    color: white;
    position: relative;
}

.logo-badge {
    margin: 0 auto 16px; /* centre et espace */
    background: white;
    width: 80px;
    height: 80px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.title {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
}
.subtitle {
    font-size: 0.9rem;
    opacity: 0.9;
    margin: 0;
    font-weight: 400;
}

/* 5. Formulaire & Inputs */
.card-body {
    padding: 32px 28px 28px;
}

.input-container {
    margin-bottom: 18px;
}

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #2d3748;
    display: block;
    margin-bottom: 8px;
}

input {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.95rem;
    background-color: white !important;
    transition: all 0.2s ease;
    font-family: inherit;
    box-sizing: border-box;
}

input::placeholder {
    color: #a0aec0;
}

input:focus {
    outline: none;
    border-color: #2eb086;
    background-color: white !important;
    box-shadow: 0 0 0 3px rgba(46, 176, 134, 0.1);
}

/* Force background blanc sur autofill */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px white inset !important;
    box-shadow: 0 0 0 30px white inset !important;
}

/* 6. Bouton principal */
.login-button {
    width: 100%;
    background: linear-gradient(135deg, #2eb086 0%, #269672 100%);
    color: white;
    border: none;
    padding: 14px;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 8px;
    box-shadow: 0 4px 12px rgba(46, 176, 134, 0.3);
    font-family: inherit;
}

.login-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(46, 176, 134, 0.4);
}

.login-button:active:not(:disabled) {
    transform: translateY(0);
}
.login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

/* 7. Divider */
.divider {
    display: flex;
    align-items: center;
    margin: 20px 0 18px;
    color: #a0aec0;
    font-size: 0.8rem;
    font-weight: 500;
}

.divider::before,
.divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e2e8f0;
}

.divider span {
    padding: 0 12px;
}

/* 8. Boutons sociaux */
.social-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
}

.social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    color: #1f2937;
}

.social-btn img {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.apple-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.social-btn span {
    white-space: nowrap;
}

.social-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e0;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 9. Footer */
.card-footer {
    text-align: center;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
}
.card-footer p {
    color: #718096;
    font-size: 0.875rem;
    margin: 0;
}
.forgot-link,
.signup-link {
    color: #2eb086;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.875rem;
    transition: color 0.2s ease;
}
.forgot-link:hover,
.signup-link:hover {
    color: #269672;
    text-decoration: underline;
}

/* 10. Animations */
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* 11. Responsive */
@media (max-width: 480px) {
    .login-card {
        width: 95%;
        border-radius: 20px;
        max-width: 380px;
    }

    .card-body {
        padding: 28px 24px 24px;
    }

    .social-buttons {
        grid-template-columns: 1fr;
    }

    .social-btn {
        padding: 12px 16px;
    }

    .title {
        font-size: 1.5rem;
    }

    .card-header {
        padding: 55px 20px 20px;
    }
}
</style>
