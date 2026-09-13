import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "tracker_user";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  const id = Number(raw);
  if (Number.isInteger(id) && id > 0) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user && user.isActive) return user;
  }
  return prisma.user.findFirst({ where: { role: "STUDENT" } });
}