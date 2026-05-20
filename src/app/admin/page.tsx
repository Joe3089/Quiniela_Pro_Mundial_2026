import type { Metadata } from "next";
import { AdminView } from "./admin-view";

export const metadata: Metadata = { title: "Panel Admin" };

export default function AdminPage() {
  return <AdminView />;
}
