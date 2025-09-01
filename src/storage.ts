// src/storage.ts
import type { User, Truck } from "./types";

export const STORAGE = {
  SESSION: "kierowcaapp.session",
  ASSIGNMENTS: "kierowcaapp.assignments",
  DRIVER_STATE_PREFIX: "kierowcaapp.driverstate:",
  TASKS_PREFIX: "kierowcaapp.tasks:",
};

export const USERS: User[] = [
  { id: "u1", email: "admin@demo.com",  password: "admin",  name: "Admin",        role: "admin"  },
  { id: "u2", email: "driver1@demo.com", password: "driver", name: "Jan Kowalski", role: "driver" },
  { id: "u3", email: "driver2@demo.com", password: "driver", name: "Anna Nowak",   role: "driver" }
];

export const TRUCKS: Truck[] = [];

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c] || c
  );
