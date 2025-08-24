// routes/stock.js
const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const { isAuthenticated, isAdminOrStaff } = require("./authMiddleware");

// -------- GET /api/books/categories --------
// Distinct category names from the `book` table
router.get("/categories", isAuthenticated, isAdminOrStaff, async (req, res) => {
  try {
    const db = dbSingleton.getConnection().promise();
    const [rows] = await db.query(
      "SELECT DISTINCT `category` FROM `book` WHERE `category` IS NOT NULL AND `category` <> '' ORDER BY `category` ASC"
    );
    // Frontend expects [{ id?, name }]
    const out = rows.map((r) => ({ name: r.category }));
    res.json(out);
  } catch (err) {
    console.error("GET /books/categories error:", err);
    res.status(500).json({ message: "Failed to load categories." });
  }
});

// -------- GET /api/books/stock --------
router.get("/stock", isAuthenticated, isAdminOrStaff, async (req, res) => {
  try {
    const db = dbSingleton.getConnection().promise();

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const search = (req.query.search || "").trim();
    const category = (req.query.category || "").trim(); // category is a string column
    const lowOnly = req.query.lowOnly === "1" || req.query.lowOnly === "true";
    const threshold = Math.max(0, parseInt(req.query.threshold, 10) || 5);

    const sortMap = {
      title: "`b`.`title`",
      author: "`b`.`author`",
      category_name: "`b`.`category`",
      price: "`b`.`price`",
      quantity_in_stock: "`b`.`count`",
    };
    const sortBy = sortMap[req.query.sortBy] || "`b`.`title`";
    const sortDir = (req.query.sortDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

    const where = [];
    const params = [];

    if (search) {
      where.push("(b.title LIKE ? OR b.author LIKE ? OR b.category LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      where.push("b.category = ?");
      params.push(category);
    }

    if (lowOnly) {
      where.push("IFNULL(b.count, 0) <= ?");
      params.push(threshold);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM \`book\` b ${whereSQL}`,
      params
    );

    const [rows] = await db.query(
      `
      SELECT
        b.book_id AS id,
        b.title,
        b.author,
        b.category AS category_name,
        b.price,
        IFNULL(b.count, 0) AS quantity_in_stock
      FROM \`book\` b
      ${whereSQL}
      ORDER BY ${sortBy} ${sortDir}
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({ items: rows, total: countRows[0]?.cnt || 0 });
  } catch (err) {
    console.error("GET /books/stock error:", err);
    res.status(500).json({ message: "Failed to load stock." });
  }
});

// -------- PUT /api/books/:id/stock --------
router.put("/:id/stock", isAuthenticated, isAdminOrStaff, async (req, res) => {
  try {
    const db = dbSingleton.getConnection().promise();
    const id = parseInt(req.params.id, 10);
    const qty = parseInt(req.body?.quantity_in_stock, 10);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid book id." });
    }
    if (!Number.isFinite(qty) || qty < 0) {
      return res.status(400).json({ message: "quantity_in_stock must be a non-negative integer." });
    }

    // Update count and (optionally) Availability enum to match the qty
    const [result] = await db.query(
      "UPDATE `book` SET `count` = ?, `Availability` = (CASE WHEN ? > 0 THEN 'Available' ELSE 'Out of Stock' END) WHERE `book_id` = ?",
      [qty, qty, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not found." });
    }

    const [rows] = await db.query(
      `
      SELECT
        b.book_id AS id,
        b.title,
        b.author,
        b.category AS category_name,
        b.price,
        IFNULL(b.count, 0) AS quantity_in_stock
      FROM \`book\` b
      WHERE b.book_id = ?
      `,
      [id]
    );

    res.json({ ok: true, item: rows[0] || null });
  } catch (err) {
    console.error("PUT /books/:id/stock error:", err);
    res.status(500).json({ message: "Failed to update stock." });
  }
});

module.exports = router;
