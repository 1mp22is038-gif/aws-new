const API = CONFIG.API_URL;

let registeredEmail = "";

window.onload = () => {
    if (localStorage.getItem("token")) {
        window.location.href = "index.html";
    }
};

function showBox(id) {
    document.getElementById("login-box").classList.add("hidden");
    document.getElementById("register-box").classList.add("hidden");
    document.getElementById("otp-box").classList.add("hidden");
    document.getElementById(id).classList.remove("hidden");
}

function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
    setTimeout(() => toast.classList.remove("show"), 4000);
}

// 1. Login Handler
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        // Handle non-JSON responses (like 504 Gateway Timeout)
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error("Non-JSON response received:", text);
            throw new Error(`Server returned a ${res.status} error (Not JSON). Is the API URL correct?`);
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        localStorage.setItem("token", data.token);
        window.location.href = "index.html";
    } catch (err) {
        console.error("Login Error:", err);
        showToast(err.message, "error");
    }
});

// 2. Register Handler
document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const phone = document.getElementById("reg-phone").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    try {
        const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, email, password })
        });

        // Handle non-JSON responses (like 504 Gateway Timeout)
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error("Non-JSON response received:", text);
            throw new Error(`Server returned a ${res.status} error (Not JSON). Is the API URL correct?`);
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        registeredEmail = email;
        showToast(data.message, "success");
        showBox("login-box");
        document.getElementById("login-email").value = email;
    } catch (err) {
        console.error("Register Error:", err);
        showToast(err.message, "error");
    }
});

// 3. OTP Verification Handler
document.getElementById("otp-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const otp = document.getElementById("verify-otp").value;

    try {
        const res = await fetch(`${API}/auth/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: registeredEmail, otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast("Verified! Please Login.", "success");
        document.getElementById("login-email").value = registeredEmail;
        showBox("login-box");
    } catch (err) {
        showToast(err.message, "error");
    }
});
