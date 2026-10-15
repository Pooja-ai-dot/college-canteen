const foodList = document.getElementById("food-list");
const cartItemsElement = document.getElementById("cart-items");
const cartCountElement = document.getElementById("cart-count");
const cartTotalElement = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-btn");

const pickupTimeInput = document.getElementById("pickup-time");
const paymentMethodInput = document.getElementById("payment-method");

const orderModal = document.getElementById("order-success-modal");
const successOrderId = document.getElementById("success-order-id");
const successPickupTime = document.getElementById("success-pickup-time");
const successOrderTotal = document.getElementById("success-order-total");
const closeOrderModal = document.getElementById("close-order-modal");

const authModal = document.getElementById("auth-modal");
const loginOpenBtn = document.getElementById("login-open-btn");
const authCloseBtn = document.getElementById("auth-close-btn");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authMessage = document.getElementById("auth-message");
const authNameField = document.getElementById("name-field");
const authName = document.getElementById("auth-name");
const authIdentifier = document.getElementById("auth-identifier");
const authPassword = document.getElementById("auth-password");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authStatus = document.getElementById("auth-status");
const authSwitchLabel = document.getElementById("auth-switch-label");
const authSwitchBtn = document.getElementById("auth-switch-btn");

const myOrdersSection = document.getElementById("my-orders-section");
const myOrdersList = document.getElementById("my-orders-list");
const profileOrdersBtn = document.getElementById("profile-orders-btn");
const backProfileBtn = document.getElementById("back-profile-btn");
const logoutBtn = document.getElementById("logout-btn");

const profileDrawer = document.getElementById("profile-drawer");
const profileOverlay = document.getElementById("profile-overlay");
const closeProfileButton = document.getElementById("close-profile");

const categoryContainer = document.getElementById("menu-categories");
const cartLink = document.querySelector(".cart-link");
const cartSection = document.getElementById("cart");


const foodSearchInput = document.getElementById("food-search");
const clearFoodSearchButton = document.getElementById("clear-food-search");
/* =========================================
   STATE
========================================= */

let foods = [];
let selectedCategory = "All";
let cart = [];
let authMode = "login";


/* =========================================
   FOOD HELPERS
========================================= */

function getFoodName(food) {
    return food.item_name ||
        food.food_name ||
        food.name ||
        "Food item";
}

function getFoodPrice(food) {
    const price = Number(food.price ?? 0);
    return Number.isFinite(price) && price >= 0 ? price : 0;
}

function getFoodId(food) {
    return food.item_id ?? food.food_id ?? food.id ?? getFoodName(food);
}

function normalizeCategory(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function getFoodImage(food) {
    const name = getFoodName(food).toLowerCase();

    const imageMap = [
        ["kulhad tea", "kulhadtea.jpg"],
        ["regular hot coffee", "regularhotcoffee.jpg"],
        ["creamy froth tea coffee", "creamforthyteacoffee.jpg"],
        ["green tea", "greentea.jpg"],
        ["lemon tea", "lemontea.jpg"],
        ["kulhad lassi", "kulhadlassi.jpg"],
        ["veg cheese sandwich", "vegcheesesandwich.jpg"],
        ["veg grill sandwich", "veggrilledsandwiches.jpg"],
        ["tandoori paneer sandwich", "tandooripaneersandwiches.jpg"],
        ["salted fries", "saltedfries.jpg"],
        ["peri peri fries", "perperifries.jpg"],
        ["cheese loaded fries", "cheeseloadedfries.jpg"],
        ["samosa", "samosa.jpg"],
        ["bread pakoda", "breadpakoda.jpg"],
        ["kachori with sabzi", "kachoriwithsabzi.jpg"],
        ["veg spring roll", "vegspringroll.jpg"],
        ["paneer cutlet", "paneercutlet.jpg"],
        ["paneer kulcha", "paneerkulcha.jpg"],
        ["plain maggi", "plainmaggie.jpg"],
        ["veg maggi", "vegmaggie.jpg"],
        ["cheese maggi", "cheesemaggie.jpg"],
        ["pav bhaji", "pavbhaji.jpg"],
        ["veg chowmein", "vegchowmin.jpg"],
        ["chilli garlic noodles", "chilligarlicnoodles.jpg"],
        ["paneer noodles", "paneernoodles.jpg"],
        ["veg fried rice", "vegfriedrice.jpg"],
        ["chilli garlic rice", "chilligarlicrice.jpg"],
        ["paneer fried rice", "paneerfriedrice.jpg"],
        ["honey chilli potato", "honeychillipotato.jpg"],
        ["chilli potato", "chillipotato.jpg"],
        ["red sauce pasta", "redsaucepasta.jpg"],
        ["white sauce pasta", "whitesaucepasta.jpg"],
        ["plain dosa", "plaindosa.jpg"],
        ["masala dosa", "masaladosa.jpg"],
        ["paneer dosa", "paneerdosa.jpg"],
        ["veg uttapam", "veguttapam.jpg"],
        ["paneer uttapam", "paneeruttam.jpg"],
        ["vada sambar", "vadasambar.jpg"],
        ["idli sambar", "idlisambar.jpg"],
        ["fried idli", "friedidli.jpg"],
        ["lemon rice", "lemonrice.jpg"],
        ["curd rice", "curdrice.jpg"],
        ["poori chole", "poorichole.jpg"],
        ["chole bhature", "cholebhature.jpg"],
        ["aloo poori", "aloopoori.jpg"],
        ["aloo paratha", "alooparatha.jpg"],
        ["aloo pyaz paratha", "aloopyazparatha.jpg"],
        ["paneer pyaz paratha", "paneerpyazparatha.jpg"],
        ["mix paratha", "mixparatha.jpg"],
        ["4 roti with sabzi", "4rotiwithsabji.jpg"],
        ["4 roti with dal", "4rotiwithdal.jpg"],
        ["regular thali", "regularthali.jpg"],
        ["special thali", "specialthali.jpg"],
        ["veg roll", "vegroll.jpg"],
        ["veg paneer roll", "vegpaneerroll.jpg"],
        ["malai chaap roll", "malaichaaproll.jpg"],
        ["veg cheese wrap", "vegcheesewrap.jpg"],
        ["chole rice", "cholerice.jpg"],
        ["rajma rice", "rajmarice.jpg"],
        ["kadhi rice", "kadhirice.jpg"],
        ["paneer rice", "paneerrice.jpg"],
        ["cold coffee", "coldcoffee.jpg"],
        ["mango shake", "mangoshake.jpg"],
        ["blueberry shake", "blueberryshake.jpg"],
        ["strawberry shake", "strawberryshake.jpg"],
        ["peach ice tea", "peachicetea.jpg"],
        ["veg grill burger", "veggrillburger.jpg"]

    ];

    const match = imageMap.find(([foodName]) => name.includes(foodName));

    if (match) {
        return "images/" + match[1];
    }

    if (name.includes("tea")) {
        return "images/tea.jpg";
    }

    return "images/food.jpg";
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatPrice(price) {
    return "₹" + Number(price).toFixed(2);
}


/* =========================================
   LOAD FOOD MENU
========================================= */

async function loadFoods() {
    try {
        const response = await fetch("/api/foods");

        if (!response.ok) {
            throw new Error("Server error: " + response.status);
        }

        const data = await response.json();

        // Supports either an array or { foods: [...] }.
        foods = Array.isArray(data)
            ? data
            : Array.isArray(data.foods)
                ? data.foods
                : [];

        displayFoods();

    } catch (error) {
        console.error("Could not load food menu:", error);

        foodList.innerHTML =
            '<p class="status-message">Could not load the menu. Please check your backend connection.</p>';
    }
}


/* =========================================
   DISPLAY FOOD MENU
========================================= */


function displayFoods() {
    if (!foods.length) {
        foodList.innerHTML =
            '<p class="status-message">No food items found in the menu yet.</p>';
        return;
    }

    const aliases = {
        "tea and beverages": ["tea beverages", "beverages", "tea"],
        "chinese wok": ["chinese"],
        "student s favourite": ["students favourite", "student favourite"]
    };

    const selected = normalizeCategory(selectedCategory);

    const allowedCategories = [
        selected,
        ...(aliases[selected] || [])
    ].map(normalizeCategory);

    const searchText = foodSearchInput
        ? foodSearchInput.value.trim().toLowerCase()
        : "";

    const filteredFoods = foods.filter(food => {
        const category = normalizeCategory(
            food.category || food.category_name || ""
        );

        const name = (
            getFoodName(food) || ""
        ).toLowerCase();

        const matchesCategory =
            selectedCategory === "All" ||
            allowedCategories.includes(category);

        const matchesSearch =
            !searchText ||
            name.includes(searchText) ||
            category.includes(searchText);

        return matchesCategory && matchesSearch;
    });

    if (!filteredFoods.length) {
        foodList.innerHTML =
            '<p class="status-message">No matching food found. Try another search.</p>';
        return;
    }

    foodList.innerHTML = filteredFoods.map((food, index) => `
        <article class="food-card">
            <div class="food-image">
                <img
                    src="${escapeHTML(getFoodImage(food))}"
                    alt="${escapeHTML(getFoodName(food))}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='images/food.jpg';"
                >
            </div>

            <div class="food-info">
                <h3>${escapeHTML(getFoodName(food))}</h3>

                <p>Freshly prepared for your campus break.</p>

                <div class="food-bottom">
                    <span class="food-price">
                        ${formatPrice(getFoodPrice(food))}
                    </span>

                    <button
                        type="button"
                        class="add-btn"
                        data-index="${index}"
                    >
                        + Add
                    </button>
                </div>
            </div>
        </article>
    `).join("");

    foodList.querySelectorAll(".add-btn").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.index);
            addToCart(filteredFoods[index]);
        });
    });
}

/* SEARCH FOOD AS USER TYPES */
if (foodSearchInput) {
    foodSearchInput.addEventListener("input", () => {
        displayFoods();

        if (clearFoodSearchButton) {
            clearFoodSearchButton.style.display =
                foodSearchInput.value ? "block" : "none";
        }
    });
}

/* CLEAR SEARCH */
if (clearFoodSearchButton && foodSearchInput) {
    clearFoodSearchButton.addEventListener("click", () => {
        foodSearchInput.value = "";
        clearFoodSearchButton.style.display = "none";
        displayFoods();
        foodSearchInput.focus();
    });
}

/* ROTATING SEARCH EXAMPLES */
const searchExamples = [
    "Search for tea...",
    "Search for coffee...",
    "Search for burger...",
    "Search for sandwich...",
    "Search for fries..."
];

let searchExampleIndex = 0;

if (foodSearchInput) {
    foodSearchInput.placeholder = searchExamples[0];

    setInterval(() => {
        if (
            document.activeElement !== foodSearchInput &&
            foodSearchInput.value === ""
        ) {
            searchExampleIndex =
                (searchExampleIndex + 1) % searchExamples.length;

            foodSearchInput.placeholder =
                searchExamples[searchExampleIndex];
        }
    }, 2500);
}
/* =========================================
   CATEGORY FILTER
========================================= */

if (categoryContainer) {
    categoryContainer.addEventListener("click", event => {
        const button = event.target.closest("button.category-btn");

        if (!button) return;

        selectedCategory = button.dataset.category || "All";

        categoryContainer.querySelectorAll(".category-btn").forEach(btn => {
            btn.classList.toggle("active", btn === button);
        });

        displayFoods();
    });
}


/* =========================================
   CART
========================================= */

function addToCart(food) {
    if (!food) return;

    const id = getFoodId(food);
    const existing = cart.find(item => String(item.id) === String(id));

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id,
            name: getFoodName(food),
            price: getFoodPrice(food),
            quantity: 1
        });
    }

    displayCart();
    showCartMessage(getFoodName(food));
}

function changeQuantity(id, amount) {
    const item = cart.find(item => String(item.id) === String(id));

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        cart = cart.filter(item => String(item.id) !== String(id));
    }

    displayCart();
}

function displayCart() {
    const count = cart.reduce(
        (sum, item) => sum + item.quantity, 0
    );

    const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity, 0
    );

    cartCountElement.textContent = count;
    cartTotalElement.textContent = total.toFixed(2);

    checkoutButton.disabled = cart.length === 0;

    if (!cart.length) {
        cartItemsElement.innerHTML =
            "<p>Your cart is empty. Add something tasty!</p>";
        return;
    }

    cartItemsElement.innerHTML = cart.map(item => `
        <div class="cart-row">
            <div>
                <strong>${escapeHTML(item.name)}</strong>
                <p>${formatPrice(item.price)} each</p>
            </div>

            <div class="quantity-controls">
                <button
                    type="button"
                    data-id="${escapeHTML(String(item.id))}"
                    data-change="-1"
                    aria-label="Remove one"
                >−</button>

                <span>${item.quantity}</span>

                <button
                    type="button"
                    data-id="${escapeHTML(String(item.id))}"
                    data-change="1"
                    aria-label="Add one"
                >+</button>
            </div>
        </div>
    `).join("");

    cartItemsElement.querySelectorAll("button[data-change]").forEach(button => {
        button.addEventListener("click", () => {
            changeQuantity(
                button.dataset.id,
                Number(button.dataset.change)
            );
        });
    });
}


/* =========================================
   TOAST MESSAGES
========================================= */

function showToast(message) {
    let toast = document.getElementById("campus-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "campus-toast";
        toast.className = "campus-toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.campusToastTimer);

    window.campusToastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function showCartMessage(foodName) {
    showToast("🎉 " + foodName + " added to cart! 🛒");
}


/* =========================================
   CHECKOUT
========================================= */

checkoutButton.addEventListener("click", async () => {
    if (!cart.length) {
        alert("Please add food items to your cart.");
        return;
    }

    const pickupTime = pickupTimeInput.value;
    const paymentMethod = paymentMethodInput.value;

    if (!pickupTime) {
        alert("Please choose a pickup time.");
        pickupTimeInput.focus();
        return;
    }

    if (pickupTime < "08:30" || pickupTime > "17:30") {
        alert("Choose a pickup time between 8:30 AM and 5:30 PM.");
        pickupTimeInput.focus();
        return;
    }

    if (!paymentMethod) {
        alert("Please select a payment method.");
        paymentMethodInput.focus();
        return;
    }

    const orderItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity
    }));

    checkoutButton.disabled = true;
    checkoutButton.textContent = "Placing Order...";

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                pickupTime,
                paymentMethod,
                items: orderItems
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Order could not be placed.");
        }

        // Do not clear the cart unless the server confirms success.
        showOrderSuccess(
            result.orderId ?? result.order_id,
            pickupTime,
            result.total ?? result.total_amount ??
            cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        );

        cart = [];
        displayCart();

        await loadFoods();

    } catch (error) {
        console.error("Checkout error:", error);
        alert("Checkout failed: " + error.message);

    } finally {
        checkoutButton.textContent = "Checkout";
        checkoutButton.disabled = cart.length === 0;
    }
});


/* =========================================
   ORDER SUCCESS POPUP
========================================= */

function showOrderSuccess(orderId, pickupTime, total) {
    successOrderId.textContent = orderId ?? "Confirmed";
    successPickupTime.textContent = pickupTime;
    successOrderTotal.textContent = formatPrice(total);

    orderModal.classList.add("show");
}

closeOrderModal.addEventListener("click", () => {
    orderModal.classList.remove("show");
});


/* =========================================
   CART NAVIGATION
========================================= */


/* =========================================
   CART AND HOME/MENU NAVIGATION FIX
========================================= */

const homeLink = document.querySelector('a[href="#home"]');
const menuLink = document.querySelector('a[href="#menu"]');

function showWebsiteSection(target) {
    const sections = document.querySelectorAll("main > section");

    // Hide all main sections first
    sections.forEach(section => {
        section.style.display = "none";
    });

    // Remove cart page mode
    if (cartSection) {
        cartSection.classList.remove("cart-page-active");
        cartSection.style.display = "none";
    }

    // Show the requested section
    if (target === "cart") {
        if (cartSection) {
            cartSection.style.display = "block";
            cartSection.classList.add("cart-page-active");
        }
    } else {
        const targetSection = document.getElementById(target);

        if (targetSection) {
            targetSection.style.display = "";
        }
    }

    // Scroll to the selected section
    const sectionToScroll = document.getElementById(target);

    if (sectionToScroll) {
        sectionToScroll.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

// Cart button
if (cartLink) {
    cartLink.addEventListener("click", event => {
        event.preventDefault();
        showWebsiteSection("cart");
        history.replaceState(null, "", "#cart");
    });
}

// Home button
if (homeLink) {
    homeLink.addEventListener("click", event => {
        event.preventDefault();
        showWebsiteSection("home");
        history.replaceState(null, "", "#home");
    });
}

// Food Menu button
if (menuLink) {
    menuLink.addEventListener("click", event => {
        event.preventDefault();
        showWebsiteSection("menu");
        history.replaceState(null, "", "#menu");
    });
}

// Open the correct section when the page loads
window.addEventListener("load", () => {
    const target = window.location.hash.replace("#", "");

    if (["home", "menu", "cart"].includes(target)) {
        showWebsiteSection(target);
    }
});



/* =========================================
   LOGIN / REGISTER
========================================= */

function openAuthPopup() {
    authModal.style.display = "flex";
    authStatus.textContent = "";
}

function closeAuthPopup() {
    authModal.style.display = "none";
}

function updateAuthForm() {
    const isRegister = authMode === "register";

    authTitle.textContent = isRegister
        ? "Create Your Account"
        : "Welcome Back!";

    authMessage.textContent = isRegister
        ? "Join Campus Bites today."
        : "Login to your Campus Bites account.";

    authNameField.style.display = isRegister ? "block" : "none";
    authName.required = isRegister;

    authPassword.placeholder = isRegister
        ? "Create password (minimum 8 characters)"
        : "Password (minimum 8 characters)";

    authPassword.minLength = 8;
    authSubmitBtn.textContent = isRegister ? "Register" : "Login";

    authSwitchLabel.textContent = isRegister
        ? "Already have an account?"
        : "Don't have an account?";

    authSwitchBtn.textContent = isRegister ? "Login" : "Register";
}

loginOpenBtn.addEventListener("click", async () => {
    await openProfileDrawer();
});

authCloseBtn.addEventListener("click", closeAuthPopup);

authModal.addEventListener("click", event => {
    if (event.target === authModal) {
        closeAuthPopup();
    }
});

authSwitchBtn.addEventListener("click", () => {
    authMode = authMode === "login" ? "register" : "login";
    updateAuthForm();
    authStatus.textContent = "";
});

authForm.addEventListener("submit", async event => {
    event.preventDefault();

    authStatus.textContent = "Please wait...";
    authSubmitBtn.disabled = true;

    try {
        const identifier = authIdentifier.value.trim();

        const endpoint = authMode === "register"
            ? "/api/auth/register"
            : "/api/auth/login";

        let body;

        if (authMode === "register") {
            if (!authName.value.trim()) {
                throw new Error("Please enter your full name.");
            }

            const isPhone = /^\+?[0-9]{10,15}$/.test(identifier);

            body = {
                username: authName.value.trim(),
                phone_number: isPhone ? identifier : null,
                email: identifier.includes("@") ? identifier : null,
                password: authPassword.value
            };
        } else {
            body = {
                identifier,
                password: authPassword.value
            };
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify(body)
        });

        const text = await response.text();

        let result;

        try {
            result = JSON.parse(text);
        } catch {
            throw new Error(
                "Server returned an unexpected response. Check the backend route."
            );
        }

        if (!response.ok) {
            throw new Error(result.message || "Authentication failed.");
        }

        if (authMode === "register") {
            authMode = "login";
            updateAuthForm();
            authStatus.textContent = "Registration successful! Please log in.";
        } else {
            closeAuthPopup();
            showToast("Login successful!");

            await openProfileDrawer();
        }

    } catch (error) {
        console.error("Login/Register error:", error);
        authStatus.textContent = error.message;

    } finally {
        authSubmitBtn.disabled = false;
    }
});

updateAuthForm();


/* =========================================
   PROFILE DRAWER
========================================= */

async function openProfileDrawer() {
    try {
        const response = await fetch("/api/auth/me", {
            credentials: "same-origin"
        });

        if (!response.ok) {
            openAuthPopup();
            return;
        }

        const data = await response.json();
        const user = data.user;

        if (!user) {
            openAuthPopup();
            return;
        }

        document.getElementById("profile-name").textContent =
            user.username || "-";

        document.getElementById("profile-phone").textContent =
            user.phone_number || "-";

        document.getElementById("profile-email").textContent =
            user.email || "-";

        profileDrawer.classList.add("open");
        profileOverlay.classList.add("open");

    } catch (error) {
        console.error("Profile error:", error);
        openAuthPopup();
    }
}

function closeProfileDrawer() {
    profileDrawer.classList.remove("open");
    profileOverlay.classList.remove("open");
}

closeProfileButton.addEventListener("click", closeProfileDrawer);
profileOverlay.addEventListener("click", closeProfileDrawer);



/* =========================================
   MY ORDERS - PROFILE DRAWER VIEW
========================================= */

const profileContentParent = myOrdersSection.parentElement;
const profileContentNext = myOrdersSection.nextSibling;

const ordersBackButton = document.createElement("button");
ordersBackButton.type = "button";
ordersBackButton.textContent = "← Back to Profile";
ordersBackButton.className = "back-profile-btn";
ordersBackButton.style.cssText =
    "display:block; margin:0 0 20px; padding:10px 16px; " +
    "border:0; border-radius:8px; cursor:pointer; " +
    "font-size:15px; font-weight:600;";

let profileChildrenState = [];

profileOrdersBtn.addEventListener("click", async () => {
    // Hide profile content inside the drawer, but keep its close button.
    profileChildrenState = Array.from(profileDrawer.children).map(element => ({
        element,
        display: element.style.display
    }));

    profileChildrenState.forEach(({ element }) => {
        if (
            !element.contains(closeProfileButton) &&
            element !== myOrdersSection
        ) {
            element.style.display = "none";
        }
    });

    // Show My Orders inside the same profile drawer.
    myOrdersSection.style.display = "block";
    myOrdersSection.style.width = "100%";
    myOrdersSection.style.maxWidth = "100%";
    myOrdersSection.style.margin = "0";
    myOrdersSection.style.padding = "0";
    myOrdersSection.style.boxSizing = "border-box";

    if (myOrdersSection.parentElement !== profileDrawer) {
        profileDrawer.appendChild(myOrdersSection);
        profileDrawer.scrollTop = 0;
    }

    ordersBackButton.style.background = "#f1f1f1";
    ordersBackButton.style.color = "#222";

    myOrdersSection.prepend(ordersBackButton);

    myOrdersList.textContent = "Loading your orders...";

    try {
        const response = await fetch("/api/my-orders", {
            credentials: "same-origin"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not load orders.");
        }

        myOrdersList.replaceChildren();

        if (!Array.isArray(data.orders) || data.orders.length === 0) {
            myOrdersList.textContent =
                "You haven't placed any orders yet.";
            return;
        }

        data.orders.forEach(order => {
            const card = document.createElement("div");
            card.className = "order-history-card";

            const heading = document.createElement("h3");
            heading.textContent = "Order #" + order.order_id;

            const status = document.createElement("p");
            status.textContent =
                "Status: " + (order.order_status || "Pending");

            const pickup = document.createElement("p");
            pickup.textContent =
                "Pickup time: " + (order.pickup_time || "-");

            const total = document.createElement("p");
            total.textContent =
                "Total: " + formatPrice(order.total_amount || 0);

            card.append(heading, status, pickup, total);

            if (Array.isArray(order.items)) {
                const itemsHeading = document.createElement("p");
                itemsHeading.textContent = "Items:";

                const itemsList = document.createElement("ul");

                order.items.forEach(item => {
                    const li = document.createElement("li");
                    li.textContent =
                        (item.item_name || item.name || "Food item") +
                        " × " + item.quantity;
                    itemsList.appendChild(li);
                });

                card.append(itemsHeading, itemsList);
            }

            myOrdersList.appendChild(card);
        });

    } catch (error) {
        console.error("My Orders error:", error);
        myOrdersList.textContent = error.message;
    }
});

ordersBackButton.addEventListener("click", () => {
    // Move My Orders back to its original HTML location.
    if (profileContentNext && profileContentNext.parentNode === profileContentParent) {
        profileContentParent.insertBefore(myOrdersSection, profileContentNext);
    } else {
        profileContentParent.appendChild(myOrdersSection);
    }

    myOrdersSection.style.display = "none";

    // Restore the profile drawer content.
    profileChildrenState.forEach(({ element, display }) => {
        element.style.display = display;
    });

    ordersBackButton.remove();
});

/* =========================================
   SEARCH ORDER BY ORDER ID
========================================= */

const findOrderButton = document.getElementById("find-order-btn");
const orderIdInput = document.getElementById("orderId");
const historyMessage = document.getElementById("history-message");
const historyResult = document.getElementById("history-result");

findOrderButton.addEventListener("click", async () => {
    const orderId = orderIdInput.value.trim();

    historyResult.replaceChildren();

    if (!orderId || Number(orderId) < 1) {
        historyMessage.textContent = "Please enter a valid Order ID.";
        return;
    }

    historyMessage.textContent = "Searching for your order...";
    findOrderButton.disabled = true;

    try {
        const response = await fetch(
            "/api/orders/" + encodeURIComponent(orderId),
            { credentials: "same-origin" }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Order not found.");
        }

        if (!data.order) {
            throw new Error("Order details were not found.");
        }

        historyMessage.textContent = "";

        const panel = document.createElement("div");
        panel.className = "order-history-card";

        function addText(parent, text, tag = "p") {
            const element = document.createElement(tag);
            element.textContent = text;
            parent.appendChild(element);
        }

        addText(panel, "Order #" + data.order.order_id, "h3");
        addText(panel, "Status: " + (data.order.order_status || "Pending"));
        addText(
            panel,
            "Pickup time: " + (data.order.pickup_time || "Not set")
        );
        addText(
            panel,
            "Total: ₹" + Number(data.order.total_amount || 0).toFixed(2)
        );

        addText(panel, "Food Items", "h4");

        const list = document.createElement("ul");

        (Array.isArray(data.items) ? data.items : []).forEach(item => {
            const li = document.createElement("li");
            li.textContent =
                (item.item_name || item.name || "Food item") +
                " × " + item.quantity +
                " — ₹" + Number(item.item_total || 0).toFixed(2);

            list.appendChild(li);
        });

        panel.appendChild(list);
        addText(panel, "Payment Details", "h4");

        const transactions = Array.isArray(data.transactions)
            ? data.transactions
            : [];

        if (transactions.length === 0) {
            addText(panel, "No transaction record found.");
        } else {
            transactions.forEach(transaction => {
                addText(
                    panel,
                    (transaction.payment_method || "Payment") +
                    " — " + (transaction.payment_status || "Unknown") +
                    " — ₹" + Number(transaction.amount || 0).toFixed(2)
                );
            });
        }

        historyResult.appendChild(panel);

    } catch (error) {
        console.error("Order search error:", error);
        historyMessage.textContent = error.message;
    } finally {
        findOrderButton.disabled = false;
    }
});

/* =========================================
   LOGOUT
========================================= */

logoutBtn.addEventListener("click", async () => {
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin"
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.message || "Logout failed.");
        }

        closeProfileDrawer();
        showToast("You have logged out successfully!");

    } catch (error) {
        console.error("Logout error:", error);
        showToast(error.message);
    }
});


/* =========================================
   START WEBSITE
========================================= */

displayCart();
loadFoods();

console.log("Campus Bites JavaScript loaded.");
