# Recipe Cost Calculator — Liferich

A web app for food businesses to calculate recipe costs, set selling prices, track profit margins, manage ingredients & packaging, and build catering/event ("CN") packages — all in one place. Your data is stored in the cloud (Firebase) so it stays in sync across devices.

This guide explains, step by step, how to use every part of the website.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [The Dashboard](#the-dashboard)
3. [Ingredients](#ingredients)
4. [Packaging](#packaging)
5. [Recipes](#recipes)
6. [Pricing Report](#pricing-report)
7. [CN Package (Catering & Events)](#cn-package-catering--events)
8. [Settings](#settings)
9. [Backup & Restore](#backup--restore)
10. [Tips & FAQ](#tips--faq)

---

## Getting Started

1. **Open the app** by launching `index.html` in a modern browser (Chrome, Edge, Firefox).
2. **Sign in** — enter the access password on the welcome screen and click **Sign In**.
   - A session stays active for **10 hours**, after which you'll be asked to sign in again.
   - Use **Sign Out** (bottom of the sidebar) to end your session manually.
3. Once signed in, use the **left sidebar** to move between pages. Badges next to each item show how many records you have.

> **Recommended first-time order:** add your **Ingredients** → add **Packaging** → build **Recipes** → review the **Pricing Report** → create **CN Packages**.

---

## The Dashboard

The dashboard gives you a one-glance overview of your operation.

- **Top stat cards** highlight the most important numbers:
  - **Highest / Lowest Profit Product** — your best and weakest recipes by margin.
  - **Upcoming Events** — number of scheduled CN packages and the next one due.
  - **Total Profit Potential** — estimated monthly profit based on your settings.
- **Margin Health** (donut chart) — how many recipes are *on/above target*, *near target*, or *below target*.
- **Cost Composition** (donut chart) — how your total cost splits across **Ingredients**, **Packaging**, and **VAT**.
- **Top Recipes by Cost** & **Margin Overview** — quick bar charts ranking your recipes.
- **All Recipes Summary** — a searchable, paginated table of every recipe with a clear *Target Met / Below Target* status.

Use the search box in the summary table to quickly find a recipe; results are paginated for fast browsing.

---

## Ingredients

The master list of every raw material and its cost.

**To add an ingredient:**
1. Go to **Ingredients** → click **Add Ingredient**.
2. Fill in the name (required), and optionally SKU, category, supplier.
3. Enter the **Quantity**, **Unit**, and **Total Cost** — the **Cost per Unit** is calculated automatically.
4. Click **Save Ingredient**.

**Bulk import from Excel:** click **Upload Excel** and select a `.xlsx`/`.xls` file. Recognized column headers include: `SKU`, `Ingredient Name`, `Category`, `Quantity`, `Unit`, `Unit Cost` (or `Cost`), and `Supplier`. Existing ingredients (matched by name) are updated; new ones are added.

The **Used In** column shows how many recipes use each ingredient. Use the search and category filter to narrow the list.

---

## Packaging

Works just like Ingredients, but for boxes, bags, labels, and other packaging materials.

1. Go to **Packaging** → click **Add Packaging**.
2. Enter the item name (required), type, unit, cost per unit, and supplier.
3. Click **Save Packaging**.

These items become selectable when you build recipes.

---

## Recipes

A recipe combines ingredients + packaging and calculates its cost, suggested price, and margin.

**To create a recipe:**
1. Go to **Recipes** → click **New Recipe** (also available in the sidebar).
2. Enter the **Recipe Name** (required), category, batch size, and unit label.
3. (Optional) Tick **Include VAT (12%)** to add tax into the cost.
4. **Add Ingredients:** click **+ Add Ingredient**, then either pick an existing ingredient (its cost auto-fills and locks) or type a new one and enter its cost manually.
5. **Add Packaging** the same way.
6. **Choose a Pricing Method:**
   - **Cost + Markup %** — adds a percentage on top of cost.
   - **Target Margin %** — works backward from a desired profit margin.
   - **Cost Multiplier** — multiplies cost by a factor (e.g. 3×).
   - **Manual Price** — type an exact selling price.
   - You can also enter a **Manual Sell Price** to override any method.
7. The **Cost Summary** at the bottom updates live, showing ingredient cost, packaging cost, total cost, suggested price, and a color-coded **margin meter**.
8. Click **Save Recipe**.

> Any new ingredient/packaging you type directly into a recipe (with a cost) is automatically saved to your master lists for reuse.

**Managing recipes:** use the table's **View**, **Edit**, and **Del** buttons. Search, filter by category, and sort by name/cost/margin. The list is paginated.

---

## Pricing Report

A full, printable cost-and-margin breakdown of **every** recipe in one table — ingredient cost, packaging, total cost, multiplier, sell price, gross profit, margin, and whether each recipe meets your target.

- Use **Print** (top right) to export or print the report.
- The table is paginated for large catalogs.

---

## CN Package (Catering & Events)

Build full event/catering packages priced per guest (pax), including overheads.

**To create a package:**
1. Go to **CN Package** → click **New Package**, or click **Templates** to start from a ready-made preset (Wedding, Birthday, Corporate, Fiesta, Intimate, Debut).
2. Set the **event date/time**, upload a **cover image** (or type an emoji), and enter the package name, description, tag, and **number of pax**.
3. Adjust the cost factors as percentages of base recipe cost:
   - **Contingency**, **Waste**, **Production**, **Capex**.
4. Add fixed costs: **Venue**, **Venue Cost**, **Manpower** (people × hours), and any **Other Expenses** (add as many rows as needed).
5. Choose a **Pricing Method** (markup or margin), pricing value, and **VAT %**.
6. **Add Recipes:** click **+ Add Recipe**, pick a recipe, and set the **quantity per pax**. Subtotals scale automatically by pax.
7. Review the live **Cost Summary** (base cost, each overhead, total cost, VAT, selling price incl./excl. VAT, profit, and margin).
8. Click **Save Package**.

**Managing packages:** packages appear as cards. Click a card to **View** the full breakdown, or use **Edit**, **Copy** (duplicate as a starting point), and **Del**. Upcoming events are badged and counted on the dashboard. Search and filter by type (custom vs template).

---

## Settings

Configure the defaults that drive calculations across the app:

- **Business Settings** — business name, currency symbol, default markup, **target profit margin** (drives the red/amber/green status everywhere), monthly production batches (used for profit potential), and VAT/tax rate.
- **Pricing Method** — the default strategy and cost multiplier used for new recipes.
- **Appearance** — toggle between **Light and Dark** themes.
- **Danger Zone** — **Clear All Data** permanently deletes everything (asks for confirmation twice).

Click **Save Settings** to apply.

---

## Backup & Restore

On the **Dashboard** top bar:

- **Export JSON** — downloads a full backup (`recipecost_backup.json`) of all recipes, ingredients, packaging, packages, and settings.
- **Import** — loads a previously exported JSON file. This **replaces** your current data, so export first if unsure.

---

## Tips & FAQ

- **Color coding:** green = meets your target margin, amber = close to target, red = below target. Set the threshold in **Settings → Target Profit Margin**.
- **Existing vs. new items:** when an ingredient/packaging already exists, its cost is locked in recipes to keep numbers consistent. Edit the master record to change it everywhere.
- **Units auto-convert** (e.g. kg ↔ g, L ↔ ml) so you can buy in bulk and use small amounts in recipes.
- **My dark mode looks better/worse?** Switch any time in **Settings → Appearance**; your choice is remembered.
- **Did my changes save?** A toast notification appears at the bottom-right after each action. Data is saved to the cloud automatically.
- **Nothing loads / blank screen?** Check your internet connection (the app uses Firebase) and that you're signed in.

---

## Technical Notes (for maintainers)

- **Stack:** plain HTML, CSS, and JavaScript — no build step required.
- **Files:**
  - `index.html` — markup and modals.
  - `styles.css` — all styling and theming (CSS custom properties / design tokens).
  - `script.js` — application logic, calculations, rendering, and persistence.
- **Data storage:** Firebase Firestore (`data/db` document). Configuration lives in `script.js`.
- **External libraries:** Firebase (compat SDK) and SheetJS/XLSX (Excel import), both loaded via CDN.
- **Access password & session length** are defined near the top of `script.js` (`SESSION_PASSWORD`, `SESSION_DURATION`).
