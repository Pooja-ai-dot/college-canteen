
// GET HTML ELEMENTS
const message = document.getElementById("message");
const sections = document.querySelectorAll(".section");

let editingFood = null;

const orderStatuses = [
    "Received", "Preparing", "Ready", "Completed", "Cancelled"
];

const paymentStatuses = [
    "Pending", "Paid", "Failed", "Refunded"
];

const foodImage = document.getElementById("foodImage");
const imagePreview = document.getElementById("imagePreview");


// SHOW MESSAGE
function showMessage(text) {
    if (message) {
        message.textContent = text;
    }
}


// API FUNCTION
async function api(url, options = {}) {
    const headers = { ...options.headers };

    // Do not set JSON content type for FormData
    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        credentials: "same-origin",
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        window.location.replace("/admin-login.html");
        throw new Error("Admin login required.");
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}


// CREATE TABLE CELL
function makeCell(value) {
    const cell = document.createElement("td");

    cell.textContent =
        value == null || value === "" ? "—" : String(value);

    return cell;
}


// CREATE BUTTON
function makeButton(label, className, callback) {
    const button = document.createElement("button");

    button.textContent = label;
    button.className = className || "";

    button.addEventListener("click", callback);

    return button;
}


// CREATE SELECT
function makeSelect(values, currentValue) {
    const select = document.createElement("select");

    values.forEach(value => {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = value;
        option.selected = value === currentValue;

        select.appendChild(option);
    });

    return select;
}


// FORMAT MONEY
function money(value) {
    return "₹" + Number(value || 0).toFixed(2);
}


// IMAGE PREVIEW
if (foodImage && imagePreview) {
    foodImage.addEventListener("change", function () {
        const file = this.files[0];

        if (file) {
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = "block";
        }
    });
}


// TABLE ROWS
function setRows(id, rows) {
    const body = document.getElementById(id);

    if (!body) return;

    body.replaceChildren();

    if (rows.length === 0) {
        const tr = document.createElement("tr");
        const td = makeCell("No records found.");

        td.colSpan = 7;

        tr.appendChild(td);
        body.appendChild(tr);

        return;
    }

    rows.forEach(row => body.appendChild(row));
}
// ANALYTICS TAB SWITCHING
const analyticsTabs = document.querySelectorAll(".analytics-tab");
const analyticsPanels = document.querySelectorAll(".analytics-panel");

analyticsTabs.forEach(tab => {
    tab.addEventListener("click", () => {

        analyticsTabs.forEach(button => {
            button.classList.remove("active");
        });

        analyticsPanels.forEach(panel => {
            panel.classList.add("hidden");
        });

        tab.classList.add("active");

        const selectedPanel = document.getElementById(
            tab.dataset.analytics
        );

        if (selectedPanel) {
            selectedPanel.classList.remove("hidden");
        }
    });
});


 // DASHBOARD SUMMARY
async function loadSummary() {
    try {
        const data = await api("/api/admin/summary");

        const totalOrders = document.getElementById("total-orders");
        const totalFoods = document.getElementById("total-foods");
        const totalCustomers = document.getElementById("total-customers");
        const totalPayments = document.getElementById("total-payments");

        if (totalOrders) {
            totalOrders.textContent = data.orders?.total_orders ?? 0;
        }

        if (totalFoods) {
            totalFoods.textContent = data.foods?.total_foods ?? 0;
        }

        if (totalCustomers) {
            totalCustomers.textContent = data.customers?.total_customers ?? 0;
        }

        if (totalPayments) {
            totalPayments.textContent = money(data.payments?.total_payments);
        }

    } catch (error) {
        showMessage(error.message);
        throw error;
    }
}


// LOAD ORDERS
async function loadOrders() {
    const orders = await api("/api/admin/orders");

    setRows("orders-body", orders.map(order => {
        const tr = document.createElement("tr");

        tr.append(
            makeCell("#" + order.order_id),
            makeCell(order.username || "Customer #" + order.user_id),
            makeCell(money(order.total_amount)),
            makeCell(order.pickup_time)
        );

        const statusCell = document.createElement("td");

        const statusSelect = makeSelect(
            orderStatuses,
            order.order_status
        );

        statusCell.appendChild(statusSelect);

        const actionCell = document.createElement("td");

        actionCell.appendChild(makeButton("Save", "primary", async () => {
            try {
                await api(
                    "/api/admin/orders/" + order.order_id + "/status",
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            status: statusSelect.value
                        })
                    }
                );

                showMessage("Order updated successfully.");
                await loadSummary();

            } catch (error) {
                showMessage(error.message);
            }
        }));

        tr.append(statusCell, actionCell);

        return tr;
    }));
}


// LOAD MENU
async function loadMenu() {
    const foods = await api("/api/admin/menu");

    setRows("menu-body", foods.map(food => {
        const tr = document.createElement("tr");

        tr.append(
            makeCell(food.item_name),
            makeCell(food.category),
            makeCell(money(food.price))
        );

        const actions = document.createElement("td");


        // EDIT FOOD
        actions.appendChild(makeButton("Edit", "", () => {

            editingFood = food.item_name;

            document.getElementById("food-name").value =
                food.item_name;

            document.getElementById("food-category").value =
                food.category;

            document.getElementById("food-price").value =
                food.price;

            document.querySelector(
                "#food-form button[type='submit']"
            ).textContent = "Save Changes";

            document.getElementById("cancel-edit")
                .classList.remove("hidden");

            document.getElementById("edit-note").textContent =
                "Editing: " + food.item_name;

            showMessage("");
        }));


        // DELETE FOOD
        actions.appendChild(makeButton("Delete", "danger", async () => {

            if (!confirm("Delete " + food.item_name + "?")) {
                return;
            }

            try {
                await api(
                    "/api/admin/menu/" +
                    encodeURIComponent(food.item_name),
                    {
                        method: "DELETE"
                    }
                );

                showMessage("Food item deleted.");

                if (editingFood === food.item_name) {
                    resetFoodForm();
                }

                await loadMenu();
                await loadSummary();

            } catch (error) {
                showMessage(error.message);
            }
        }));

        tr.appendChild(actions);

        return tr;
    }));

    await loadSummary();
}


// RESET FOOD FORM
function resetFoodForm() {
    editingFood = null;

    document.getElementById("food-form").reset();

    document.querySelector(
        "#food-form button[type='submit']"
    ).textContent = "Add Food";

    document.getElementById("cancel-edit")
        .classList.add("hidden");

    document.getElementById("edit-note").textContent = "";

    if (imagePreview) {
        imagePreview.style.display = "none";
        imagePreview.removeAttribute("src");
    }
}


// CANCEL EDIT
document.getElementById("cancel-edit")
    .addEventListener("click", resetFoodForm);


// ADD / UPDATE FOOD
document.getElementById("food-form")
    .addEventListener("submit", async event => {

        event.preventDefault();

        const itemName = document.getElementById("food-name")
            .value.trim();

        const category = document.getElementById("food-category")
            .value.trim();

        const price = Number(
            document.getElementById("food-price").value
        );

        // VALIDATION
        if (!itemName || !category || !Number.isFinite(price) || price <= 0) {
            showMessage("Please enter valid food details.");
            return;
        }

        // CREATE FORMDATA
        const formData = new FormData();

        formData.append("item_name", itemName);
        formData.append("category", category);
        formData.append("price", price);

        // ADD IMAGE IF SELECTED
        const imageFile = foodImage?.files[0];

        if (imageFile) {
            formData.append("image", imageFile);
        }

        try {

            // UPDATE FOOD
            if (editingFood !== null) {

                await api(
                    "/api/admin/menu/" +
                    encodeURIComponent(editingFood),
                    {
                        method: "PUT",
                        body: formData
                    }
                );

                showMessage("Food item updated successfully.");

            }

            // ADD NEW FOOD
            else {

                await api("/api/admin/menu", {
                    method: "POST",
                    body: formData
                });

                showMessage("Food item added successfully.");
            }

            resetFoodForm();

            await loadMenu();

        } catch (error) {
            showMessage(error.message);
        }
    });


// LOAD TRANSACTIONS
async function loadTransactions() {
    const transactions = await api("/api/admin/transactions");

    setRows("transactions-body", transactions.map(transaction => {
        const tr = document.createElement("tr");

        tr.append(
            makeCell(transaction.transaction_id),
            makeCell("#" + transaction.order_id),
            makeCell(transaction.username || "—"),
            makeCell(money(transaction.amount)),
            makeCell(transaction.payment_method)
        );

        const statusCell = document.createElement("td");

        const statusSelect = makeSelect(
            paymentStatuses,
            transaction.payment_status
        );

        statusCell.appendChild(statusSelect);

        const actionCell = document.createElement("td");

        actionCell.appendChild(makeButton("Save", "primary", async () => {

            try {
                await api(
                    "/api/admin/transactions/" +
                    transaction.transaction_id + "/status",
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            status: statusSelect.value
                        })
                    }
                );

                showMessage("Transaction status updated.");

                await loadSummary();

            } catch (error) {
                showMessage(error.message);
            }
        }));

        tr.append(statusCell, actionCell);

        return tr;
    }));
}


// LOAD CUSTOMERS
async function loadCustomers() {
    const customers = await api("/api/admin/customers");

    setRows("customers-body", customers.map(customer => {
        const tr = document.createElement("tr");

        tr.append(
            makeCell(customer.user_id),
            makeCell(customer.username),
            makeCell(customer.phone_number),
            makeCell(customer.email)
        );

        return tr;
    }));
}


// SECTION LOADERS
const loaders = {
    overview: loadSummary,
    orders: loadOrders,
    menu: loadMenu,
    transactions: loadTransactions,
    customers: loadCustomers
};


// OPEN SECTION
async function openSection(name) {

    sections.forEach(section => {
        section.classList.toggle("hidden", section.id !== name);
    });

    showMessage("");

    try {
        if (loaders[name]) {
            await loaders[name]();
        }
    } catch (error) {
        showMessage(error.message);
    }
}


// NAVIGATION
document.querySelectorAll("nav button[data-section]")
    .forEach(button => {

        button.addEventListener("click", () => {
            openSection(button.dataset.section);
        });

    });


// LOGOUT
document.getElementById("logout-button")
    .addEventListener("click", async () => {

        try {
            await api("/api/admin/logout", {
                method: "POST"
            });

            window.location.replace("/admin-login.html");

        } catch (error) {
            showMessage(error.message);
        }
    });


// VERIFY ADMIN SESSION
api("/api/admin/me")
    .then(() => openSection("overview"))
    .catch(error => showMessage(error.message));
