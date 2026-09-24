import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const findStudent = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ batch: z.string().min(1).max(5), roll: z.string().min(1).max(10) }).parse(d))
  .handler(async ({ data }) => {
    const { STUDENTS } = await import("@/data/students.server");
    const batch = data.batch.trim().toUpperCase();
    const rollNum = Number(data.roll.replace(/\D/g, ""));
    const match = STUDENTS.find(
      (s) => s.batch === batch && Number(s.roll.replace(/\D/g, "")) === rollNum,
    );
    return match ?? null;
  });
