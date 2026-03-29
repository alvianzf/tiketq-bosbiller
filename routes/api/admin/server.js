const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const authMiddleware = require("../../../middleware/authMiddleware");
const adminMiddleware = require("../../../middleware/adminMiddleware");

// Security Configuration: Restricted to the TiketQ root directory
// This is /Users/azfaturrahman/Projects/tiketq in local, 
// and will be /home/ubuntu/tiketq globally.
const ROOT_DIR = path.resolve(__dirname, "../../../../../"); 

const ALLOWED_COMMANDS = {
  "git-pull": "git pull",
  "git-restore": "git restore .",
  "npm-install": "npm install",
  "npm-build": "npm run build",
  "pm2-restart": "pm2 restart", 
  "pm2-stop": "pm2 stop",
  "pm2-start": "pm2 start",
  "pm2-delete": "pm2 delete",
  "prisma-generate": "npx prisma generate",
  "prisma-migrate": "npx prisma migrate deploy",
  "prisma-push": "npx prisma db push",
  "git-clone": "git clone",
  "raw": "DIRECT_EXEC" // Changed from "" to a truthy value
};

// Middleware: Admin Only
router.use(authMiddleware, adminMiddleware);

// Resolve and validate path to prevent breakout
const resolvePath = (reqPath) => {
  const absolutePath = path.resolve(ROOT_DIR, reqPath || ".");
  if (!absolutePath.startsWith(ROOT_DIR)) {
    throw new Error("Access Denied: Path outside of project root.");
  }
  return absolutePath;
};

// GET /api/admin/server/files?path=...
router.get("/files", async (req, res, next) => {
  try {
    const targetPath = resolvePath(req.query.path);
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    
    const files = await Promise.all(entries.map(async (entry) => {
      const entryPath = path.join(targetPath, entry.name);
      const relativePath = path.relative(ROOT_DIR, entryPath);
      const stats = await fs.stat(entryPath);
      
      return {
        name: entry.name,
        path: relativePath,
        isDir: entry.isDirectory(),
        size: stats.size,
        modifiedAt: stats.mtime,
        hasPackageJson: entry.isDirectory() ? await checkPackageJson(entryPath) : false
      };
    }));

    res.json({ message: "Files fetched", data: files });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/server/file?path=...
router.get("/file", async (req, res, next) => {
  try {
    const targetPath = resolvePath(req.query.path);
    const stats = await fs.stat(targetPath);
    
    if (stats.isDirectory()) {
      return res.status(400).json({ error: "Cannot read a directory as a file." });
    }

    const content = await fs.readFile(targetPath, "utf-8");
    res.json({ message: "File read", data: content });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/server/pm2
router.get("/pm2", async (req, res, next) => {
  try {
    exec("pm2 jlist", (error, stdout, stderr) => {
      if (error) {
        // PM2 not found or failed, return empty to avoid crash
        return res.json({ message: "PM2 metrics unavailable", data: [] });
      }
      try {
        const processes = JSON.parse(stdout);
        res.json({ message: "PM2 list fetched", data: processes });
      } catch (e) {
        res.json({ message: "Parsing failed", data: [] });
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/server/execute
router.post("/execute", async (req, res, next) => {
  try {
    const { action, id, customPath } = req.body;
    const workingDir = resolvePath(customPath);
    
    if (!ALLOWED_COMMANDS[action]) {
      return res.status(400).json({ error: "Command not allowed." });
    }

    let command = ALLOWED_COMMANDS[action];
    
    if (action === "raw") {
      if (!req.body.command) return res.status(400).json({ error: "Command string is required for raw execution." });
      command = req.body.command;
    } else if (action === "git-clone") {
      if (!req.body.url) return res.status(400).json({ error: "Git URL is required." });
      command = `git clone ${req.body.url}`;
    } else if (action.startsWith("pm2-")) {
      if (id === undefined) return res.status(400).json({ error: "Process ID/Name is required." });
      command = `${command} ${id}`;
    }

    exec(command, { cwd: workingDir }, (error, stdout, stderr) => {
      res.json({
        message: "Command executed",
        data: {
          exitCode: error ? error.code : 0,
          stdout,
          stderr
        }
      });
    });
  } catch (err) {
    next(err);
  }
});

// Helper: Check if folder contains package.json
async function checkPackageJson(dirPath) {
  try {
    await fs.access(path.join(dirPath, "package.json"));
    return true;
  } catch {
    return false;
  }
}

module.exports = router;
