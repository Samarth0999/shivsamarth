# 🚗 ShivSamarth Driving Academy — Custom Driving School Management Web App

A production-grade, full-stack, multi-branch driving school management web application synthesized from master design specifications.

---

## 🌟 Master Feature Inventory & Module Implementation

### Module 1: Multi-Branch Architecture & Access Control
* **Super Admin / Owner Master Dashboard:** Global cross-branch visibility, consolidated revenue analytics, full user management, and system-wide configuration controls.
* **Branch-Level Data Isolation:** Instructors and branch staff are strictly locked to their assigned `branch_id`. They cannot view, search, edit, or delete data from other branches.
* **Auto-Branch Assignment:** When standard staff register a new student, the system automatically tags the student profile with that staff member's branch.
* **Global Universal Search:** Top navigation bar search box (`[ 🔍 Search by Name, Phone, or Enroll ID ]`) with instant floating preview across authorized branches.
* **Quick Persona Switcher:** Built-in live testing persona switcher in the header allowing 1-click toggling between **👑 Super Admin (Samarth Gore)**, **🏢 Beed Branch Manager (Suresh Kale)**, **🏢 Pune Branch Manager (Nitin Shirole)**, **🚗 Lead Instructor (Rajesh Patil)**, **🚗 Daily Wage Instructor (Amit Shinde)**, and **📋 Office Counselor (Pooja More)**.

---

### Module 2: Dynamic Admin Settings Hub
* **Course Types Management:** Add/edit packages, define training durations (e.g. 26 days), set default base fees, toggle status, and configure the license requirement flag (`is_license_course`).
* **Payment Modes Configuration:** Manage accepted payment methods (`Cash`, `UPI`, `Card`, `Bank Transfer`, or custom modes).
* **Expense Categories Management:** Configure daily operational cost tags (`Fuel`, `Vehicle Maintenance`, `Repairs`, `Tea / Refreshments`, `RTO Fees`, `Office Supplies`).
* **Risk & Trigger Threshold Adjusters:** Customize system trigger points, such as changing the default **Day 10** fee warning threshold, geofence radius in meters, and low/high risk boundaries.

---

### Module 3: Granular Role-Based Access Control (RBAC)
* **Default Instructor Restrictions:** Clean, focused mobile interface limited strictly to:
  1. Student batch attendance (`[ ✅ Present ]` / `[ ❌ Absent ]`).
  2. Geofenced staff check-in / check-out.
  3. Personal attendance history and wage tracking.
  4. Day 10 Soft Warning dashboard and WhatsApp reminder triggers.
* **Custom Admin Privilege Matrix:** Super Admins can toggle individual permissions per user across:
  * **Core CRUD Rights:** View, add, edit, or delete Leads, Students, Vehicles, and Batch Schedules.
  * **Financial Privileges:** Authority to process fee refunds, delete payments, edit expenses, and assign staff `max_discount_limit` amounts (₹).
  * **Customer Engagement Switches:** Toggles for automated WhatsApp notifications, fee payment reminders, and DL expiry alerts.

---

### Module 4: Student Admission & Registration Engine
* **Auto-Generated Enroll ID:** Branch-coded, sequence-locked read-only format (e.g. `BEED-2026-001`, `PUNE-2026-001`).
* **Unified Contact Field:** Single `phone` input handling voice calls, SMS, and WhatsApp alerts.
* **Controlled Pricing & Discount Validation:**
  * Base fee automatically pulls from the selected Course Type and is locked against direct editing by standard staff.
  * Staff enter discounts in a dedicated `Discount Given` field, validated live against their assigned `max_discount_limit`.
  * Auto-calculated Net Total Fee ($\text{Base Fee} - \text{Discount}$) and Pending Balance ($\text{Net Total Fee} - \text{Advance Paid}$).
* **Conditional RTO & License Section (Dynamic):**
  * Expands automatically **only** when `is_license_course == true`.
  * **LL Stage Fields:** Application No., Receipt No., Receipt Amount (₹), Issue Date, Expiry Date.
  * **DL Stage Fields:** Application No., Receipt No., Receipt Amount (₹), DL Number, Expiry Date.

---

### Module 5: Batch Management, Vehicle Rotation & Instructor Continuity
* **Batch Slot Capacity Caps:** Pre-defined 1-hour time slots with a hard capacity limit (maximum 4 students per slot).
* **Instructor Continuity:** Primary instructor remains permanently paired with the student throughout their training course.
* **Rotational Fleet Schedule:** Training vehicles (e.g. Maruti Suzuki Brezza, Hyundai i10, Tata Nexon) are rotated weekly or every 5–6 days across batch slots to equalize wear and tear.

---

### Module 6: Simplified Attendance & Strategy A Absence Engine
* **Fast Instructor UI:** Clean mobile batch roster with simple **[ ✅ Present ]** and **[ ❌ Absent ]** toggle buttons.
* **Strategy A Absence Rule:**
  * **Present:** Increments `days_completed` by 1 ($1/26 \rightarrow 2/26$).
  * **Absent:** Leaves `days_completed` unchanged and automatically extends the student's calculated graduation end date by **+1 calendar day** without changing their batch slot.
* **RTO Test Hard Gate:** Strict system lock preventing scheduling of the final RTO driving test queue until `days_completed == total_course_days` AND `pending_balance == 0`.

---

### Module 7: Financial Risk Matrix & Day 10 Reminders
* **Day 10 Soft Warning Dashboard:** Automatically flags students who reach Day 10 of training with an unpaid balance.
* **Daily WhatsApp Reminder Button:** Dedicated **`[ 💬 Send WhatsApp Fee Reminder ]`** button opening WhatsApp with pre-filled balance reminder message.
* **Dynamic Risk Categorization:**
  * $\text{Remaining Days} = \text{Total Course Days} - \text{Days Completed}$
  * 🟢 **LOW RISK:** Balance $== 0$ OR Remaining Days $\ge 15$.
  * 🟡 **MEDIUM RISK:** Remaining Days between 6 and 14 AND Paid Amount $< 50\%$.
  * 🔴 **HIGH RISK:** Remaining Days $\le 5$ AND Balance $> 0$.

---

### Module 8: Geofenced Staff Attendance & Automated Payroll
* **GPS Geofenced Check-In:** Validates live browser GPS coordinates against branch location using the Haversine formula (within configured 100-meter radius). Includes live GPS simulation controls for testing on any device.
* **Automated Payroll Calculation Engine:**
  * Supports Monthly Salaries or Daily Wages.
  * Tracks cash/UPI salary advances given during the month.
  * Computes net payroll automatically:
    $$\text{Gross Pay} = \left(\frac{\text{Base Salary}}{\text{Days in Month}} \times \text{Days Present}\right) + \text{Incentives}$$
    $$\text{Net Payable} = \text{Gross Pay} - \text{Advances Deducted}$$

---

### Module 9: Daily Expense Tracker
* Quick-entry logging for operational costs: `Fuel`, `Vehicle Maintenance`, `Repairs`, `Tea / Refreshments`, `RTO Fees`, and `Office Supplies`.
* Tagged to specific `vehicle_id`, `branch_id`, and `logged_by_user` to provide accurate branch-level and vehicle-level P&L tracking.

---

### Module 10: Reports & PDF Export Module
* **3 Standalone Report Engines:**
  1. **Fees Collection Report** (itemized payments, mode breakdown, staff tracking).
  2. **Pending Fees & Defaulters Report** (risk levels, contact numbers, remaining balances).
  3. **Expenses Report** (operational costs tagged to vehicles and categories).
* **Flexible Time-Frame Controls:** Weekly, Monthly, or Custom Date Ranges (`From Date` to `To Date`).
* **Single-Click PDF Downloads:** Generates professional PDF documents with clean tables, driving school branding, and summary metrics.

---

## 🚀 Running the Application

### Prerequisites
* Node.js (v18+)
* npm

### Quick Start
```bash
# 1. Start the complete application (Backend + Frontend)
npm run dev

# Or start the server (which also serves the compiled frontend)
npm start
```

* **Frontend & Full App:** Open `http://localhost:5173` (Vite dev) or `http://localhost:5000` (Production server)
* **Backend API:** `http://localhost:5000/api`
