import { reactive } from "vue";

export const authStore = reactive({
    isAuthenticated: localStorage.getItem("user_logged") === "true",
    email: localStorage.getItem("user_email") || "",
    password: localStorage.getItem("user_password") || "",
    token: localStorage.getItem("user_token") || "",
    login(email, password) {
        this.isAuthenticated = true;
        this.email = email;
        this.password = password;
        localStorage.setItem("user_logged", "true");
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_password", password);
    },
    setToken(token) {
        this.token = token || "";
        if (this.token) {
            localStorage.setItem("user_token", this.token);
        } else {
            localStorage.removeItem("user_token");
        }
    },
    logout() {
        this.isAuthenticated = false;
        this.email = "";
        this.password = "";
        this.token = "";
        localStorage.removeItem("user_logged");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_password");
        localStorage.removeItem("user_token");
    },
});
