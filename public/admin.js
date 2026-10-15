
const message = document.getElementById("message");
const sections = document.querySelectorAll(".section");

let editingFood = null;

const orderStatuses = [
    "Received", "Preparing", "Ready", "Completed", "Cancelled"
];

const paymentStatuses = [
    "Pending", "Paid", "Failed", "Refunded"
];

function showMessage(text) {
    message.textContent = text;
}

async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: "same-origin",
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
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

function makeCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value == null || value === "" ? "—" : String(value);
    return cell;
}

function makeButton(label, className, callback) {
    const button = document.createElement("button");
    button.textContent = label;
    button.className = className || "";
    button.addEventListener("click", callback);
    return button;
}

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

function money(value) {
    return "₹" + Number(value || 0).toFixed(2);
}

function setRows(id, rows) {
    const body = document.getElementById(id);
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

async function loadSummary() {
    const data = await api("/api/admin/summary");

    document.getElementById("total-orders").textContent =
        data.orders.total_orders;

    document.getElementById("total-foods").textContent =
        data.foods.total_foods;

    document.getElementById("total-customers").textContent =
        data.customers.total_customers;

    document.getElementById("total-payments").textContent =
        money(data.payments.total_payments);
}

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
        const statusSelect = makeSelect(orderStatuses, order.order_status);
        statusCell.appendChild(statusSelect);

        const actionCell = document.createElement("td");
        actionCell.appendChild(makeButton("Save", "primary", async () => {
            try {
                await api("/api/admin/orders/" + order.order_id + "/status", {
                    method: "PATCH",
                    body: JSON.stringify({ status: statusSelect.value })
                });
                showMessage("Order #" + order.order_id + " updated.");
                await loadSummary();
            } catch (error) {
                showMessage(error.message);
            }
        }));

        tr.append(statusCell, actionCell);
        return tr;
    }));
}

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

        actions.appendChild(makeButton("Edit", "", () => {
            editingFood = food.item_name;

            document.getElementById("food-name").value = food.item_name;
            document.getElementById("food-category").value = food.category;
            document.getElementById("food-price").value = food.price;

            document.querySelector("#food-form button[type='submit']")
                .textContent = "Save Changes";

            document.getElementById("cancel-edit").classList.remove("hidden");
            document.getElementById("edit-note").textContent =
                "Editing: " + food.item_name;
            showMessage("");
        }));

        actions.appendChild(makeButton("Delete", "danger", async () => {
            if (!confirm("Delete " + food.item_name + "?")) return;

            try {
                await api("/api/admin/menu/" + encodeURIComponent(food.item_name), {
                    method: "DELETE"
                });

                showMessage("Food item deleted.");
                if (editingFood === food.item_name) resetFoodForm();

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

function resetFoodForm() {
    editingFood = null;
    document.getElementById("food-form").reset();
    document.querySelector("#food-form button[type='submit']")
        .textContent = "Add Food";
    document.getElementById("cancel-edit").classList.add("hidden");
    document.getElementById("edit-note").textContent = "";
}

document.getElementById("cancel-edit").addEventListener("click", resetFoodForm);

document.getElementById("food-form").addEventListener("submit", async event => {
    event.preventDefault();

    const food = {
        item_name: document.getElementById("food-name").value.trim(),
        category: document.getElementById("food-category").value.trim(),
        price: Number(document.getElementById("food-price").value)
    };

    try {
        if (editingFood !== null) {
            await api("/api/admin/menu/" + encodeURIComponent(editingFood), {
                method: "PUT",
                body: JSON.stringify(food)
            });
            showMessage("Food item updated.");
        } else {
            await api("/api/admin/menu", {
                method: "POST",
                body: JSON.stringify(food)
            });
            showMessage("Food item added.");
        }

        resetFoodForm();
        await loadMenu();
    } catch (error) {
        showMessage(error.message);
    }
});

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
                        body: JSON.stringify({ status: statusSelect.value })
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

const loaders = {
    overview: loadSummary,
    orders: loadOrders,
    menu: loadMenu,
    transactions: loadTransactions,
    customers: loadCustomers
};

async function openSection(name) {
    sections.forEach(section => {
        section.classList.toggle("hidden", section.id !== name);
    });

    showMessage("");

    try {
        await loaders[name]();
    } catch (error) {
        showMessage(error.message);
    }
}

document.querySelectorAll("nav button[data-section]").forEach(button => {
    button.addEventListener("click", () => {
        openSection(button.dataset.section);
    });
});

document.getElementById("logout-button").addEventListener("click", async () => {
    try {
        await api("/api/admin/logout", { method: "POST" });
        window.location.replace("/admin-login.html");
    } catch (error) {
        showMessage(error.message);
    }
});

/* Verify the admin session before displaying data. */
api("/api/admin/me")
    .then(() => openSection("overview"))
    .catch(error => showMessage(error.message));
