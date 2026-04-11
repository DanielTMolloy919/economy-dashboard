import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getAllMetrics, getMetricById } from "~/lib/data";

const countrySchema = z.enum(["au", "nz"]);

export const metricsRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ country: countrySchema }).optional())
    .query(({ input }) => {
      return getAllMetrics(input?.country ?? "au");
    }),
  getById: publicProcedure
    .input(z.object({ country: countrySchema.optional(), id: z.string() }))
    .query(({ input }) => {
      return getMetricById(input.country ?? "au", input.id);
    }),
});
