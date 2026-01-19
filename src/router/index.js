import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/Login.vue";
import RegisterView from "../views/Register.vue";
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
    // Permettre l'accès à Login et Register si non loggé
    else if ((to.name === "login" || to.name === "register") && isLogged) {
        next({ name: "home" });
    } else {
        next();
    }
});

export default router;
