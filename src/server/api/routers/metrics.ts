import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getAllMetrics, getMetricById } from "~/lib/data";

export const metricsRouter = createTRPCRouter({
  getAll: publicProcedure.query(() => {
    return getAllMetrics();
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return getMetricById(input.id);
    }),
});
