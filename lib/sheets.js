import { JWT } from "google-auth-library";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const RAW_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || "";
const PRIVATE_KEY = RAW_PRIVATE_KEY.includes("\\\\n")
  ? RAW_PRIVATE_KEY.replace(/\\\\n/g, "\n")
  : RAW_PRIVATE_KEY;

const CACHE_TTL_MS = Number(process.env.SHEETS_CACHE_TTL_MS || 30000);

// Sheet tab names (must match the tabs in the spreadsheet exactly).
const TAB_CUSTOMERS = "Customers";
const TAB_INVOICES = "Invoices";
const TAB_PAYMENTS = "CustomerPayments";

let jwtClient = null;
let cache = { data: null, timestamp: 0 };

function getJwtClient() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY || !SHEET_ID) {
    throw new Error(
      "Missing Google Sheets credentials. Set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in your environment (see .env.example)."
    );
  }
  if (!jwtClient) {
    jwtClient = new JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  }
  return jwtClient;
}

async function fetchRange(range) {
  const client = getJwtClient();
  const { token } = await client.getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}`;

  let res;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(`Network error contacting Google Sheets API: ${err.message}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 403) {
      throw new Error(
        `Access denied reading "${range}". Make sure the sheet is shared with the service account email (${CLIENT_EMAIL}) as at least a Viewer.`
      );
    }
    if (res.status === 404) {
      throw new Error(
        `Sheet or tab not found for range "${range}". Check GOOGLE_SHEET_ID and that the tab name matches exactly.`
      );
    }
    throw new Error(
      `Failed to read "${range}" from Google Sheets (${res.status}): ${body || res.statusText}`
    );
  }

  const data = await res.json();
  return data.values || [];
}

function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const headers = rows[0].map((h) => String(h || "").trim());
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) => {
      const obj = {};
      headers.forEach((header, i) => {
        if (!header) return;
        obj[header] = row[i] !== undefined ? row[i] : "";
      });
      return obj;
    });
}

export function parseCurrency(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const str = String(value).trim();
  if (!str) return 0;
  const isNegative = str.includes("-");
  const cleaned = str.replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned || "0");
  if (Number.isNaN(num)) return 0;
  return isNegative ? -num : num;
}

function isActiveFlag(value) {
  return String(value || "").trim().toUpperCase() === "TRUE";
}

async function loadAllData() {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  const [customerRows, invoiceRows, paymentRows] = await Promise.all([
    fetchRange(`${TAB_CUSTOMERS}!A:Z`),
    fetchRange(`${TAB_INVOICES}!A:Z`),
    fetchRange(`${TAB_PAYMENTS}!A:Z`),
  ]);

  const data = {
    customers: rowsToObjects(customerRows),
    invoices: rowsToObjects(invoiceRows),
    payments: rowsToObjects(paymentRows),
    fetchedAt: now,
  };

  cache = { data, timestamp: now };
  return data;
}

// All contractors, aggregated from every project (Customers row) they own.
export async function getContractors() {
  const { customers } = await loadAllData();
  const map = new Map();

  for (const c of customers) {
    const contractorName = (c.Client || "").trim() || "Unassigned";
    if (!map.has(contractorName)) {
      map.set(contractorName, {
        name: contractorName,
        phone: "",
        projectCount: 0,
        activeProjectCount: 0,
        totalAmount: 0,
        totalPayment: 0,
        totalBalance: 0,
      });
    }
    const entry = map.get(contractorName);
    entry.projectCount += 1;
    if (isActiveFlag(c.Active)) entry.activeProjectCount += 1;
    entry.totalAmount += parseCurrency(c.TotalAmount);
    entry.totalPayment += parseCurrency(c.TotalPayment);
    entry.totalBalance += parseCurrency(c.DueAmount);

    const contact = String(c.Contact || "").trim();
    if (!entry.phone && contact && contact !== "0") {
      entry.phone = contact;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalBalance - a.totalBalance);
}

export async function getContractor(name) {
  const contractors = await getContractors();
  return contractors.find((c) => c.name === name) || null;
}

export async function getProjectsForContractor(contractorName) {
  const { customers } = await loadAllData();
  return customers
    .filter((c) => ((c.Client || "").trim() || "Unassigned") === contractorName)
    .map((c) => ({
      name: c.CustomerName,
      contractor: contractorName,
      active: isActiveFlag(c.Active),
      totalAmount: parseCurrency(c.TotalAmount),
      totalPayment: parseCurrency(c.TotalPayment),
      balance: parseCurrency(c.DueAmount),
      phone: c.Contact || "",
      employee: c.Employee || "",
      lastReminded: c["Last Reminded"] || "",
      balanceRange: c.BalanceRange || "",
      notes: c.Notes || "",
    }))
    .sort((a, b) => b.balance - a.balance);
}

export async function getProject(projectName) {
  const { customers, invoices, payments } = await loadAllData();
  const project = customers.find((c) => c.CustomerName === projectName);
  if (!project) return null;

  const projectInvoices = invoices
    .filter((inv) => inv.CustomerName === projectName)
    .map((inv) => ({
      invoiceNumber: inv.InvoiceNumber,
      date: inv.InvoiceDate,
      amount: parseCurrency(inv.InvoiceAmount),
      paidAmount: parseCurrency(inv.PaidAmount),
      balanceAmount: parseCurrency(inv.BalanceAmount),
      status: inv.PaymentStatus,
      totalDays: inv.TotalDays,
      dateRange: inv.DateRange,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const projectPayments = payments
    .filter((p) => p.CustomerName === projectName)
    .map((p) => ({
      date: p.PaymentDate,
      receiptNo: p.ReceiptNo,
      amount: parseCurrency(p.Amount),
      balance: parseCurrency(p.Balance),
      paymentType: p.PaymentType,
      remarks: p.Remarks,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    name: project.CustomerName,
    contractor: (project.Client || "").trim() || "Unassigned",
    active: isActiveFlag(project.Active),
    totalAmount: parseCurrency(project.TotalAmount),
    totalPayment: parseCurrency(project.TotalPayment),
    balance: parseCurrency(project.DueAmount),
    phone: project.Contact || "",
    employee: project.Employee || "",
    notes: project.Notes || "",
    invoices: projectInvoices,
    payments: projectPayments,
  };
}
