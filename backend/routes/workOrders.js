import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Create a new work order with items, work types, and photos
router.post('/', async (req, res) => {
  const body = req.body || {};
  const {
    created_by,
    customer = {},
    vehicle = {},
    status = 'requested',
    activity = {},
    quote = {},
    items = [],
    work_types = [],
    photos = [],
    paint_codes = [],
  } = body;

  console.log('📦 Incoming Work Order Payload:', JSON.stringify(body, null, 2));

  if (!created_by) {
    console.warn('⚠️ Missing contractor email (created_by)');
    return res.status(400).json({ success: false, error: 'created_by (contractor email) is required' });
  }

  // Normalize numbers
  const subtotal = Number(quote.subtotal || 0);
  const tax = Number(quote.tax || 0);
  const total = Number(quote.total || 0);

  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ DB connection established');
    await conn.beginTransaction();

    // Insert main work order
    console.log('📝 Inserting into work_orders...');
    const [woResult] = await conn.query(
      `INSERT INTO work_orders (
        created_by,
        customer_name,
        customer_phone,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        vehicle_vin,
        vehicle_odometer,
        vehicle_trim,
        status,
        activity_type,
        activity_description,
        repairs_json,
        paint_codes_json,
        quote_subtotal,
        quote_tax,
        quote_total
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?, ?)`,
      [
        created_by,
        customer.name || null,
        customer.phone || null,
        vehicle.make || null,
        vehicle.model || null,
        vehicle.year ? Number(vehicle.year) : null,
        vehicle.vin || null,
        vehicle.odometer ? Number(vehicle.odometer) : null,
        vehicle.trim || null,
        status,
        activity.type || 'Inspection',
        activity.description || null,
        activity.selectedRepairTypes ? JSON.stringify(activity.selectedRepairTypes) : null,
        paint_codes && paint_codes.length ? JSON.stringify(paint_codes) : null,
        subtotal,
        tax,
        total,
      ]
    );

    const workOrderId = woResult.insertId;
    console.log(`✅ Work order inserted. ID: ${workOrderId}`);

    // Insert items (parts/labour)
    if (Array.isArray(items) && items.length > 0) {
      console.log(`🧩 Inserting ${items.length} items...`);
      const placeholders = items.map(() => '(?,?,?,?)').join(',');
      const values = [];
      for (const it of items) {
        values.push(workOrderId);
        values.push(it.description || 'Item');
        values.push(Number(it.qty || 1));
        values.push(Number(it.unit_price || 0));
      }
      await conn.query(
        `INSERT INTO work_order_items (work_order_id, description, qty, unit_price) VALUES ${placeholders}`,
        values
      );
      console.log('✅ Items inserted');
    }

    // Insert selected work types
    if (Array.isArray(work_types) && work_types.length > 0) {
      console.log(`⚙️ Inserting ${work_types.length} work types...`);
      const placeholders = work_types.map(() => '(?,?,?)').join(',');
      const values = [];
      for (const wt of work_types) {
        values.push(workOrderId);
        values.push(wt.id || 'unknown');
        values.push(wt.title || wt.id || '');
      }
      await conn.query(
        `INSERT INTO work_order_work_types (work_order_id, work_type_id, work_type_title) VALUES ${placeholders}`,
        values
      );
      console.log('✅ Work types inserted');
    }

    // Insert photos (meta only: url/name)
    if (Array.isArray(photos) && photos.length > 0) {
      console.log(`🖼️ Inserting ${photos.length} photos...`);
      const placeholders = photos.map(() => '(?,?,?)').join(',');
      const values = [];
      for (const ph of photos) {
        values.push(workOrderId);
        values.push(ph.url || null);
        values.push(ph.name || null);
      }
      await conn.query(
        `INSERT INTO work_order_photos (work_order_id, url, name) VALUES ${placeholders}`,
        values
      );
      console.log('✅ Photos inserted');
    }

    await conn.commit();
    console.log(`🎉 Work order #${workOrderId} committed successfully`);
    res.json({ success: true, id: workOrderId });
  } catch (e) {
    if (conn) await conn.rollback();
    console.error('❌ Work order insert error:', e);
    res.status(500).json({ success: false, error: e.message });
  } finally {
    if (conn) {
      conn.release();
      console.log('🔚 Connection released');
    }
  }
});

// Get work order counts grouped by status (must be before /:id route)
router.get('/status-stats', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT status, COUNT(*) AS count FROM work_orders GROUP BY status'
    );
    const stats = rows.map(r => ({ status: String(r.status || '').toLowerCase(), count: Number(r.count) || 0 }));
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching work order status stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Fetch work orders, optionally filtered by status
router.get('/', async (req, res) => {
  const { status } = req.query;
  let sql = `SELECT id, created_by, accepted_by, supplier_email, customer_name, customer_phone, vehicle_make, vehicle_model, vehicle_year, vehicle_vin, status, quote_total, updated_at, created_at, supply_item, item_description, temp_supply_item, temp_desc, activity_type, activity_description, repairs_json, paint_codes_json FROM work_orders`;
  const params = [];
  if (status) {
    sql += ` WHERE LOWER(TRIM(status)) = ?`;
    params.push(String(status).toLowerCase().trim());
  }

  try {
    const [rows] = await pool.query(sql, params);
    const orders = rows.map((r) => {
      const year = r.vehicle_year || '';
      const make = r.vehicle_make || '';
      const model = r.vehicle_model || '';
      const customer = r.customer_name || '';
      const title = `${year ? year + ' ' : ''}${make} ${model}`.trim() + (customer ? ` - ${customer}` : '');

      const statusMap = {
        'requested': 'Requested',
        'in-progress': 'In Process',
        'in_progress': 'In Process',
        'in progress': 'In Process',
        'completed': 'Completed',
        'pending': 'Pending',
        'accepted': 'In Process',
      };
      const rawStatus = (r.status || '').toLowerCase();
      const displayStatus = statusMap[rawStatus] || r.status || 'Requested';

      return {
        id: r.id,
        title,
        charges: Number(r.quote_total || 0),
        status: displayStatus,
        status_raw: rawStatus,
        updatedAt: r.updated_at || r.created_at || new Date(),
        // Additional fields for contractor dashboard rendering
        created_by: r.created_by || null,
        accepted_by: r.accepted_by || null,
        supplier_email: r.supplier_email || null,
        customer_name: r.customer_name || null,
        customer_phone: r.customer_phone || null,
        vehicle_make: r.vehicle_make || null,
        vehicle_model: r.vehicle_model || null,
        vehicle_year: r.vehicle_year || null,
        vehicle_vin: r.vehicle_vin || null,
        created_at: r.created_at || null,
        quote_total: Number(r.quote_total || 0),
        // Activity fields
        activity_type: r.activity_type || null,
        activity_description: r.activity_description || null,
        repairs_json: r.repairs_json ? (() => {
          try {
            // Check if it's already an object or array
            if (typeof r.repairs_json === 'object') {
              return r.repairs_json;
            }
            // Check for corrupted data patterns
            if (typeof r.repairs_json === 'string' && r.repairs_json.includes('[object Object]')) {
              console.warn(`Corrupted repairs_json detected for order ${r.id}: "${r.repairs_json}". Setting to null.`);
              return null;
            }
            return JSON.parse(r.repairs_json);
          } catch (e) {
            console.warn(`Failed to parse repairs_json for order ${r.id}: "${r.repairs_json}" - ${e.message}`);
            return null;
          }
        })() : null,
        paint_codes_json: r.paint_codes_json ? (() => {
          try {
            // Check if it's already an object or array
            if (typeof r.paint_codes_json === 'object') {
              return r.paint_codes_json;
            }
            // Check for corrupted data patterns
            if (typeof r.paint_codes_json === 'string' && r.paint_codes_json.includes('[object Object]')) {
              console.warn(`Corrupted paint_codes_json detected for order ${r.id}: "${r.paint_codes_json}". Setting to null.`);
              return null;
            }
            return JSON.parse(r.paint_codes_json);
          } catch (e) {
            console.warn(`Failed to parse paint_codes_json for order ${r.id}: "${r.paint_codes_json}" - ${e.message}`);
            return null;
          }
        })() : null,
        // Supplier assignment fields
        supply_item: r.supply_item || null,
        item_description: r.item_description || null,
        // Temp referral fields (for consultant approval)
        temp_supply_item: r.temp_supply_item || null,
        temp_desc: r.temp_desc || null,
      };
    });

    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Search work orders by supplier_email, date range, order_number (id), and VIN
router.get('/search', async (req, res) => {
  try {
    const { supplier_email, date_from, date_to, order_number, vin } = req.query;

    const whereClauses = [];
    const params = [];

    if (supplier_email) {
      whereClauses.push('LOWER(TRIM(supplier_email)) = ?');
      params.push(String(supplier_email).toLowerCase().trim());
    }
    if (order_number) {
      whereClauses.push('id = ?');
      params.push(Number(order_number));
    }
    if (vin) {
      whereClauses.push('LOWER(TRIM(vehicle_vin)) = ?');
      params.push(String(vin).toLowerCase().trim());
    }
    if (date_from) {
      whereClauses.push('DATE(created_at) >= ?');
      params.push(String(date_from));
    }
    if (date_to) {
      whereClauses.push('DATE(created_at) <= ?');
      params.push(String(date_to));
    }

    let sql = `SELECT id, created_by, accepted_by, supplier_email, customer_name, customer_phone, vehicle_make, vehicle_model, vehicle_year, vehicle_vin, status, quote_total, updated_at, created_at, supply_item, item_description, temp_supply_item, temp_desc FROM work_orders`;
    if (whereClauses.length) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(sql, params);

    const normalize = (r) => {
      const year = r.vehicle_year || '';
      const make = r.vehicle_make || '';
      const model = r.vehicle_model || '';
      const customer = r.customer_name || '';
      const title = `${year ? year + ' ' : ''}${make} ${model}`.trim() + (customer ? ` - ${customer}` : '');
      const statusMap = {
        'requested': 'Requested',
        'in-progress': 'In Process',
        'in_progress': 'In Process',
        'in progress': 'In Process',
        'completed': 'Completed',
        'pending': 'Pending',
        'accepted': 'In Process',
      };
      const rawStatus = (r.status || '').toLowerCase();
      const displayStatus = statusMap[rawStatus] || r.status || 'Requested';
      return {
        id: r.id,
        title,
        charges: Number(r.quote_total || 0),
        status: displayStatus,
        status_raw: rawStatus,
        updatedAt: r.updated_at || r.created_at || new Date(),
        created_by: r.created_by || null,
        accepted_by: r.accepted_by || null,
        supplier_email: r.supplier_email || null,
        customer_name: r.customer_name || null,
        customer_phone: r.customer_phone || null,
        vehicle_make: r.vehicle_make || null,
        vehicle_model: r.vehicle_model || null,
        vehicle_year: r.vehicle_year || null,
        vehicle_vin: r.vehicle_vin || null,
        created_at: r.created_at || null,
        quote_total: Number(r.quote_total || 0),
      };
    };

    const orders = rows.map(normalize);

    // Mismatch diagnostics
    const mismatches = [];
    if (supplier_email || order_number || vin || date_from || date_to) {
      let exactMatchFound = false;
      for (const r of rows) {
        const matchesSupplier = supplier_email ? String(r.supplier_email || '').toLowerCase().trim() === String(supplier_email).toLowerCase().trim() : true;
        const matchesOrder = order_number ? Number(r.id) === Number(order_number) : true;
        const matchesVin = vin ? String(r.vehicle_vin || '').toLowerCase().trim() === String(vin).toLowerCase().trim() : true;
        const createdDate = r.created_at ? new Date(r.created_at) : null;
        const matchesFrom = date_from ? (createdDate && createdDate >= new Date(date_from)) : true;
        const matchesTo = date_to ? (createdDate && createdDate <= new Date(date_to)) : true;
        if (matchesSupplier && matchesOrder && matchesVin && matchesFrom && matchesTo) {
          exactMatchFound = true;
          break;
        }
      }

      if (!exactMatchFound) {
        if (supplier_email && !rows.some(r => String(r.supplier_email || '').toLowerCase().trim() === String(supplier_email).toLowerCase().trim())) {
          mismatches.push('Vendor does not match any work order (supplier_email).');
        }
        if (order_number && !rows.some(r => Number(r.id) === Number(order_number))) {
          mismatches.push('Order Number does not match any work order.');
        }
        if (vin && !rows.some(r => String(r.vehicle_vin || '').toLowerCase().trim() === String(vin).toLowerCase().trim())) {
          mismatches.push('VIN does not match any work order.');
        }
        if (date_from) {
          const df = new Date(date_from);
          if (!rows.some(r => r.created_at && new Date(r.created_at) >= df)) {
            mismatches.push('Date From is after all work orders.');
          }
        }
        if (date_to) {
          const dt = new Date(date_to);
          if (!rows.some(r => r.created_at && new Date(r.created_at) <= dt)) {
            mismatches.push('Date To is before all work orders.');
          }
        }
        if (rows.length) {
          mismatches.push('No single work order matches all selected criteria together.');
        }
      }
    }

    res.json({ success: true, orders, mismatches });
  } catch (e) {
    console.error('Search work orders failed:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Fetch full details of a single work order
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, error: 'Invalid id' });
  try {
    const [orders] = await pool.query(`SELECT * FROM work_orders WHERE id = ?`, [id]);
    if (!orders.length) return res.status(404).json({ success: false, error: 'Not found' });
    const order = orders[0];
    
    // Parse repairs_json if it exists
    if (order.repairs_json) {
      try {
        // Check if it's already an object or array
        if (typeof order.repairs_json === 'object') {
          // Already parsed, keep as is
        } else if (typeof order.repairs_json === 'string' && order.repairs_json.includes('[object Object]')) {
          console.warn(`Corrupted repairs_json detected for order ${id}: "${order.repairs_json}". Setting to null.`);
          order.repairs_json = null;
        } else {
          order.repairs_json = JSON.parse(order.repairs_json);
        }
      } catch (e) {
        console.warn(`Failed to parse repairs_json for order ${id}: "${order.repairs_json}" - ${e.message}`);
        order.repairs_json = null;
      }
    }
    
    // Parse paint_codes_json if it exists
    if (order.paint_codes_json) {
      try {
        // Check if it's already an object or array
        if (typeof order.paint_codes_json === 'object') {
          // Already parsed, keep as is
        } else if (typeof order.paint_codes_json === 'string' && order.paint_codes_json.includes('[object Object]')) {
          console.warn(`Corrupted paint_codes_json detected for order ${id}: "${order.paint_codes_json}". Setting to null.`);
          order.paint_codes_json = null;
        } else {
          order.paint_codes_json = JSON.parse(order.paint_codes_json);
        }
      } catch (e) {
        console.warn(`Failed to parse paint_codes_json for order ${id}: "${order.paint_codes_json}" - ${e.message}`);
        order.paint_codes_json = null;
      }
    }
    
    const [items] = await pool.query(`SELECT * FROM work_order_items WHERE work_order_id = ?`, [id]);
    const [workTypes] = await pool.query(`SELECT * FROM work_order_work_types WHERE work_order_id = ?`, [id]);
    const [photos] = await pool.query(`SELECT * FROM work_order_photos WHERE work_order_id = ?`, [id]);
    res.json({ success: true, order, items, work_types: workTypes, photos });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Update status of a work order
router.put('/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const { status, accepted_by } = req.body || {};
  if (!id) return res.status(400).json({ success: false, error: 'Invalid id' });
  if (!status) return res.status(400).json({ success: false, error: 'Missing status' });
  try {
    // If accepted_by is provided and status is in_progress, persist it.
    let sql = `UPDATE work_orders SET status = ?, updated_at = NOW()`;
    const params = [status, id];
    if (accepted_by && String(status).toLowerCase().replace(/\s+/g, '_') === 'in_progress') {
      sql = `UPDATE work_orders SET status = ?, accepted_by = ?, updated_at = NOW() WHERE id = ?`;
      params.splice(1, 0, accepted_by);
    } else {
      sql = `UPDATE work_orders SET status = ?, updated_at = NOW() WHERE id = ?`;
    }

    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Update supplier assignment fields (supply_item, item_description)
router.put('/:id/supplier', async (req, res) => {
  const id = Number(req.params.id);
  const { supply_item, item_description } = req.body || {};
  if (!id) return res.status(400).json({ success: false, error: 'Invalid id' });
  if (!supply_item || String(supply_item).trim() === '') {
    return res.status(400).json({ success: false, error: 'Missing supply_item' });
  }
  try {
    const [result] = await pool.query(
      `UPDATE work_orders SET supply_item = ?, item_description = ?, updated_at = NOW() WHERE id = ?`,
      [String(supply_item).trim(), item_description ? String(item_description).trim() : null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Refer to consultant for supplier approval: set temp fields
router.put('/:id/refer', async (req, res) => {
  const id = Number(req.params.id);
  const { supply_item, item_description } = req.body || {};
  if (!id) return res.status(400).json({ success: false, error: 'Invalid id' });
  if (!supply_item || String(supply_item).trim() === '') {
    return res.status(400).json({ success: false, error: 'Missing supply_item' });
  }
  try {
    const [result] = await pool.query(
      `UPDATE work_orders SET temp_supply_item = ?, temp_desc = ?, updated_at = NOW() WHERE id = ?`,
      [String(supply_item).trim(), item_description ? String(item_description).trim() : null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Confirm technician referral: copy temp fields to permanent and clear temp
router.put('/:id/refer-confirm', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, error: 'Invalid id' });
  try {
    const [rows] = await pool.query(`SELECT temp_supply_item, temp_desc FROM work_orders WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    const { temp_supply_item, temp_desc } = rows[0] || {};
    if (!temp_supply_item) {
      return res.status(400).json({ success: false, error: 'No referral to confirm' });
    }
    const [result] = await pool.query(
      `UPDATE work_orders SET supply_item = ?, item_description = ?, temp_supply_item = NULL, temp_desc = NULL, updated_at = NOW() WHERE id = ?`,
      [String(temp_supply_item).trim(), temp_desc ? String(temp_desc).trim() : null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Decline technician referral: clear temp fields
router.put('/:id/refer-decline', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, error: 'Invalid id' });
  try {
    const [result] = await pool.query(
      `UPDATE work_orders SET temp_supply_item = NULL, temp_desc = NULL, updated_at = NOW() WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Approve work order by supplier: set supplier_email and mark accepted
router.put('/:id/approve', async (req, res) => {
  const id = Number(req.params.id);
  const { supplier_email } = req.body || {};
  if (!id) return res.status(400).json({ success: false, error: 'Invalid id' });
  if (!supplier_email || String(supplier_email).trim() === '') {
    return res.status(400).json({ success: false, error: 'Missing supplier_email' });
  }
  try {
    const [result] = await pool.query(
      `UPDATE work_orders SET supplier_email = ?, status = CASE WHEN status IN ('requested','pending') THEN 'in_progress' ELSE status END, updated_at = NOW() WHERE id = ?`,
      [String(supplier_email).trim(), id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Delete a work order (and its related records)
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, error: 'Invalid id' });
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    await conn.query(`DELETE FROM work_order_photos WHERE work_order_id = ?`, [id]);
    await conn.query(`DELETE FROM work_order_work_types WHERE work_order_id = ?`, [id]);
    await conn.query(`DELETE FROM work_order_items WHERE work_order_id = ?`, [id]);
    const [result] = await conn.query(`DELETE FROM work_orders WHERE id = ?`, [id]);
    await conn.commit();
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, error: e.message });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
