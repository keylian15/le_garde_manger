import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/Login.vue";
import RegisterView from "../views/Register.vue";
import ForgotPasswordView from "../views/ForgotPassword.vue";
import ResetPasswordView from "../views/ResetPassword.vue";
import { authStore } from "@/stores/auth";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/login",
            name: "login",
            component: LoginView,
        },
        { path: "/register", name: "register", component: RegisterView },
                {
                    path: "/forgot-password",
                    name: "forgot-password",
                    component: ForgotPasswordView,
                },
                {
                    path: "/reset-password/:token",
                    name: "reset-password",
                    component: ResetPasswordView,
                },
        {
            path: "/",
            name: "home",
            component: HomeView,
            meta: { requiresAuth: true },
        },
        {
            path: "/about",
            name: "about",
            component: () => import("../views/AboutView.vue"),
            meta: { requiresAuth: true },
        },
    ],
});

router.beforeEach((to, from, next) => {
    const isLogged = authStore.isAuthenticated;

    if (to.meta.requiresAuth && !isLogged) {
        next({ name: "login" });
    }
    // Permettre l'accès à Login, Register et pages de réinitialisation si non loggé
    else if ((to.name === "login" || to.name === "register" || to.name === "forgot-password" || to.name === "reset-password") && isLogged) {
        next({ name: "home" });
    } else {
        next();
    }
});

export default router;
