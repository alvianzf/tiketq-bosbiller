const { prisma } = require("../index");

class PageViewDAO {
  async create({ id, sessionId, path, referrer, funnelStep }) {
    // upsert: a page can re-POST the same id (e.g. React StrictMode double-
    // mount in dev, or a retried beacon) without creating duplicate rows.
    return await prisma.pageView.upsert({
      where: { id },
      create: { id, sessionId, path, referrer, funnelStep },
      update: {},
    });
  }

  async setDuration(id, durationMs) {
    try {
      return await prisma.pageView.update({
        where: { id },
        data: { durationMs },
      });
    } catch (err) {
      // Beacon arrived for a view we never recorded (id typo, race with a
      // dropped create) — nothing to update, not worth a 500.
      if (err.code === "P2025") return null;
      throw err;
    }
  }

  async topPages({ since }) {
    const rows = await prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _avg: { durationMs: true },
    });

    // Distinct-session counts per path aren't expressible via groupBy
    // directly (Prisma can't COUNT(DISTINCT) a different column in the same
    // groupBy) — one extra query, fine at this volume.
    const sessionCounts = await prisma.$queryRaw`
      SELECT "path", COUNT(DISTINCT "sessionId")::int AS "uniqueSessions"
      FROM "page_views"
      WHERE "createdAt" >= ${since}
      GROUP BY "path"
    `;
    const sessionsByPath = Object.fromEntries(sessionCounts.map((r) => [r.path, r.uniqueSessions]));

    return rows
      .map((r) => ({
        path: r.path,
        views: r._count._all,
        avgDurationMs: r._avg.durationMs ? Math.round(r._avg.durationMs) : null,
        uniqueSessions: sessionsByPath[r.path] || 0,
      }))
      .sort((a, b) => b.views - a.views);
  }

  async funnelCounts({ since, steps }) {
    const rows = await prisma.pageView.groupBy({
      by: ["funnelStep"],
      where: { createdAt: { gte: since }, funnelStep: { in: steps } },
      _count: { _all: true },
    });
    const countByStep = Object.fromEntries(rows.map((r) => [r.funnelStep, r._count._all]));
    return steps.map((step) => ({ step, count: countByStep[step] || 0 }));
  }
}

module.exports = new PageViewDAO();
