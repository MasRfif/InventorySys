// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Transaction = {
  id: string;
  code: string;
  deliveryCode?: string;
  type: "in" | "out" | "buy" | "sell";
  itemName: string;
  quantity: number;
  price: number;
  date: string;
  notes?: string;
  customer?: string;
  supplier?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "in" | "out" | "buy" | "sell"
  >("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [docType, setDocType] = useState<"invoice" | "delivery" | "exit">(
    "invoice"
  );

  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
    price: "",
    notes: "",
    customer: "",
    supplier: "",
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      router.push("/login");
      return;
    }

    const email = localStorage.getItem("userEmail") || "";
    const name = localStorage.getItem("userName") || email.split("@")[0];
    setUser({ email, name });

    const saved = localStorage.getItem("transactions");
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, [router]);

  const generateQRCode = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      text
    )}`;
  };

  const generateTransactionCode = (type: string) => {
    const prefix = {
      in: "IN",
      out: "OUT",
      buy: "BUY",
      sell: "INV",
    };
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix[type as keyof typeof prefix]}-${date}-${random}`;
  };

  const generateDeliveryCode = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SJ-${date}-${random}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    router.push("/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const type = activeTab as "in" | "out" | "buy" | "sell";
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      code: generateTransactionCode(type),
      deliveryCode: type === "sell" ? generateDeliveryCode() : undefined,
      type: type,
      itemName: formData.itemName,
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price),
      date: new Date().toISOString(),
      notes: formData.notes,
      customer: formData.customer,
      supplier: formData.supplier,
    };

    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    localStorage.setItem("transactions", JSON.stringify(updated));

    setFormData({
      itemName: "",
      quantity: "",
      price: "",
      notes: "",
      customer: "",
      supplier: "",
    });
    setShowModal(false);

    // Auto show QR after create
    setSelectedTransaction(newTransaction);
    setShowQRModal(true);
  };

  const handlePrintDocument = (
    transaction: Transaction,
    type: "invoice" | "delivery" | "exit"
  ) => {
    setSelectedTransaction(transaction);
    setDocType(type);
    setShowDocModal(true);
  };

  const printDoc = () => {
    window.print();
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      in: "Barang Masuk",
      out: "Barang Keluar",
      buy: "Pembelian",
      sell: "Penjualan",
    };
    return labels[type as keyof typeof labels];
  };

  const getTypeColor = (type: string) => {
    const colors = {
      in: "from-emerald-500 to-green-600",
      out: "from-rose-500 to-red-600",
      buy: "from-blue-500 to-indigo-600",
      sell: "from-purple-500 to-pink-600",
    };
    return colors[type as keyof typeof colors];
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      in: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
      out: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
      buy: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
      sell: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    };
    return colors[type as keyof typeof colors];
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesTab = activeTab === "overview" || t.type === activeTab;
    const matchesSearch =
      !searchQuery ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const stats = {
    totalIn: transactions
      .filter((t) => t.type === "in")
      .reduce((sum, t) => sum + t.quantity, 0),
    totalOut: transactions
      .filter((t) => t.type === "out")
      .reduce((sum, t) => sum + t.quantity, 0),
    totalBuy: transactions
      .filter((t) => t.type === "buy")
      .reduce((sum, t) => sum + t.quantity * t.price, 0),
    totalSell: transactions
      .filter((t) => t.type === "sell")
      .reduce((sum, t) => sum + t.quantity * t.price, 0),
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      {/* Header with Gradient */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/50 bg-white/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300">
                <svg
                  className="h-6 w-6 text-white dark:text-zinc-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Inventory Pro
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {user.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats with Gradients */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Barang Masuk",
              value: stats.totalIn,
              suffix: "unit",
              gradient: "from-emerald-500 to-green-600",
              icon: "↓",
            },
            {
              label: "Barang Keluar",
              value: stats.totalOut,
              suffix: "unit",
              gradient: "from-rose-500 to-red-600",
              icon: "↑",
            },
            {
              label: "Pembelian",
              value: `Rp ${stats.totalBuy.toLocaleString("id-ID")}`,
              suffix: "",
              gradient: "from-blue-500 to-indigo-600",
              icon: "🛒",
            },
            {
              label: "Penjualan",
              value: `Rp ${stats.totalSell.toLocaleString("id-ID")}`,
              suffix: "",
              gradient: "from-purple-500 to-pink-600",
              icon: "💰",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm transition-all hover:shadow-xl dark:border-zinc-800/50 dark:bg-zinc-900"
            >
              <div
                className={`absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl transition-all group-hover:scale-150`}
              ></div>
              <div className="relative">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {stat.label}
                  </p>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <p className="mt-3 text-3xl font-bold text-zinc-900 dark:text-white">
                  {typeof stat.value === "number" ? stat.value : stat.value}
                </p>
                {stat.suffix && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {stat.suffix}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mt-8">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan kode transaksi atau nama barang..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {[
                { key: "overview", label: "Semua Transaksi", icon: "📋" },
                { key: "in", label: "Barang Masuk", icon: "📥" },
                { key: "out", label: "Barang Keluar", icon: "📤" },
                { key: "buy", label: "Pembelian", icon: "🛒" },
                { key: "sell", label: "Penjualan", icon: "💰" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() =>
                    setActiveTab(tab.key as "in" | "out" | "buy" | "sell")
                  }
                  className={`flex items-center space-x-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition-all ${
                    activeTab === tab.key
                      ? "bg-zinc-900 text-white shadow-lg dark:bg-white dark:text-black"
                      : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {activeTab !== "overview" && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl dark:from-white dark:to-zinc-200 dark:text-black"
              >
                <span className="text-xl">+</span>
                <span>Tambah data</span>
              </button>
            )}
          </div>

          {/* Transactions */}
          <div className="mt-6 space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200/50 bg-white p-16 text-center shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <svg
                    className="h-8 w-8 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {searchQuery
                    ? "Tidak ada transaksi yang cocok"
                    : "Belum ada transaksi"}
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="group rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-zinc-800/50 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`rounded-lg border px-3 py-1 text-xs font-bold ${getTypeBadge(
                            transaction.type
                          )}`}
                        >
                          {getTypeLabel(transaction.type)}
                        </span>
                        <span className="font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          {transaction.code}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-zinc-900 dark:text-white">
                        {transaction.itemName}
                      </h3>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-zinc-600 dark:text-zinc-400">
                        <span>📦 {transaction.quantity} unit</span>
                        <span>•</span>
                        <span>
                          💵 Rp {transaction.price.toLocaleString("id-ID")}/unit
                        </span>
                      </div>
                      {transaction.customer && (
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          👤 {transaction.customer}
                        </p>
                      )}
                      {transaction.supplier && (
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          🏢 {transaction.supplier}
                        </p>
                      )}
                      {transaction.notes && (
                        <p className="mt-2 text-sm italic text-zinc-500 dark:text-zinc-500">
                          📝 {transaction.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                        Rp{" "}
                        {(
                          transaction.quantity * transaction.price
                        ).toLocaleString("id-ID")}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(transaction.date).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowQRModal(true);
                      }}
                      className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                    >
                      📱 QR Code
                    </button>

                    {transaction.type === "sell" && (
                      <>
                        <button
                          onClick={() =>
                            handlePrintDocument(transaction, "invoice")
                          }
                          className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                        >
                          📄 Invoice
                        </button>
                        <button
                          onClick={() =>
                            handlePrintDocument(transaction, "delivery")
                          }
                          className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                        >
                          🚚 Surat Jalan
                        </button>
                      </>
                    )}

                    {transaction.type === "out" && (
                      <button
                        onClick={() =>
                          handlePrintDocument(transaction, "delivery")
                        }
                        className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                      >
                        🚚 Surat Jalan
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center space-x-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getTypeColor(
                  activeTab
                )} text-2xl text-white shadow-lg`}
              >
                {activeTab === "in" && "📥"}
                {activeTab === "out" && "📤"}
                {activeTab === "buy" && "🛒"}
                {activeTab === "sell" && "💰"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Tambah{" "}
                  {getTypeLabel(activeTab as "in" | "out" | "buy" | "sell")}
                </h3>
                <p className="text-sm text-zinc-500">Isi detail transaksi</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-white">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value })
                  }
                  className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm transition-all focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
                  placeholder="Contoh: Laptop Dell XPS 13"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-white">
                    Jumlah (Unit) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm transition-all focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-white">
                    Harga/Unit *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm transition-all focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              {(activeTab === "sell" || activeTab === "buy") && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-white">
                    {activeTab === "sell" ? "Nama Customer" : "Nama Supplier"}
                  </label>
                  <input
                    type="text"
                    value={
                      activeTab === "sell"
                        ? formData.customer
                        : formData.supplier
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [activeTab === "sell" ? "customer" : "supplier"]:
                          e.target.value,
                      })
                    }
                    className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm transition-all focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder={
                      activeTab === "sell"
                        ? "PT. Example Corp"
                        : "PT. Supplier Indo"
                    }
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-white">
                  Catatan
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm transition-all focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  rows={3}
                  placeholder="Tambahkan catatan..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      itemName: "",
                      quantity: "",
                      price: "",
                      notes: "",
                      customer: "",
                      supplier: "",
                    });
                  }}
                  className="flex-1 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl dark:from-white dark:to-zinc-200 dark:text-black"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-6 text-xl font-bold text-zinc-900 dark:text-white">
              QR Code Transaksi
            </h3>

            <div className="mx-auto mb-6 w-fit rounded-2xl bg-white p-4 shadow-lg">
              <img
                src={generateQRCode(selectedTransaction.code)}
                alt="QR Code"
                className="h-64 w-64"
              />
            </div>

            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
              <p className="font-mono text-sm font-bold text-zinc-900 dark:text-white">
                {selectedTransaction.code}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {selectedTransaction.itemName}
              </p>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="mt-6 w-full rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {docType === "invoice" && "📄 Invoice"}
                {docType === "delivery" && "🚚 Surat Jalan"}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={printDoc}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => setShowDocModal(false)}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-8">
              {/* Invoice Template */}
              {docType === "invoice" && (
                <div className="space-y-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        INVOICE
                      </h2>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        No Invoice: {selectedTransaction.code}
                      </p>
                      {selectedTransaction.deliveryCode && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          No Surat Jalan: {selectedTransaction.deliveryCode}
                        </p>
                      )}
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Tanggal:{" "}
                        {new Date(selectedTransaction.date).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                        Inventory Pro
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Jl. Contoh No. 123
                        <br />
                        Bandung, Jawa Barat
                        <br />
                        Telp: (022) 1234567
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="mb-2 text-sm font-bold text-zinc-900 dark:text-white">
                        KEPADA:
                      </h4>
                      <p className="text-zinc-900 dark:text-white">
                        {selectedTransaction.customer || "Customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <img
                        src={generateQRCode(selectedTransaction.code)}
                        alt="QR Code"
                        className="ml-auto h-24 w-24 rounded-lg border border-zinc-200 dark:border-zinc-700"
                      />
                    </div>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-zinc-900 dark:border-white">
                        <th className="pb-3 text-left text-sm font-bold text-zinc-900 dark:text-white">
                          ITEM
                        </th>
                        <th className="pb-3 text-center text-sm font-bold text-zinc-900 dark:text-white">
                          QTY
                        </th>
                        <th className="pb-3 text-right text-sm font-bold text-zinc-900 dark:text-white">
                          HARGA
                        </th>
                        <th className="pb-3 text-right text-sm font-bold text-zinc-900 dark:text-white">
                          TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <td className="py-4 text-zinc-900 dark:text-white">
                          {selectedTransaction.itemName}
                        </td>
                        <td className="py-4 text-center text-zinc-900 dark:text-white">
                          {selectedTransaction.quantity}
                        </td>
                        <td className="py-4 text-right text-zinc-900 dark:text-white">
                          Rp {selectedTransaction.price.toLocaleString("id-ID")}
                        </td>
                        <td className="py-4 text-right text-zinc-900 dark:text-white">
                          Rp{" "}
                          {(
                            selectedTransaction.quantity *
                            selectedTransaction.price
                          ).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Subtotal:
                        </span>
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          Rp{" "}
                          {(
                            selectedTransaction.quantity *
                            selectedTransaction.price
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between border-t-2 border-zinc-900 pt-2 text-lg font-bold dark:border-white">
                        <span className="text-zinc-900 dark:text-white">
                          TOTAL:
                        </span>
                        <span className="text-zinc-900 dark:text-white">
                          Rp{" "}
                          {(
                            selectedTransaction.quantity *
                            selectedTransaction.price
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedTransaction.notes && (
                    <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        <strong>Catatan:</strong> {selectedTransaction.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-12 grid grid-cols-2 gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
                    <div className="text-center">
                      <p className="mb-2 text-sm font-bold text-zinc-900 dark:text-white">
                        Penerima
                      </p>
                      <div className="mb-16"></div>
                      <div className="border-t border-zinc-900 pt-2 dark:border-white">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          ( .................... )
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="mb-2 text-sm font-bold text-zinc-900 dark:text-white">
                        Hormat Kami
                      </p>
                      <div className="mb-16"></div>
                      <div className="border-t border-zinc-900 pt-2 dark:border-white">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Inventory Pro
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Note Template */}
              {docType === "delivery" && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
                      SURAT JALAN
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      No:{" "}
                      {selectedTransaction.deliveryCode ||
                        selectedTransaction.code}
                    </p>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                        Inventory Pro
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Jl. Contoh No. 123
                        <br />
                        Bandung, Jawa Barat
                        <br />
                        Telp: (022) 1234567
                      </p>
                    </div>
                    <div className="text-right">
                      <img
                        src={generateQRCode(
                          selectedTransaction.deliveryCode ||
                            selectedTransaction.code
                        )}
                        alt="QR Code"
                        className="h-24 w-24 rounded-lg border border-zinc-200 dark:border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        KEPADA:
                      </p>
                      <p className="mt-2 text-zinc-900 dark:text-white">
                        {selectedTransaction.customer || "Customer"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        TANGGAL:
                      </p>
                      <p className="mt-2 text-zinc-900 dark:text-white">
                        {new Date(selectedTransaction.date).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedTransaction.type === "sell" && (
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Referensi Invoice:</strong>{" "}
                        {selectedTransaction.code}
                      </p>
                    </div>
                  )}

                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-zinc-900 dark:border-white">
                        <th className="pb-3 text-left text-sm font-bold text-zinc-900 dark:text-white">
                          NO
                        </th>
                        <th className="pb-3 text-left text-sm font-bold text-zinc-900 dark:text-white">
                          NAMA BARANG
                        </th>
                        <th className="pb-3 text-center text-sm font-bold text-zinc-900 dark:text-white">
                          JUMLAH
                        </th>
                        <th className="pb-3 text-left text-sm font-bold text-zinc-900 dark:text-white">
                          SATUAN
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <td className="py-4 text-zinc-900 dark:text-white">
                          1
                        </td>
                        <td className="py-4 text-zinc-900 dark:text-white">
                          {selectedTransaction.itemName}
                        </td>
                        <td className="py-4 text-center text-zinc-900 dark:text-white">
                          {selectedTransaction.quantity}
                        </td>
                        <td className="py-4 text-zinc-900 dark:text-white">
                          Unit
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {selectedTransaction.notes && (
                    <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        <strong>Catatan:</strong> {selectedTransaction.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-12 grid grid-cols-3 gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
                    <div className="text-center">
                      <p className="mb-2 text-sm font-bold text-zinc-900 dark:text-white">
                        Pengirim
                      </p>
                      <div className="mb-16"></div>
                      <div className="border-t border-zinc-900 pt-2 dark:border-white">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Admin Gudang
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="mb-2 text-sm font-bold text-zinc-900 dark:text-white">
                        Sopir
                      </p>
                      <div className="mb-16"></div>
                      <div className="border-t border-zinc-900 pt-2 dark:border-white">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          ( .................... )
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="mb-2 text-sm font-bold text-zinc-900 dark:text-white">
                        Penerima
                      </p>
                      <div className="mb-16"></div>
                      <div className="border-t border-zinc-900 pt-2 dark:border-white">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          ( .................... )
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Exit Note Template - Removed */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
