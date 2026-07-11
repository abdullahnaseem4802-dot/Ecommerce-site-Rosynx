"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { api, DashboardStats } from "@/lib/api";
import { Card, StatusPill } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

const money = (n: number) =>
  "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#c98a1e",
  ON_HOLD: "#3b7fc4",
  PAID: "#3f9d5f",
  PROCESSING: "#3b7fc4",
  SHIPPED: "#b45309",
  COMPLETED: "#3f9d5f",
  CANCELLED: "#d0483f",
  REFUNDED: "#8a837a",
};

export default function Dashboard() {
  const { data: s } = useCached("admin/stats", () =>
    api.get<DashboardStats>("/admin/stats").catch(() => null),
  );

  const kpis = [
    { label: "Revenue", value: s ? money(s.kpis.revenue) : "—", icon: DollarSign, tint: "text-good bg-good/10" },
    { label: "Orders", value: s?.kpis.orders ?? "—", icon: ShoppingCart, tint: "text-info bg-info/10" },
    { label: "Customers", value: s?.kpis.customers ?? "—", icon: Users, tint: "text-copper bg-copper/10" },
    { label: "Products", value: s?.kpis.products ?? "—", icon: Package, tint: "text-fg bg-panel-2" },
    { label: "Pending", value: s?.kpis.pendingOrders ?? "—", icon: Clock, tint: "text-warn bg-warn/10" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.tint}`}>
                <c.icon size={17} />
              </div>
              <p className="mt-3 text-2xl font-bold text-fg">{c.value}</p>
              <p className="text-xs text-muted">{c.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-copper" />
              <h2 className="text-sm font-semibold text-fg">Revenue — last 7 days</h2>
            </div>
            {!s ? (
              <div className="skeleton h-44 rounded-xl" />
            ) : s.revenueSeries.every((d) => d.total === 0) ? (
              <Empty label="No revenue in the last 7 days" />
            ) : (
              <AreaChart data={s.revenueSeries} />
            )}
          </Card>
        </motion.div>

        {/* Order status donut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-fg">Order status</h2>
            {s ? <Donut data={s.orderStatus} /> : <div className="skeleton h-44 rounded-xl" />}
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ListCard title="Top selling products" delay={0.34}>
          {s?.topProducts.length ? (
            s.topProducts.map((p, i) => (
              <Row key={i} img={p.image} title={p.name} sub={`Sold: ${p.sales}`} right={money(p.price)} />
            ))
          ) : (
            <Empty label="No sales yet" />
          )}
        </ListCard>

        <ListCard title="Recent orders" delay={0.4}>
          {s?.recentOrders.length ? (
            s.recentOrders.map((o) => (
              <div key={o.orderNumber} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{o.orderNumber}</p>
                  <p className="truncate text-xs text-muted">{o.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={o.status} />
                  <span className="text-sm font-semibold text-fg">{money(o.total)}</span>
                </div>
              </div>
            ))
          ) : (
            <Empty label="No orders yet" />
          )}
        </ListCard>

        <div className="space-y-6">
          <ListCard title="Recent customers" delay={0.46}>
            {s?.recentCustomers.length ? (
              s.recentCustomers.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-copper/12 text-xs font-semibold text-copper-dark">
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <Empty label="No customers yet" />
            )}
          </ListCard>

          <ListCard title="Low stock" delay={0.52} icon={<AlertTriangle size={14} className="text-warn" />}>
            {s?.lowStock.length ? (
              s.lowStock.map((p, i) => (
                <Row key={i} img={p.image} title={p.name} right={`${p.stockQty} left`} rightClass="text-warn" />
              ))
            ) : (
              <Empty label="All well stocked" />
            )}
          </ListCard>
        </div>
      </div>
    </div>
  );
}

/* ---------- pieces ---------- */

function ListCard({
  title,
  children,
  delay = 0,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-5">
        <div className="mb-2 flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
        </div>
        <div className="divide-y divide-line">{children}</div>
      </Card>
    </motion.div>
  );
}

function Row({
  img,
  title,
  sub,
  right,
  rightClass = "text-fg",
}: {
  img?: string | null;
  title: string;
  sub?: string;
  right: string;
  rightClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-panel-2">
        {img && <Image src={img} alt="" fill sizes="36px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{title}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      <span className={`text-sm font-semibold ${rightClass}`}>{right}</span>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-panel-2 text-muted">
        <Inbox size={16} />
      </span>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function AreaChart({ data }: { data: { label: string; total: number }[] }) {
  const w = 520;
  const h = 180;
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.total));
  const step = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => ({
    x: pad + i * step,
    y: h - pad - (d.total / max) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${h - pad} L${pts[0].x},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b45309" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill="url(#rev)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <motion.path
        d={line}
        fill="none"
        stroke="#b45309"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#b45309" />
          <text x={p.x} y={h - 6} textAnchor="middle" className="fill-[#8a837a] text-[10px]">
            {data[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Donut({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0)
    return <p className="py-10 text-center text-sm text-muted">No orders yet</p>;
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
        {data.map((d) => {
          const frac = d.count / total;
          const dash = frac * c;
          const el = (
            <circle
              key={d.status}
              cx={70}
              cy={70}
              r={r}
              fill="none"
              stroke={STATUS_COLORS[d.status] ?? "#8a837a"}
              strokeWidth={16}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="grid w-full grid-cols-2 gap-1.5">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[d.status] ?? "#8a837a" }} />
            <span className="capitalize text-muted">{d.status.toLowerCase().replace(/_/g, " ")}</span>
            <span className="ml-auto font-medium text-fg">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
