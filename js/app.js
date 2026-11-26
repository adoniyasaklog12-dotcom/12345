const items = document.querySelectorAll(".item, .highlight");
const sections = document.querySelectorAll(".collection-products [id]");
const links = document.querySelectorAll(".chips a");
const year = document.querySelector("[data-year]");
const addToBagButtons = document.querySelectorAll("[data-add-to-bag]");
const bagCountElements = document.querySelectorAll("[data-bag-count]");
const bagStatus = document.querySelector("[data-bag-status]");
const bagList = document.querySelector("[data-bag-list]");
const bagTotal = document.querySelector("[data-bag-total]");
const clearBagButton = document.querySelector("[data-clear-bag]");
const copyReservationButton = document.querySelector("[data-copy-reservation]");
const reserveTelegramLink = document.querySelector("[data-reserve-telegram]");
const customerNameInput = document.querySelector("[data-customer-name]");
const pickupTimeInput = document.querySelector("[data-pickup-time]");
const bagStorageKey = "ornaments-bag";
const bag = loadSavedBag();

if (year) {
  year.textContent = new Date().getFullYear();
}

function isValidBagItem(item) {
  return item !== null &&
    typeof item === "object" &&
    typeof item.name === "string" &&
    item.name.length > 0 &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0;
}

function loadSavedBag() {
  try {
    const savedBag = sessionStorage.getItem(bagStorageKey);
    if (!savedBag) {
      return [];
    }

    const parsedBag = JSON.parse(savedBag);
    if (Array.isArray(parsedBag) && parsedBag.every(isValidBagItem)) {
      return parsedBag;
    }

    console.error("Saved bag data is invalid; starting with an empty bag.");
  } catch (error) {
    console.error("Could not restore the saved bag.", error);
  }

  return [];
}

function saveBag() {
  try {
    sessionStorage.setItem(bagStorageKey, JSON.stringify(bag));
    return true;
  } catch (error) {
    console.error("Could not save the bag for this session.", error);
    return false;
  }
}

function renderBag() {
  if (!bagList || !bagStatus || !bagTotal || !clearBagButton) {
    return;
  }

  const itemCount = bag.reduce(function (total, item) {
    return total + item.quantity;
  }, 0);
  const totalPrice = bag.reduce(function (total, item) {
    return total + item.price * item.quantity;
  }, 0);
  const saved = saveBag();

  bagCountElements.forEach(function (count) {
    count.textContent = itemCount;
  });

  bagTotal.textContent = totalPrice.toLocaleString("en-US");
  bagStatus.textContent = saved
    ? itemCount === 0
      ? "Your bag is empty. Add a category to start."
      : itemCount + (itemCount === 1 ? " item in your bag." : " items in your bag.")
    : "Your bag cannot be saved in this browser session.";
  clearBagButton.disabled = itemCount === 0;
  if (copyReservationButton) {
    copyReservationButton.disabled = itemCount === 0;
  }
  bagList.replaceChildren();

  bag.forEach(function (item) {
    const row = document.createElement("li");
    const details = document.createElement("div");
    const name = document.createElement("p");
    const subtotal = document.createElement("span");
    const controls = document.createElement("div");
    const decreaseButton = document.createElement("button");
    const quantity = document.createElement("span");
    const increaseButton = document.createElement("button");

    row.className = "bag-item";
    details.className = "bag-item-details";
    name.textContent = item.name;
    subtotal.className = "bag-item-price";
    subtotal.textContent = (item.price * item.quantity).toLocaleString("en-US") + " ETB";
    details.append(name, subtotal);
    controls.className = "bag-quantity";
    decreaseButton.className = "quantity-change";
    decreaseButton.type = "button";
    decreaseButton.textContent = "-";
    decreaseButton.setAttribute("aria-label", "Decrease " + item.name + " quantity");
    decreaseButton.addEventListener("click", function () {
      item.quantity -= 1;
      if (item.quantity === 0) {
        bag.splice(bag.indexOf(item), 1);
      }
      renderBag();
    });
    quantity.textContent = item.quantity;
    quantity.className = "quantity-number";
    increaseButton.className = "quantity-change";
    increaseButton.type = "button";
    increaseButton.textContent = "+";
    increaseButton.setAttribute("aria-label", "Increase " + item.name + " quantity");
    increaseButton.addEventListener("click", function () {
      item.quantity += 1;
      renderBag();
    });
    controls.append(decreaseButton, quantity, increaseButton);
    row.append(details, controls);
    bagList.append(row);
  });

  updateTelegramLink();
}

function createReservationText() {
  const lines = ["Hello! I'd like to reserve:"];

  bag.forEach(function (item) {
    lines.push("- " + item.name + " x " + item.quantity + " = " +
      (item.price * item.quantity).toLocaleString("en-US") + " ETB");
  });

  const totalPrice = bag.reduce(function (total, item) {
    return total + item.price * item.quantity;
  }, 0);
  lines.push("Total: " + totalPrice.toLocaleString("en-US") + " ETB");

  const customerName = customerNameInput ? customerNameInput.value.trim() : "";
  const pickupTime = pickupTimeInput ? pickupTimeInput.value.trim() : "";

  if (customerName) {
    lines.push("Name: " + customerName);
  }
  if (pickupTime) {
    lines.push("Pickup time: " + pickupTime);
  }

  lines.push("Pickup reservation only; no delivery.");
  return lines.join("\n");
}

function updateTelegramLink() {
  if (!reserveTelegramLink) {
    return;
  }

  const hasItems = bag.length > 0;
  reserveTelegramLink.href = hasItems
    ? "https://t.me/scp555?text=" + encodeURIComponent(createReservationText())
    : "https://t.me/scp555";
  reserveTelegramLink.setAttribute("aria-disabled", String(!hasItems));
  reserveTelegramLink.tabIndex = hasItems ? 0 : -1;
}

addToBagButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const name = button.dataset.product;
    const price = Number(button.dataset.price);
    if (!Number.isFinite(price) || price < 0) {
      const message = "A valid price is missing for " + name + ".";
      console.error(message);
      bagStatus.textContent = message;
      return;
    }

    const existingItem = bag.find(function (item) {
      return item.name === name;
    });

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      bag.push({ name: name, price: price, quantity: 1 });
    }

    renderBag();
  });
});

if (clearBagButton) {
  clearBagButton.addEventListener("click", function () {
    bag.length = 0;
    renderBag();
  });
}

if (reserveTelegramLink) {
  reserveTelegramLink.addEventListener("click", function (event) {
    if (bag.length === 0) {
      event.preventDefault();
    }
  });
}

if (copyReservationButton) {
  copyReservationButton.addEventListener("click", function () {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      bagStatus.textContent = "Copy is unavailable in this browser. You can still reserve through Telegram.";
      return;
    }

    navigator.clipboard.writeText(createReservationText()).then(function () {
      bagStatus.textContent = "Reservation copied. Paste it into Telegram.";
    }, function (error) {
      console.error("Could not copy the reservation.", error);
      bagStatus.textContent = "Could not copy the reservation. Please try again or use Telegram.";
    });
  });
}

if (customerNameInput) {
  customerNameInput.addEventListener("input", updateTelegramLink);
}
if (pickupTimeInput) {
  pickupTimeInput.addEventListener("input", updateTelegramLink);
}

renderBag();

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(function (item) {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });

  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        links.forEach(function (link) {
          link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
        });
      }
    });
  }, { rootMargin: "-20% 0px -70% 0px" });

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });
}