const { PrismaClient } = require("@prisma/client");

// Unextended client — used only to read/write OperationLog itself, so the
// write-logging extension below never recurses into logging its own writes.
const basePrisma = new PrismaClient();

const MUTATING_OPERATIONS = new Set([
  "create", "createMany", "createManyAndReturn",
  "update", "updateMany", "updateManyAndReturn",
  "upsert",
  "delete", "deleteMany",
]);

// Redact field names that routinely carry secrets or passenger PII
// (password hashes, passport numbers, tokens) — this log exists for
// crash-recovery triage, not as a second copy of sensitive data.
const SENSITIVE_KEY_PATTERN = /password|token|secret|apikey|privatekey|passport|cardnumber|cvv|cvc/i;
const MAX_ARGS_JSON_LENGTH = 10000;

// Prisma args can contain Decimal/BigInt/Date values; JSON.stringify handles
// Decimal (it implements toJSON) and Date natively, BigInt needs a replacer.
const safeSerializeArgs = (args) => {
  try {
    const json = JSON.stringify(args, (key, value) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) return "[redacted]";
      return typeof value === "bigint" ? value.toString() : value;
    });
    if (json.length > MAX_ARGS_JSON_LENGTH) {
      return { _truncated: true, preview: json.slice(0, MAX_ARGS_JSON_LENGTH) };
    }
    return JSON.parse(json);
  } catch (err) {
    return { _unserializable: true, reason: err.message };
  }
};

// Every mutating call on any model is recorded here before it runs (status
// RUNNING) and updated after it finishes (COMPLETED/FAILED). This is what
// lets reconcileInterruptedOps() below find writes that were in flight when
// the process died, instead of them just vanishing. Logging is best-effort:
// a failure to write the log never blocks or fails the real query.
const prisma = basePrisma.$extends({
  name: "operation-log",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (model === "OperationLog" || !MUTATING_OPERATIONS.has(operation)) {
          return query(args);
        }

        let logId;
        try {
          const log = await basePrisma.operationLog.create({
            data: { model, operation, args: safeSerializeArgs(args), status: "RUNNING" },
          });
          logId = log.id;
        } catch (err) {
          console.error("OperationLog: failed to record pending write", err);
        }

        try {
          const result = await query(args);
          if (logId) {
            basePrisma.operationLog
              .update({ where: { id: logId }, data: { status: "COMPLETED", finishedAt: new Date() } })
              .catch((err) => console.error("OperationLog: failed to mark completed", err));
          }
          return result;
        } catch (err) {
          if (logId) {
            await basePrisma.operationLog
              .update({ where: { id: logId }, data: { status: "FAILED", error: String(err.message || err), finishedAt: new Date() } })
              .catch((loggingErr) => console.error("OperationLog: failed to mark failed", loggingErr));
          }
          throw err;
        }
      },
    },
  },
});

// Any OperationLog row still RUNNING at boot belongs to a process that died
// (crash, OOM kill, deploy restart) before it could mark the write
// COMPLETED/FAILED — the write itself may or may not have reached the DB.
// These are not auto-retried (the original side effects, e.g. a DANA charge
// or Sindo Ferry booking call, aren't safely re-runnable from args alone) —
// they're marked INTERRUPTED so ops can find and manually reconcile them via
// GET /api/admin/operation-logs?status=INTERRUPTED.
const reconcileInterruptedOps = async () => {
  try {
    const stuck = await basePrisma.operationLog.updateMany({
      where: { status: "RUNNING" },
      data: { status: "INTERRUPTED", finishedAt: new Date() },
    });
    if (stuck.count > 0) {
      console.warn(
        `OperationLog: ${stuck.count} write(s) were still RUNNING from a previous process — marked INTERRUPTED. Review GET /api/admin/operation-logs?status=INTERRUPTED.`
      );
    }
  } catch (err) {
    console.error("OperationLog: failed to reconcile interrupted operations", err);
  }
};

// Every mutation gets a row, forever, unless something prunes them —
// COMPLETED rows are only useful for a short recovery window, so sweep
// anything older than 7 days. FAILED/INTERRUPTED rows are kept (they need a
// human to look at them) and are small in volume by comparison.
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const pruneCompletedLogs = async () => {
  try {
    await basePrisma.operationLog.deleteMany({
      where: { status: "COMPLETED", finishedAt: { lt: new Date(Date.now() - RETENTION_MS) } },
    });
  } catch (err) {
    console.error("OperationLog: failed to prune old completed rows", err);
  }
};

const connectDB = async () => {
  try {
    await basePrisma.$connect();
    console.log("PostgreSQL connected via Prisma");
    await reconcileInterruptedOps();
    await pruneCompletedLogs();
    setInterval(pruneCompletedLogs, 6 * 60 * 60 * 1000).unref();
  } catch (err) {
    // Don't exit: a DB that is down at boot would otherwise crash-loop the whole
    // API (2026-08-11 outage). Prisma connects lazily per query, so the server
    // stays up on non-DB routes and recovers on its own once the DB is back.
    console.error("PostgreSQL connection error (starting anyway):", err);
  }
};

module.exports = connectDB;
module.exports.prisma = prisma;
